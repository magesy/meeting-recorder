from fastapi import FastAPI, UploadFile, File, HTTPException
import os
import shutil
from contextlib import asynccontextmanager
from .core.config import settings
from .services.transcription import transcribe_audio
import anyio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure UPLOAD_DIR exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(title="Meeting Recorder API", lifespan=lifespan)

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

def save_upload_file(upload_file: UploadFile, destination: str):
    with open(destination, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Sanitize filename to prevent path traversal
    safe_filename = os.path.basename(file.filename)
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    try:
        # Use anyio to run the synchronous file copy in a thread pool
        # to avoid blocking the event loop.
        await anyio.to_thread.run_sync(save_upload_file, file, file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
    
    return {
        "filename": safe_filename,
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
