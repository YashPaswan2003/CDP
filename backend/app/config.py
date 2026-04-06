import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application configuration."""

    # App
    APP_NAME: str = "CDP Marketing Platform"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    # Database
    DB_PATH: str = os.getenv("DB_PATH", str(Path(__file__).parent.parent.parent / "cdp.duckdb"))

    # Logging
    LOG_DIR: Path = Path(__file__).parent.parent.parent / "backend" / "logs"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
