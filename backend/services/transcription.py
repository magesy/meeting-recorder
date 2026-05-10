from groq import Groq
from core.config import settings
from fastapi import HTTPException
import logging
import os

logger = logging.getLogger(__name__)

def transcribe_audio(file_path: str) -> str:
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured")

    client = Groq(api_key=settings.GROQ_API_KEY)

    try:
        with open(file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=audio_file,
            )
        return transcription.text
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
