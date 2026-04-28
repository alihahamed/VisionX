from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Proof of Thinking Backend"
    app_env: str = "dev"
    db_path: Path = Path("backend/data/jobs.db")
    temp_root: Path = Path("backend/tmp")
    max_repo_runtime_seconds: int = 15
    max_commits: int = 500
    github_host: str = "github.com"

    model_config = SettingsConfigDict(
        env_prefix="POT_",
        extra="ignore",
    )


settings = Settings()
