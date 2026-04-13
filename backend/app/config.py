import os
import sys
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List


def _require_secret_key() -> str:
    key = os.getenv("SECRET_KEY")
    if not key:
        print(
            "FATAL: SECRET_KEY environment variable is not set. "
            "Set it to a strong random value before starting the server.",
            file=sys.stderr,
        )
        sys.exit(1)
    return key


class Settings(BaseSettings):
    """Application configuration."""

    # App
    APP_NAME: str = "Ethinos Marketing Platform"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # Database
    DB_PATH: str = os.getenv("DB_PATH", str(Path(__file__).parent.parent.parent / "ethinos.duckdb"))

    # Security — no default; app exits at startup if unset
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

    # CORS — comma-separated origins in env, list here as default
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,https://ethinos-cdp.pages.dev,https://main.ethinos-cdp.pages.dev"
    )

    # Claude AI
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # Logging
    LOG_DIR: Path = Path(__file__).parent.parent.parent / "logs"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
