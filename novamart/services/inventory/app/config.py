from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"  # silently skip .env fields this service doesn't need

settings = Settings()
