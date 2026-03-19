import logging
from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
import shutil
import os

from app.ingestion.pipeline import ingest_pdf
from app.agents.router_agent import low_latency_router
from app.summary.engine import generate_structured_summary
from app.tts.service import generate_audio

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatRequest(BaseModel):
    query: str


class TTSRequest(BaseModel):
    text: str


@router.post("/upload")
async def upload_paper(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    background_tasks.add_task(ingest_pdf, file_path)

    return {"message": f"Successfully uploaded {file.filename}. Indexing started in background."}


@router.post("/chat")
async def chat_interaction(req: ChatRequest):
    """Always returns JSON. Never hangs."""
    try:
        response = low_latency_router(req.query)
        return response
    except Exception as e:
        logger.error(f"[CHAT ERROR] {e}")
        return {
            "answer": f"Backend error: {str(e)}",
            "sources": [],
            "routed_to_web": False,
        }


@router.post("/summary")
async def get_summary(file_name: str):
    file_path = f"uploads/{file_name}"
    if not os.path.exists(file_path):
        return {"error": "File not found"}

    try:
        summary = generate_structured_summary(file_path)
        return {"summary": summary}
    except Exception as e:
        logger.error(f"[SUMMARY ERROR] {e}")
        return {"error": f"Summary generation failed: {str(e)}"}


@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    try:
        res = generate_audio(req.text)
        return res
    except Exception as e:
        logger.error(f"[TTS ERROR] {e}")
        return {"error": f"TTS failed: {str(e)}"}
