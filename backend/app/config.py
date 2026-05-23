import json
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = (
        "postgresql+psycopg://taktscore:taktscore@localhost:5432/taktscore"
    )
    # Accepts either JSON (e.g. '["http://localhost:3000"]') or a comma-separated string
    # (e.g. 'http://localhost:3000,https://app.example.com'). NoDecode prevents
    # pydantic-settings from JSON-decoding the env value before our validator runs.
    CORS_ORIGINS: Annotated[list[str], NoDecode] = ["http://localhost:3000"]
    DB_ECHO: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                return json.loads(stripped)
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return value


settings = Settings()
