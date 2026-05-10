from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    UPLOAD_DIR: str = "uploads"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
