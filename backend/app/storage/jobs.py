import json
import sqlite3
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from app.models.schemas import JobStatus, ProgressStage


class JobsRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self._lock = threading.Lock()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self) -> None:
        with self._conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS jobs (
                    job_id TEXT PRIMARY KEY,
                    repo_url TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    progress_stage TEXT,
                    message TEXT,
                    error_code TEXT,
                    error_message TEXT,
                    result_json TEXT
                )
                """
            )
            conn.commit()

    @contextmanager
    def _conn(self) -> Any:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def create_job(self, repo_url: str) -> dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        job_id = str(uuid.uuid4())
        with self._lock, self._conn() as conn:
            conn.execute(
                """
                INSERT INTO jobs (job_id, repo_url, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (job_id, repo_url, JobStatus.queued.value, now, now),
            )
            conn.commit()
        return self.get_job(job_id)  # type: ignore[return-value]

    def get_job(self, job_id: str) -> dict[str, Any] | None:
        with self._conn() as conn:
            row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
            return dict(row) if row else None

    def update_job(
        self,
        job_id: str,
        *,
        status: JobStatus | None = None,
        progress_stage: ProgressStage | None = None,
        message: str | None = None,
        error_code: str | None = None,
        error_message: str | None = None,
    ) -> None:
        updates: list[str] = ["updated_at = ?"]
        values: list[Any] = [datetime.now(timezone.utc).isoformat()]
        if status is not None:
            updates.append("status = ?")
            values.append(status.value)
        if progress_stage is not None:
            updates.append("progress_stage = ?")
            values.append(progress_stage.value)
        if message is not None:
            updates.append("message = ?")
            values.append(message)
        if error_code is not None:
            updates.append("error_code = ?")
            values.append(error_code)
        if error_message is not None:
            updates.append("error_message = ?")
            values.append(error_message)
        values.append(job_id)

        with self._lock, self._conn() as conn:
            conn.execute(f"UPDATE jobs SET {', '.join(updates)} WHERE job_id = ?", values)
            conn.commit()

    def set_result(self, job_id: str, result: dict[str, Any]) -> None:
        with self._lock, self._conn() as conn:
            conn.execute(
                """
                UPDATE jobs
                SET result_json = ?, updated_at = ?, status = ?
                WHERE job_id = ?
                """,
                (
                    json.dumps(result),
                    datetime.now(timezone.utc).isoformat(),
                    JobStatus.done.value,
                    job_id,
                ),
            )
            conn.commit()

    def get_result(self, job_id: str) -> dict[str, Any] | None:
        job = self.get_job(job_id)
        if not job:
            return None
        data = job.get("result_json")
        return json.loads(data) if data else None

    def get_recent_done_result_for_repo(self, repo_url: str, ttl_minutes: int) -> dict[str, Any] | None:
        cutoff = (datetime.now(timezone.utc) - timedelta(minutes=ttl_minutes)).isoformat()
        with self._conn() as conn:
            row = conn.execute(
                """
                SELECT result_json
                FROM jobs
                WHERE repo_url = ?
                  AND status = ?
                  AND result_json IS NOT NULL
                  AND updated_at >= ?
                ORDER BY updated_at DESC
                LIMIT 1
                """,
                (repo_url, JobStatus.done.value, cutoff),
            ).fetchone()
        if not row:
            return None
        payload = row["result_json"]
        return json.loads(payload) if payload else None
