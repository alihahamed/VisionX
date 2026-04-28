from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Proof of Thinking Backend"
    app_env: str = "dev"
    db_path: Path = Path("backend/data/jobs.db")
    temp_root: Path = Path("backend/tmp")
    max_repo_runtime_seconds: int = 12
    max_commits: int = 220
    clone_depth: int = 180
    max_repo_size_mb: int = 120
    cache_ttl_minutes: int = 30
    github_host: str = "github.com"

    model_config = SettingsConfigDict(
        env_prefix="POT_",
        extra="ignore",
    )


settings = Settings()
