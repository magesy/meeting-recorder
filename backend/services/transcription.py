import google.generativeai as genai
from core.config import settings
from fastapi import HTTPException
import logging
import os

logger = logging.getLogger(__name__)

MIME_TYPES = {
    ".m4a": "audio/mp4",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".webm": "audio/webm",
    ".ogg": "audio/ogg",
    ".aac": "audio/aac",
}

def transcribe_audio(file_path: str) -> str:
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is not configured")

    genai.configure(api_key=settings.GOOGLE_API_KEY)

    ext = os.path.splitext(file_path)[1].lower()
    mime_type = MIME_TYPES.get(ext, "audio/mp4")

    try:
        uploaded = genai.upload_file(file_path, mime_type=mime_type)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content([
            "Transcribe this audio accurately. Return only the transcript text, nothing else.",
            uploaded
        ])
        return response.text
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
