from fastapi import FastAPI
import os
from backend.core.config import settings

app = FastAPI(title="Meeting Recorder API")

# Ensure UPLOAD_DIR exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
