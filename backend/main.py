import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.api.routes import router

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

app = FastAPI(title="AXIOMAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

def main():
    # Fix for Windows OSError 1455: Disable reload/multiprocessing which duplicates memory
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False, workers=1)

if __name__ == "__main__":
    main()
