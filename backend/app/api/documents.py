import os
import uuid
import logging
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime

from app.auth.verify_token import get_current_user
from app.ingestion.pipeline import ingest_pdf
from supabase import create_client, Client

logger = logging.getLogger(__name__)

router = APIRouter()

# Supabase Initialization
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_JWT_SECRET", "")) # Typically needs a service role key for backend DB operations safely, or RLS if we pass user token.
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class DocumentResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    storage_path: str
    file_size: int
    upload_status: str
    created_at: datetime

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: dict = Depends(get_current_user)
):
    """Upload a research paper PDF to Supabase Storage and create a DB record."""
    user_id = current_user["user_id"]
    doc_id = str(uuid.uuid4())
    file_name = file.filename
    storage_path = f"{user_id}/{doc_id}/{file_name}"

    try:
        # Read file contents
        file_bytes = await file.read()
        file_size = len(file_bytes)

        # 1. Upload to Supabase Storage
        res = supabase.storage.from_("research-documents").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )

        # 2. Save metadata in DB
        db_res = supabase.table("documents").insert({
            "id": doc_id,
            "user_id": user_id,
            "file_name": file_name,
            "storage_path": storage_path,
            "file_size": file_size,
            "upload_status": "processing"
        }).execute()

        if not db_res.data:
            raise HTTPException(status_code=500, detail="Failed to save document metadata")

        # Optionally save file locally for the ingestion pipeline or pass the bytes
        # Since ingest_pdf currently expects a local file path (from existing routes.py):
        os.makedirs("uploads", exist_ok=True)
        local_file_path = f"uploads/{doc_id}_{file_name}"
        with open(local_file_path, "wb") as f:
            f.write(file_bytes)

        # 3. Trigger async background task for RAG indexing
        # Note: We need a callback or process to update `upload_status = 'indexed'` when done.
        background_tasks.add_task(process_and_update_status, local_file_path, doc_id, user_id)

        return {
            "message": "Successfully uploaded document.",
            "document_id": doc_id,
            "public_or_signed_url": get_signed_url(storage_path)
        }

    except Exception as e:
        err_msg = str(e)
        logger.error(f"[UPLOAD ERROR] {err_msg}")
        if "PGRST205" in err_msg or "Could not find the table" in err_msg:
            raise HTTPException(status_code=500, detail="Database error: The 'documents' table does not exist. Please run supabase_setup_documents.sql in your Supabase SQL Editor.")
        if "Bucket not found" in err_msg:
            raise HTTPException(status_code=500, detail="Storage error: The 'research-documents' bucket does not exist. Please create it in your Supabase Storage dashboard and ensure it's public/private as needed.")
        raise HTTPException(status_code=500, detail=err_msg)


def process_and_update_status(local_file_path: str, doc_id: str, user_id: str):
    """Helper functional wrapper to run ingestion and then update DB status."""
    try:
        from app.ingestion.pipeline import ingest_pdf
        ingest_pdf(local_file_path, doc_id, user_id)
        supabase.table("documents").update({"upload_status": "indexed"}).eq("id", doc_id).execute()
    except Exception as e:
        logger.error(f"[INGESTION ERROR] {e}")
        supabase.table("documents").update({"upload_status": "failed"}).eq("id", doc_id).execute()
    finally:
        if os.path.exists(local_file_path):
            os.remove(local_file_path)


@router.get("", response_model=List[DocumentResponse])
async def list_user_documents(current_user: dict = Depends(get_current_user)):
    """Fetch previously uploaded documents for the logged-in user."""
    user_id = current_user["user_id"]
    try:
        res = supabase.table("documents").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        err_msg = str(e)
        logger.error(f"[LIST ERROR] {err_msg}")
        # PGRST205: Could not find the table in Postgres schema cache
        if "PGRST205" in err_msg or "Could not find the table" in err_msg:
            logger.warning("[CRITICAL] The 'documents' table does not exist or schema cache is stale.")
            # Gracefully return empty list so the UI doesn't crash on load
            return []
            
        raise HTTPException(status_code=500, detail=err_msg)


@router.get("/{doc_id}")
async def get_document_url(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Generate a signed URL for document retrieval."""
    user_id = current_user["user_id"]
    try:
        res = supabase.table("documents").select("storage_path").eq("id", doc_id).eq("user_id", user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        storage_path = res.data[0]["storage_path"]
        signed_url = get_signed_url(storage_path)
        return {"signed_url": signed_url}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"[URL ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a document from DB and storage."""
    user_id = current_user["user_id"]
    try:
        # Get storage path
        res = supabase.table("documents").select("storage_path").eq("id", doc_id).eq("user_id", user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        storage_path = res.data[0]["storage_path"]

        # Delete from storage
        supabase.storage.from_("research-documents").remove([storage_path])

        # Delete from DB
        supabase.table("documents").delete().eq("id", doc_id).eq("user_id", user_id).execute()
        
        return {"message": "Document deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"[DELETE ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_signed_url(storage_path: str, expires_in: int = 3600):
    try:
        res = supabase.storage.from_("research-documents").create_signed_url(storage_path, expires_in)
        return res.get("signedURL", "")
    except Exception as e:
        logger.error(f"Error creating signed URL: {e}")
        return ""
