from fastapi.testclient import TestClient
import os
import pytest
from ..main import app
from ..core.config import settings

@pytest.fixture
def cleanup_files():
    files_to_remove = []
    yield files_to_remove
    for file_path in files_to_remove:
        if os.path.exists(file_path):
            os.remove(file_path)

def test_upload_audio_success(cleanup_files):
    filename = "test_audio.wav"
    content = b"fake audio content"
    
    with TestClient(app) as client:
        files = {"file": (filename, content, "audio/wav")}
        response = client.post("/upload", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data["filename"].endswith(filename)
        assert len(data["filename"]) > len(filename)  # Check for UUID prefix
        
        file_path = data["path"]
        cleanup_files.append(file_path)
        assert os.path.exists(file_path)

def test_upload_audio_file_too_large():
    filename = "large_audio.wav"
    # Create content larger than 50MB
    content = b"a" * (50 * 1024 * 1024 + 1)
    
    with TestClient(app) as client:
        files = {"file": (filename, content, "audio/wav")}
        response = client.post("/upload", files=files)
        
        assert response.status_code == 413
        assert "File too large" in response.json()["detail"]

def test_upload_audio_invalid_extension():
    filename = "test_script.sh"
    content = b"echo hello"
    
    with TestClient(app) as client:
        files = {"file": (filename, content, "text/plain")}
        response = client.post("/upload", files=files)
        
        assert response.status_code == 400
        assert "Invalid file type" in response.json()["detail"]

def test_upload_audio_path_traversal(cleanup_files):
    # Testing that it handles path traversal attempts by using only the basename
    filename = "../../../etc/passwd.wav"
    content = b"fake audio"
    
    with TestClient(app) as client:
        files = {"file": (filename, content, "audio/wav")}
        response = client.post("/upload", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data["filename"].endswith("passwd.wav")
        assert len(data["filename"]) > len("passwd.wav")  # Check for UUID prefix
        
        file_path = data["path"]
        cleanup_files.append(file_path)
        assert "etc" not in file_path
