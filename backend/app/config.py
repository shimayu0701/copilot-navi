from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    gemini_api_key: str = ""
    redis_url: str = "redis://redis:6379"
    database_url: str = "sqlite:////app/data/app.db"
    scrape_timeout: int = 30
    scrape_max_retries: int = 3
    llm_model: str = "gemini-2.5-flash-lite"
    llm_temperature: float = 0.3
    llm_max_tokens: int = 8192
    organization_name: str = "Internal Use"
    enable_usage_analytics: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
