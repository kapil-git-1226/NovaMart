from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    DATABASE_URL: str
    GEMINI_API_KEY: str
    ENVIRONMENT: str = "development"

    class Config:
        # Reaching up 3 levels to the root .env
        env_file = os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
