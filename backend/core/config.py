from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    GOOGLE_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    UPLOAD_DIR: str = "uploads"
    CORS_ORIGINS: list[str] = ["*"]
    ALLOWED_EXTENSIONS: set[str] = {".wav", ".mp3", ".m4a", ".webm"}
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
