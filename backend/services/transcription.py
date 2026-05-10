import google.generativeai as genai
from core.config import settings
from fastapi import HTTPException
import logging
import os

logger = logging.getLogger(__name__)

def transcribe_audio(file_path: str) -> str:
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is not configured")

    genai.configure(api_key=settings.GOOGLE_API_KEY)

    try:
        uploaded = genai.upload_file(file_path)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content([
            "Transcribe this audio accurately. Return only the transcript text, nothing else.",
            uploaded
        ])
        return response.text
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
