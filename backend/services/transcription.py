import openai
from openai import OpenAI
from ..core.config import settings
from fastapi import HTTPException

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
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set in configuration")
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    try:
        with open(file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
        return transcription.text
    except openai.RateLimitError as e:
        raise HTTPException(status_code=429, detail=f"OpenAI Rate Limit Exceeded: {str(e)}")
    except openai.APIConnectionError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI Connection Error: {str(e)}")
    except openai.APIStatusError as e:
        raise HTTPException(status_code=e.status_code, detail=f"OpenAI API Error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
