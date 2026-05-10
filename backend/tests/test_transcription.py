import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from backend.main import app
import os
from backend.core.config import settings
import openai

client = TestClient(app)

def test_transcribe_file_not_found():
    response = client.post("/transcribe/nonexistent.mp3")
    assert response.status_code == 404
    assert response.json()["detail"] == "File not found"

@patch("backend.services.transcription.client")
def test_transcribe_success(mock_client):
    # Setup mock
    mock_client.audio.transcriptions.create.return_value = MagicMock(text="This is a test transcript")
    
    # Ensure upload dir exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Create a dummy file to transcribe
    test_filename = "test_audio_for_transcription.mp3"
    test_path = os.path.join(settings.UPLOAD_DIR, test_filename)
    with open(test_path, "wb") as f:
        f.write(b"dummy audio data")
    
    try:
        response = client.post(f"/transcribe/{test_filename}")
        
        assert response.status_code == 200
        assert response.json() == {
            "filename": test_filename,
            "transcript": "This is a test transcript"
        }
        
        # Verify mock calls
        mock_client.audio.transcriptions.create.assert_called_once()
    finally:
        # Cleanup
        if os.path.exists(test_path):
            os.remove(test_path)

@patch("backend.services.transcription.client")
def test_transcribe_rate_limit_error(mock_client):
    # Setup mock to raise RateLimitError
    mock_client.audio.transcriptions.create.side_effect = openai.RateLimitError(
        message="Rate limit exceeded",
        response=MagicMock(),
        body=None
    )
    
    test_filename = "test_rate_limit.mp3"
    test_path = os.path.join(settings.UPLOAD_DIR, test_filename)
    with open(test_path, "wb") as f:
        f.write(b"dummy audio data")
        
    try:
        response = client.post(f"/transcribe/{test_filename}")
        assert response.status_code == 429
        assert "OpenAI Rate Limit Exceeded" in response.json()["detail"]
    finally:
        if os.path.exists(test_path):
            os.remove(test_path)

@patch("backend.services.transcription.client")
def test_transcribe_connection_error(mock_client):
    # Setup mock to raise APIConnectionError
    mock_client.audio.transcriptions.create.side_effect = openai.APIConnectionError(
        request=MagicMock()
    )
    
    test_filename = "test_connection_error.mp3"
    test_path = os.path.join(settings.UPLOAD_DIR, test_filename)
    with open(test_path, "wb") as f:
        f.write(b"dummy audio data")
        
    try:
        response = client.post(f"/transcribe/{test_filename}")
        assert response.status_code == 502
        assert "OpenAI Connection Error" in response.json()["detail"]
    finally:
        if os.path.exists(test_path):
            os.remove(test_path)

@patch("backend.services.transcription.client")
def test_transcribe_api_status_error(mock_client):
    # Setup mock to raise APIStatusError (e.g., 401 Unauthorized)
    mock_client.audio.transcriptions.create.side_effect = openai.APIStatusError(
        message="Unauthorized",
        response=MagicMock(status_code=401),
        body=None
    )
    
    test_filename = "test_status_error.mp3"
    test_path = os.path.join(settings.UPLOAD_DIR, test_filename)
    with open(test_path, "wb") as f:
        f.write(b"dummy audio data")
        
    try:
        response = client.post(f"/transcribe/{test_filename}")
        assert response.status_code == 401
        assert "OpenAI API Error" in response.json()["detail"]
    finally:
        if os.path.exists(test_path):
            os.remove(test_path)
