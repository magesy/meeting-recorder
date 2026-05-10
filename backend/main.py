from fastapi import FastAPI, UploadFile, File
import os
import shutil
from contextlib import asynccontextmanager
from .core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure UPLOAD_DIR exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(title="Meeting Recorder API", lifespan=lifespan)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {
        "filename": file.filename,
        "path": file_path
    }
