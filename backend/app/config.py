import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application configuration."""

    # App
    APP_NAME: str = "Ethinos Marketing Platform"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    # Database
    DB_PATH: str = os.getenv("DB_PATH", str(Path(__file__).parent.parent.parent / "ethinos.duckdb"))

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

    # CORS — comma-separated origins in env, list here as default
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,https://ethinos-cdp.pages.dev,https://main.ethinos-cdp.pages.dev"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # Logging
    LOG_DIR: Path = Path(__file__).parent.parent.parent / "logs"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
