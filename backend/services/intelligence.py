import google.generativeai as genai
from ..core.config import settings
from fastapi import HTTPException

def generate_mom(transcript: str) -> str:
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is not configured")
    
    try:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        prompt = f"Please generate a professional Minutes of Meeting from this transcript in Thai and English. Highlight key decisions and action items:\n\n{transcript}"
        
        response = model.generate_content(prompt)
        
        if not response.text:
            raise HTTPException(status_code=500, detail="Gemini API returned an empty response")
            
        return response.text
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
