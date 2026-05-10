from fastapi import FastAPI, UploadFile, File, HTTPException
import os
import shutil
import uuid
from contextlib import asynccontextmanager
from .core.config import settings
from .services.transcription import transcribe_audio
from .services.intelligence import generate_mom
import anyio
from pydantic import BaseModel

class MoMRequest(BaseModel):
    transcript: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure UPLOAD_DIR exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(title="Meeting Recorder API", lifespan=lifespan)

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB

@app.get("/health")
async def health_check():
    return {"status": "ok"}

def save_upload_file(upload_file: UploadFile, destination: str):
    with open(destination, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    # Validate file size
    file_size = 0
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size allowed is {MAX_FILE_SIZE / (1024 * 1024)}MB"
        )

    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Sanitize filename and prepend UUID
    original_filename = os.path.basename(file.filename)
    unique_filename = f"{uuid.uuid4()}_{original_filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    try:
        # Use anyio to run the synchronous file copy in a thread pool
        # to avoid blocking the event loop.
        await anyio.to_thread.run_sync(save_upload_file, file, file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
    
    return {
        "filename": unique_filename,
        "path": file_path
    }

@app.post("/transcribe/{filename}")
async def transcribe(filename: str):
    # Sanitize filename to prevent path traversal
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Run synchronous transcription in a thread pool
        transcript = await anyio.to_thread.run_sync(transcribe_audio, file_path)
        return {"filename": safe_filename, "transcript": transcript}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-mom")
async def create_mom(request: MoMRequest):
    try:
        mom = await anyio.to_thread.run_sync(generate_mom, request.transcript)
        return {"mom": mom}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
