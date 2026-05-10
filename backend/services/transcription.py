import openai
from openai import OpenAI
from ..core.config import settings
from fastapi import HTTPException
import logging
import os

logger = logging.getLogger(__name__)

# Instantiate the OpenAI client once at the module level
client = None
if settings.OPENAI_API_KEY:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

def transcribe_audio(file_path: str) -> str:
    """
    Transcribes an audio file using OpenAI's Whisper model.
    """
    global client
    if not client:
        if not settings.OPENAI_API_KEY:
            logger.error("OPENAI_API_KEY is not set in configuration")
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set in configuration")
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    try:
        # OpenAI Whisper API has a 25MB limit
        file_size = os.path.getsize(file_path)
        if file_size > 25 * 1024 * 1024:
            logger.error(f"File size {file_size} exceeds OpenAI's 25MB limit")
            raise HTTPException(
                status_code=413, 
                detail="File exceeds OpenAI's 25MB transcription limit. Please use a shorter recording or a more compressed format."
            )

        with open(file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
        return transcription.text
    except HTTPException as e:
        raise e
    except openai.RateLimitError as e:
        logger.error(f"OpenAI Rate Limit Exceeded: {str(e)}")
        raise HTTPException(status_code=429, detail=f"OpenAI Rate Limit Exceeded: {str(e)}")
    except openai.APIConnectionError as e:
        logger.error(f"OpenAI Connection Error: {str(e)}")
        raise HTTPException(status_code=502, detail=f"OpenAI Connection Error: {str(e)}")
    except openai.APIStatusError as e:
        logger.error(f"OpenAI API Error ({e.status_code}): {str(e)}")
        raise HTTPException(status_code=e.status_code, detail=f"OpenAI API Error: {str(e)}")
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
