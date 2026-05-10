import google.generativeai as genai
from core.config import settings
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

def _ensure_configured():
    """Ensure Gemini is configured with the API key."""
    if not settings.GOOGLE_API_KEY:
        logger.error("GOOGLE_API_KEY is not configured")
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is not configured")
    
    # google-generativeai configuration is global, so we can just call it.
    # It's lightweight enough to call, but we can wrap it if needed.
    genai.configure(api_key=settings.GOOGLE_API_KEY)

def generate_mom(transcript: str) -> str:
    try:
        _ensure_configured()
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        prompt = (
            "You are a professional secretary. Please generate a Minutes of Meeting (MoM) from the provided transcript. "
            "The output MUST include two sections: one in Thai and one in English. "
            "For each section, provide the following structure:\n"
            "1. Meeting Overview\n"
            "2. Key Discussion Points\n"
            "3. Decisions Made\n"
            "4. Action Items (with owners if mentioned)\n\n"
            "Transcript:\n"
            f"{transcript}"
        )
        
        response = model.generate_content(prompt)
        
        if not response.text:
            logger.error("Gemini API returned an empty response")
            raise HTTPException(status_code=500, detail="Gemini API returned an empty response")
            
        return response.text
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Gemini API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
