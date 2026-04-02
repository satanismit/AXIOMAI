"""
Ideas API routes — generate, save, list, delete ideas.
"""

import os
import uuid
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.verify_token import get_current_user
from app.ideas.engine import generate_ideas
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter()

# Supabase client for fetching paper metadata
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_JWT_SECRET", ""))
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class IdeaRequest(BaseModel):
    paper_ids: List[str]


class SaveIdeaRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    problem: Optional[str] = ""
    solution: Optional[str] = ""
    target_users: Optional[str] = ""
    tech_stack: Optional[str] = ""
    source_papers: Optional[List[str]] = []


@router.post("/generate-ideas")
async def generate_ideas_endpoint(
    req: IdeaRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate startup ideas from 1+ research papers."""
    user_id = current_user["user_id"]

    if len(req.paper_ids) < 1:
        raise HTTPException(status_code=400, detail="Please select at least 1 paper.")

    if len(req.paper_ids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 papers can be used at once.")

    # Fetch paper names from Supabase
    try:
        res = supabase.table("documents").select("id, file_name").in_("id", req.paper_ids).eq("user_id", user_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Could not find selected papers. Ensure they belong to your account.")

        paper_names = {doc["id"]: doc["file_name"] for doc in res.data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[IDEAS] Failed to fetch paper metadata: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # Generate ideas
    try:
        result = generate_ideas(req.paper_ids, paper_names, user_id)
        return {
            **result,
            "papers": paper_names,
        }
    except Exception as e:
        logger.error(f"[IDEAS ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Idea generation failed: {str(e)}")


# ── Save / List / Delete saved ideas ──

@router.post("/ideas/save")
async def save_idea(
    req: SaveIdeaRequest,
    current_user: dict = Depends(get_current_user),
):
    """Save a generated idea to the database."""
    user_id = current_user["user_id"]
    idea_id = str(uuid.uuid4())

    try:
        res = supabase.table("saved_ideas").insert({
            "id": idea_id,
            "user_id": user_id,
            "title": req.title,
            "description": req.description,
            "problem": req.problem,
            "solution": req.solution,
            "target_users": req.target_users,
            "tech_stack": req.tech_stack,
            "source_papers": req.source_papers,
        }).execute()

        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to save idea")

        return {"message": "Idea saved successfully", "idea_id": idea_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[IDEAS SAVE ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save idea: {str(e)}")


@router.get("/ideas/saved")
async def list_saved_ideas(
    current_user: dict = Depends(get_current_user),
):
    """List all saved ideas for the current user."""
    user_id = current_user["user_id"]
    try:
        res = supabase.table("saved_ideas").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"[IDEAS LIST ERROR] {e}")
        return []


@router.delete("/ideas/saved/{idea_id}")
async def delete_saved_idea(
    idea_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a saved idea."""
    user_id = current_user["user_id"]
    try:
        supabase.table("saved_ideas").delete().eq("id", idea_id).eq("user_id", user_id).execute()
        return {"message": "Idea deleted successfully"}
    except Exception as e:
        logger.error(f"[IDEAS DELETE ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete idea: {str(e)}")

