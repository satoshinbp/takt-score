from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = (
        "postgresql+psycopg://taktscore:taktscore@localhost:5432/taktscore"
    )
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    DB_ECHO: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
