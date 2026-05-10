import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from backend.main import app
import os
from backend.core.config import settings

client = TestClient(app)

def test_transcribe_file_not_found():
    response = client.post("/transcribe/nonexistent.mp3")
    assert response.status_code == 404
    assert response.json()["detail"] == "File not found"

@patch("backend.services.transcription.OpenAI")
def test_transcribe_success(mock_openai_class):
    # Setup mock
    mock_client = MagicMock()
    mock_openai_class.return_value = mock_client
    mock_client.audio.transcriptions.create.return_value = MagicMock(text="This is a test transcript")
    
    # Ensure upload dir exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Create a dummy file to transcribe
    test_filename = "test_audio_for_transcription.mp3"
    test_path = os.path.join(settings.UPLOAD_DIR, test_filename)
    with open(test_path, "wb") as f:
        f.write(b"dummy audio data")
    
    try:
        # We need to make sure settings.OPENAI_API_KEY is not None for the service call
        with patch("backend.services.transcription.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = "sk-test-key"
            mock_settings.UPLOAD_DIR = settings.UPLOAD_DIR
            
            response = client.post(f"/transcribe/{test_filename}")
            
            assert response.status_code == 200
            assert response.json() == {
                "filename": test_filename,
                "transcript": "This is a test transcript"
            }
            
            # Verify mock calls
            mock_openai_class.assert_called_once_with(api_key="sk-test-key")
            mock_client.audio.transcriptions.create.assert_called_once()
    finally:
        # Cleanup
        if os.path.exists(test_path):
            os.remove(test_path)
