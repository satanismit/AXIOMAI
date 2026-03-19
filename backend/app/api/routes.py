from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
import shutil
import os

from app.ingestion.pipeline import ingest_pdf
from app.agents.router_agent import low_latency_router
from app.summary.engine import generate_structured_summary
from app.tts.service import generate_audio

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
    
    # Run ingestion sequentially in background to avoid blocking the user API response latency
    background_tasks.add_task(ingest_pdf, file_path)
    
    return {"message": f"Successfully uploaded {file.filename}. Document ingestion and embedding indexing started in background."}

@router.post("/chat")
async def chat_interaction(req: ChatRequest):
    # Utilize our low-latency similarity router
    response = low_latency_router(req.query)
    return response

@router.post("/summary")
async def get_summary(file_name: str):
    file_path = f"uploads/{file_name}"
    if not os.path.exists(file_path):
         return {"error": "File not found"}
        
    summary = generate_structured_summary(file_path)
    return {"summary": summary}

@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    res = generate_audio(req.text)
    return res
