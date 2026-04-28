from time import perf_counter
from math import ceil

from fastapi import Depends

from app.core.config import Settings, settings
from app.core.logging import log_event
from app.models.schemas import ErrorCode, JobStatus, ProgressStage
from app.services.analyzer import run_analysis_pipeline
from app.services.git_ingest import cleanup_temp, clone_and_extract_with_limits
from app.storage.jobs import JobsRepository


class AnalysisOrchestrator:
    def __init__(self, jobs: JobsRepository, cfg: Settings) -> None:
        self.jobs = jobs
        self.settings = cfg

    @staticmethod
    def jobs_dep() -> JobsRepository:
        return _jobs_singleton

    @staticmethod
    def dep() -> "AnalysisOrchestrator":
        return AnalysisOrchestrator(_jobs_singleton, settings)

    def run_job(self, job_id: str) -> None:
        job = self.jobs.get_job(job_id)
        if not job:
            return
        repo_url = job["repo_url"]
        tmp_path = ""
        started = perf_counter()
        self.jobs.update_job(job_id, status=JobStatus.running, progress_stage=ProgressStage.ingest, message="cloning repository")
        log_event("job.start", job_id=job_id, repo_url=repo_url)
        try:
            ingest_started = perf_counter()
            commits, tmp_path = clone_and_extract_with_limits(
                repo_url,
                self.settings.max_commits,
                clone_depth=self.settings.clone_depth,
                max_repo_size_mb=self.settings.max_repo_size_mb,
            )
            log_event(
                "stage.done",
                job_id=job_id,
                stage=ProgressStage.ingest.value,
                duration_ms=max(ceil((perf_counter() - ingest_started) * 1000), 1),
                commit_count=len(commits),
            )

            self.jobs.update_job(job_id, progress_stage=ProgressStage.classify, message="classifying commit history")
            self.jobs.update_job(job_id, progress_stage=ProgressStage.detect, message="detecting decision moments")
            self.jobs.update_job(job_id, progress_stage=ProgressStage.graph, message="building influence graph")
            self.jobs.update_job(job_id, progress_stage=ProgressStage.narrate, message="generating contributor narratives")

            analysis_started = perf_counter()
            result = run_analysis_pipeline(job_id, repo_url, commits)
            analysis_duration_ms = max(ceil((perf_counter() - analysis_started) * 1000), 1)
            log_event("stage.done", job_id=job_id, stage="analyze", duration_ms=analysis_duration_ms)
            total_duration_ms = max(ceil((perf_counter() - started) * 1000), 1)
            if total_duration_ms > (self.settings.max_repo_runtime_seconds * 1000):
                self.jobs.update_job(
                    job_id,
                    status=JobStatus.timeout,
                    error_code=ErrorCode.timeout.value,
                    error_message="Analysis exceeded max runtime.",
                    message="analysis timed out",
                )
                log_event("job.timeout", job_id=job_id, duration_ms=total_duration_ms)
                return
            self.jobs.set_result(job_id, result)
            log_event("job.done", job_id=job_id, duration_ms=total_duration_ms)
        except Exception as exc:  # noqa: BLE001
            status = JobStatus.failed
            code = ErrorCode.internal_error.value
            message = str(exc)
            lowered = message.lower()
            if "repository" in message.lower() or "clone" in message.lower():
                code = ErrorCode.clone_failed.value
                if "too large" in lowered:
                    message = f"Repository exceeds size cap ({self.settings.max_repo_size_mb}MB)."
            elif "parse" in lowered or "decode" in lowered or "commit" in lowered:
                code = ErrorCode.parse_failed.value
            elif "timeout" in lowered:
                status = JobStatus.timeout
                code = ErrorCode.timeout.value
            self.jobs.update_job(
                job_id,
                status=status,
                error_code=code,
                error_message=message[:500],
                message="analysis failed",
            )
            log_event("job.failed", job_id=job_id, error_code=code, error=message)
        finally:
            cleanup_temp(tmp_path)


_jobs_singleton = JobsRepository(settings.db_path)
