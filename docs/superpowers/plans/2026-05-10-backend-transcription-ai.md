# Meeting Recorder Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python/FastAPI backend that handles audio uploads, transcribes them using OpenAI Whisper, and generates Minutes of Meeting (MoM) using Google Gemini.

**Architecture:** A stateless FastAPI service with service-level abstractions for transcription and AI processing. It uses temporary local storage for audio files during processing.

**Tech Stack:** Python 3.10+, FastAPI, Uvicorn, OpenAI API (Whisper), Google Generative AI (Gemini), `python-multipart` for file uploads.

---

### Task 1: Project Setup

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/core/config.py`
- Create: `backend/main.py`
- Test: `backend/tests/test_health.py`

- [ ] **Step 1: Create requirements.txt**
```text
fastapi
uvicorn
python-multipart
openai
google-generativeai
pydantic-settings
pytest
httpx
```

- [ ] **Step 2: Create config.py for environment variables**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OPENAI_API_KEY: str
    GOOGLE_API_KEY: str
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 3: Create minimal FastAPI app**
```python
import os
from fastapi import FastAPI
from .core.config import settings

app = FastAPI(title="Meeting Recorder API")

if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR)

@app.get("/health")
def health_check():
    return {"status": "ok"}
```

- [ ] **Step 4: Write health check test**
```python
from fastapi.testclient import TestClient
from ..main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 5: Run tests and commit**
Run: `cd backend && pytest backend/tests/test_health.py`
Commit: `git add backend && git commit -m "chore: initial backend setup"`

---

### Task 2: Audio Upload Endpoint

**Files:**
- Modify: `backend/main.py`
- Test: `backend/tests/test_upload.py`

- [ ] **Step 1: Implement upload endpoint**
```python
from fastapi import UploadFile, File
import shutil

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "path": file_path}
```

- [ ] **Step 2: Write upload test**
```python
def test_upload_audio():
    content = b"fake audio content"
    files = {"file": ("test.wav", content, "audio/wav")}
    response = client.post("/upload", files=files)
    assert response.status_code == 200
    assert response.json()["filename"] == "test.wav"
```

- [ ] **Step 3: Run tests and commit**
Run: `cd backend && pytest backend/tests/test_upload.py`

---

### Task 3: Whisper Transcription Service

**Files:**
- Create: `backend/services/transcription.py`
- Modify: `backend/main.py`

- [ ] **Step 1: Implement Whisper service**
```python
from openai import OpenAI
from ..core.config import settings

client_ai = OpenAI(api_key=settings.OPENAI_API_KEY)

def transcribe_audio(file_path: str) -> str:
    with open(file_path, "rb") as audio_file:
        transcript = client_ai.audio.transcriptions.create(
            model="whisper-1", 
            file=audio_file,
            language="th" # Initial focus on Thai/Mixed
        )
    return transcript.text
```

- [ ] **Step 2: Add transcribe endpoint**
```python
@app.post("/transcribe/{filename}")
async def get_transcript(filename: str):
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    text = transcribe_audio(file_path)
    return {"transcript": text}
```

- [ ] **Step 3: Commit**
`git commit -m "feat: add whisper transcription service"`

---

### Task 4: Gemini MoM Generation Service

**Files:**
- Create: `backend/services/intelligence.py`
- Modify: `backend/main.py`

- [ ] **Step 1: Implement Gemini service**
```python
import google.generativeai as genai
from ..core.config import settings

genai.configure(api_key=settings.GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')

def generate_mom(transcript: str) -> str:
    prompt = f"Please generate a professional Minutes of Meeting from this transcript in Thai and English. Highlight key decisions and action items:\n\n{transcript}"
    response = model.generate_content(prompt)
    return response.text
```

- [ ] **Step 2: Add MoM endpoint**
```python
@app.post("/generate-mom")
async def create_mom(transcript: str):
    mom_text = generate_mom(transcript)
    return {"mom": mom_text}
```

- [ ] **Step 3: Commit**
`git commit -m "feat: add gemini mom generation service"`
