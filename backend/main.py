from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import uuid
import logging
from contextlib import asynccontextmanager
from core.config import settings
from core.logging_config import setup_logging
from services.transcription import transcribe_audio
from services.intelligence import generate_mom
import anyio
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class MoMRequest(BaseModel):
    transcript: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup logging
    setup_logging()
    logger.info("Starting Meeting Recorder API")
    
    # Ensure UPLOAD_DIR exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield
    logger.info("Shutting down Meeting Recorder API")

app = FastAPI(title="Meeting Recorder API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
    if file_size > settings.MAX_FILE_SIZE:
        logger.warning(f"File upload rejected: too large ({file_size} bytes)")
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size allowed is {settings.MAX_FILE_SIZE / (1024 * 1024)}MB"
        )

    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        logger.warning(f"File upload rejected: invalid extension ({file_ext})")
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Sanitize filename and prepend UUID
    original_filename = os.path.basename(file.filename)
    unique_filename = f"{uuid.uuid4()}_{original_filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    try:
        # Use anyio to run the synchronous file copy in a thread pool
        await anyio.to_thread.run_sync(save_upload_file, file, file_path)
        logger.info(f"File uploaded successfully: {unique_filename}")
    except Exception as e:
        logger.error(f"Failed to save uploaded file: {str(e)}")
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
        logger.warning(f"Transcription requested for non-existent file: {safe_filename}")
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        logger.info(f"Starting transcription for {safe_filename}")
        # Run synchronous transcription in a thread pool
        transcript = await anyio.to_thread.run_sync(transcribe_audio, file_path)
        logger.info(f"Transcription completed for {safe_filename}")
        return {"filename": safe_filename, "transcript": transcript}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription failed for {safe_filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/files/{filename}")
async def delete_file(filename: str):
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        logger.info(f"Deleted file: {safe_filename}")
    return {"status": "ok"}

@app.post("/generate-mom")
async def create_mom(request: MoMRequest):
    try:
        logger.info("Generating MoM from transcript")
        mom = await anyio.to_thread.run_sync(generate_mom, request.transcript)
        logger.info("MoM generation successful")
        return {"mom": mom}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MoM generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
