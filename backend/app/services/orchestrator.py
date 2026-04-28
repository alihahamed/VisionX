from time import perf_counter

from fastapi import Depends

from app.core.config import Settings, settings
from app.core.logging import log_event
from app.models.schemas import ErrorCode, JobStatus, ProgressStage
from app.services.analyzer import run_analysis_pipeline
from app.services.git_ingest import cleanup_temp, clone_and_extract
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
            commits, tmp_path = clone_and_extract(repo_url, self.settings.max_commits)

            self.jobs.update_job(job_id, progress_stage=ProgressStage.classify, message="classifying commit history")
            self.jobs.update_job(job_id, progress_stage=ProgressStage.detect, message="detecting decision moments")
            self.jobs.update_job(job_id, progress_stage=ProgressStage.graph, message="building influence graph")
            self.jobs.update_job(job_id, progress_stage=ProgressStage.narrate, message="generating contributor narratives")

            result = run_analysis_pipeline(job_id, repo_url, commits)
            self.jobs.set_result(job_id, result)
            log_event("job.done", job_id=job_id, duration_ms=int((perf_counter() - started) * 1000))
        except Exception as exc:  # noqa: BLE001
            status = JobStatus.failed
            code = ErrorCode.internal_error.value
            message = str(exc)
            if "repository" in message.lower() or "clone" in message.lower():
                code = ErrorCode.clone_failed.value
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
