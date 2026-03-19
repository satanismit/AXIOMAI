from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.routes import router as api_router
import os

app = FastAPI(title="PaperMind AI", description="Intelligent Research Copilot API")

# Serve generated audio files directly so the UI can playback the URLs
os.makedirs("app/static/audio", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Connect our API router containing the endpoints
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "PaperMind AI Backend is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "PaperMind AI API is alive."}
