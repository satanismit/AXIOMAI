import logging
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends
from pydantic import BaseModel
import shutil
import os

from app.ingestion.pipeline import ingest_pdf
from app.agents.router_agent import low_latency_router
from app.summary.engine import generate_structured_summary
from app.tts.service import generate_audio
from app.auth.verify_token import get_current_user
from app.api.documents import router as documents_router
from app.comparison.routes import router as comparison_router
from app.ideas.routes import router as ideas_router

logger = logging.getLogger(__name__)

router = APIRouter()
router.include_router(documents_router, prefix="/documents", tags=["documents"])
router.include_router(comparison_router, tags=["comparison"])
router.include_router(ideas_router, tags=["ideas"])


class ChatRequest(BaseModel):
    query: str
    document_id: str


class TTSRequest(BaseModel):
    text: str


@router.post("/upload")
async def upload_paper(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: dict = Depends(get_current_user),
):
    """Upload a research paper PDF. Requires valid Supabase JWT."""
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    background_tasks.add_task(ingest_pdf, file_path)

    return {
        "message": f"Successfully uploaded {file.filename}. Indexing started in background.",
        "user_id": current_user["user_id"],
    }


@router.post("/chat")
async def chat_interaction(
    req: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """RAG/web chat endpoint. Requires valid Supabase JWT."""
    try:
        response = low_latency_router(req.query, req.document_id, current_user["user_id"])
        return response
    except Exception as e:
        logger.error(f"[CHAT ERROR] {e}")
        return {
            "answer": f"Backend error: {str(e)}",
            "sources": [],
            "routed_to_web": False,
        }


@router.post("/summary")
async def get_summary(
    document_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Generate structured paper summary by downloading PDF from Supabase Storage."""
    user_id = current_user["user_id"]

    try:
        # 1. Get storage path from documents table
        from supabase import create_client
        from dotenv import load_dotenv
        load_dotenv()
        sb_url = os.getenv("SUPABASE_URL", "")
        sb_key = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_JWT_SECRET", ""))
        sb = create_client(sb_url, sb_key)

        res = sb.table("documents").select("storage_path, file_name").eq("id", document_id).eq("user_id", user_id).execute()
        if not res.data:
            return {"error": "Document not found"}

        storage_path = res.data[0]["storage_path"]
        file_name = res.data[0]["file_name"]

        # 2. Download from Supabase Storage to temp local file
        file_bytes = sb.storage.from_("research-documents").download(storage_path)
        os.makedirs("uploads", exist_ok=True)
        temp_path = f"uploads/_summary_{document_id}_{file_name}"
        with open(temp_path, "wb") as f:
            f.write(file_bytes)

        # 3. Generate summary
        summary = generate_structured_summary(temp_path)

        # 4. Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return {"summary": summary}
    except Exception as e:
        logger.error(f"[SUMMARY ERROR] {e}")
        return {"error": f"Summary generation failed: {str(e)}"}


@router.post("/tts")
async def text_to_speech(
    req: TTSRequest,
    current_user: dict = Depends(get_current_user),
):
    """Text-to-speech generation. Requires valid Supabase JWT."""
    try:
        res = generate_audio(req.text)
        return res
    except Exception as e:
        logger.error(f"[TTS ERROR] {e}")
        return {"error": f"TTS failed: {str(e)}"}

