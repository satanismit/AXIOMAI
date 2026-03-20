"""
app/auth/verify_token.py

FastAPI dependency that verifies a Supabase-issued JWT.

Flow:
  1. Extract `Authorization: Bearer <token>` from the request header.
  2. Fetch Supabase JWKS (cached in-memory for 1 hour) to get the public key.
  3. Decode & verify the JWT using python-jose.
  4. Return the decoded payload (user_id = payload["sub"]).
  5. Raise HTTP 401 on any failure.
"""

import os
import time
import logging
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")  # HS256 secret from Supabase dashboard

# ---------------------------------------------------------------------------
# Simple in-process JWKS cache (for RS256 setups). Supabase typically uses
# HS256 with the JWT secret directly, so we support both.
# ---------------------------------------------------------------------------
_jwks_cache: Optional[dict] = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL_SECONDS = 3600  # re-fetch every hour

bearer_scheme = HTTPBearer(auto_error=False)


async def _get_jwks() -> dict:
    """Fetch Supabase JWKS endpoint (RS256). Cached for 1 hour."""
    global _jwks_cache, _jwks_fetched_at
    now = time.monotonic()
    if _jwks_cache and (now - _jwks_fetched_at) < _JWKS_TTL_SECONDS:
        return _jwks_cache
    jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_fetched_at = now
    return _jwks_cache


def _decode_hs256(token: str) -> dict:
    """Verify JWT signed with Supabase JWT secret (HS256)."""
    return jwt.decode(
        token,
        SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        options={"verify_aud": False},  # Supabase does not set aud on all tokens
    )


async def _decode_rs256(token: str) -> dict:
    """Verify JWT signed with Supabase RSA key (RS256) using JWKS."""
    from jose.jwt import get_unverified_header
    from jose import jwk

    header = get_unverified_header(token)
    kid = header.get("kid")
    jwks = await _get_jwks()
    public_key = None
    for key_data in jwks.get("keys", []):
        if key_data.get("kid") == kid:
            public_key = jwk.construct(key_data)
            break
    if not public_key:
        raise JWTError("Public key not found in JWKS for kid: " + str(kid))
    return jwt.decode(
        token,
        public_key,
        algorithms=["RS256"],
        options={"verify_aud": False},
    )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency.
    Returns the decoded JWT payload dict (contains 'sub' = user UUID).
    Raises HTTP 401 if token is absent or invalid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        raise credentials_exception

    token = credentials.credentials

    try:
        # Prefer HS256 (most common Supabase setup) if secret is configured.
        if SUPABASE_JWT_SECRET:
            payload = _decode_hs256(token)
        else:
            # Fall back to RS256 via JWKS
            payload = await _decode_rs256(token)
    except JWTError as exc:
        logger.warning(f"[AUTH] JWT verification failed: {exc}")
        raise credentials_exception

    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise credentials_exception

    return {"user_id": user_id, "payload": payload}
