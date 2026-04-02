"""
Comparison API routes — POST /compare endpoint.
"""

import os
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.verify_token import get_current_user
from app.comparison.engine import compare_papers
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter()

# Supabase client for fetching paper metadata
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_JWT_SECRET", ""))
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class CompareRequest(BaseModel):
    paper_ids: List[str]


@router.post("/compare")
async def compare_endpoint(
    req: CompareRequest,
    current_user: dict = Depends(get_current_user),
):
    """Compare 2+ research papers. Returns structured JSON comparison."""
    user_id = current_user["user_id"]

    if len(req.paper_ids) < 2:
        raise HTTPException(status_code=400, detail="Please select at least 2 papers to compare.")

    if len(req.paper_ids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 papers can be compared at once.")

    # Fetch paper names from Supabase for better LLM context
    try:
        res = supabase.table("documents").select("id, file_name").in_("id", req.paper_ids).eq("user_id", user_id).execute()

        if not res.data or len(res.data) < 2:
            raise HTTPException(status_code=404, detail="Could not find selected papers. Ensure they belong to your account.")

        paper_names = {doc["id"]: doc["file_name"] for doc in res.data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[COMPARE] Failed to fetch paper metadata: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # Run comparison
    try:
        result = compare_papers(req.paper_ids, paper_names, user_id)
        return {
            "comparison": result,
            "papers": paper_names,
        }
    except Exception as e:
        logger.error(f"[COMPARE ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")
