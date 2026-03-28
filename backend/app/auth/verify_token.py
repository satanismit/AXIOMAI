"""
app/auth/verify_token.py

FastAPI dependency that verifies a Supabase-issued JWT.

Supabase uses ES256 (ECDSA) signing. We fetch the public key from
the JWKS endpoint to verify tokens.
"""

import os
import json
import base64
import time
import logging
from typing import Optional

from dotenv import load_dotenv
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt as jose_jwt, JWTError, jwk

load_dotenv()

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

logger.info(f"[AUTH] SUPABASE_URL loaded: {'YES' if SUPABASE_URL else 'NO'}")
logger.info(f"[AUTH] JWT Secret loaded: {'YES (' + str(len(SUPABASE_JWT_SECRET)) + ' chars)' if SUPABASE_JWT_SECRET else 'NO'}")

bearer_scheme = HTTPBearer(auto_error=False)

# ---------------------------------------------------------------------------
# JWKS cache for ES256 / RS256 public key verification
# ---------------------------------------------------------------------------
_jwks_cache: Optional[dict] = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL_SECONDS = 3600  # re-fetch every hour


def _get_token_header(token: str) -> dict:
    """Decode the JWT header without verification."""
    header_segment = token.split(".")[0]
    padding = 4 - len(header_segment) % 4
    if padding != 4:
        header_segment += "=" * padding
    return json.loads(base64.urlsafe_b64decode(header_segment))


def _fetch_jwks_sync() -> dict:
    """Fetch Supabase JWKS endpoint synchronously. Cached for 1 hour."""
    global _jwks_cache, _jwks_fetched_at
    now = time.monotonic()
    if _jwks_cache and (now - _jwks_fetched_at) < _JWKS_TTL_SECONDS:
        return _jwks_cache

    jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    logger.info(f"[AUTH] Fetching JWKS from: {jwks_url}")

    with httpx.Client(timeout=10.0) as client:
        resp = client.get(jwks_url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_fetched_at = now
        logger.info(f"[AUTH] JWKS fetched successfully, {len(_jwks_cache.get('keys', []))} key(s)")

    return _jwks_cache


def _verify_with_jwks(token: str, algorithm: str) -> dict:
    """Verify a JWT using the public key from Supabase JWKS (for ES256/RS256)."""
    header = _get_token_header(token)
    kid = header.get("kid")
    logger.info(f"[AUTH] Token kid: {kid}, alg: {algorithm}")

    jwks_data = _fetch_jwks_sync()
    keys = jwks_data.get("keys", [])

    # Find the matching key
    matching_key = None
    for key_data in keys:
        if kid and key_data.get("kid") == kid:
            matching_key = key_data
            break
    
    # If no kid match, use the first key with matching algorithm
    if not matching_key:
        for key_data in keys:
            if key_data.get("alg") == algorithm or key_data.get("kty") in ("EC", "RSA"):
                matching_key = key_data
                break

    if not matching_key:
        raise JWTError(f"No matching public key found in JWKS for kid={kid}")

    logger.info(f"[AUTH] Using JWKS key: kid={matching_key.get('kid')}, kty={matching_key.get('kty')}")

    # Construct the public key and verify
    public_key = jwk.construct(matching_key)
    payload = jose_jwt.decode(
        token,
        public_key,
        algorithms=[algorithm],
        options={"verify_aud": False},
    )
    return payload


def _verify_with_secret(token: str) -> dict:
    """Verify a JWT using the HS256 shared secret."""
    return jose_jwt.decode(
        token,
        SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        options={"verify_aud": False},
    )


def verify_token(token: str) -> dict:
    """
    Detect algorithm from token header and verify accordingly.
    - HS256: uses SUPABASE_JWT_SECRET
    - ES256/RS256: uses public key from JWKS endpoint
    """
    header = _get_token_header(token)
    alg = header.get("alg", "HS256")
    logger.info(f"[AUTH] Token algorithm: {alg}")

    if alg == "HS256":
        return _verify_with_secret(token)
    elif alg in ("ES256", "RS256", "ES384", "RS384", "ES512", "RS512"):
        return _verify_with_jwks(token, alg)
    else:
        raise JWTError(f"Unsupported algorithm: {alg}")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency.
    Returns dict with 'user_id' (= JWT 'sub' claim).
    Raises HTTP 401 on any failure.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        logger.warning("[AUTH] No credentials provided in request")
        raise credentials_exception

    token = credentials.credentials
    logger.info(f"[AUTH] Received token (first 20 chars): {token[:20]}...")

    try:
        payload = verify_token(token)
    except Exception as exc:
        logger.warning(f"[AUTH] JWT verification failed: {exc}")
        raise credentials_exception

    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        logger.warning("[AUTH] Token has no 'sub' claim")
        raise credentials_exception

    logger.info(f"[AUTH] Authenticated user: {user_id}")
    return {"user_id": user_id, "payload": payload}
