from fastapi.testclient import TestClient
import os
from ..main import app
from ..core.config import settings

client = TestClient(app)

def test_upload_audio():
    # Create a dummy file
    filename = "test_audio.wav"
    content = b"fake audio content"
    
    # Use TestClient as context manager to ensure lifespan (makedirs) runs
    with TestClient(app) as client:
        files = {"file": (filename, content, "audio/wav")}
        response = client.post("/upload", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == filename
        assert filename in data["path"]
        
        # Verify file exists on disk
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        assert os.path.exists(file_path)
        
        # Clean up
        if os.path.exists(file_path):
            os.remove(file_path)
