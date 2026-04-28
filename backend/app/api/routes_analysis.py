from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.models.schemas import (
    AnalysisCreateRequest,
    AnalysisCreateResponse,
    AnalysisJobResponse,
    AnalysisResultResponse,
    ErrorCode,
    ErrorDetail,
    ErrorEnvelope,
    JobStatus,
)
from app.services.git_ingest import validate_public_github_url
from app.services.orchestrator import AnalysisOrchestrator
from app.storage.jobs import JobsRepository

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def _job_response(job: dict) -> AnalysisJobResponse:
    return AnalysisJobResponse(
        job_id=job["job_id"],
        status=JobStatus(job["status"]),
        created_at=datetime.fromisoformat(job["created_at"]),
        updated_at=datetime.fromisoformat(job["updated_at"]),
        progress_stage=job.get("progress_stage"),
        message=job.get("message"),
    )


@router.post(
    "",
    response_model=AnalysisCreateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    responses={400: {"model": ErrorEnvelope}},
)
def create_analysis(
    body: AnalysisCreateRequest,
    background_tasks: BackgroundTasks,
    orchestrator: AnalysisOrchestrator = Depends(AnalysisOrchestrator.dep),
):
    if not validate_public_github_url(str(body.repo_url), orchestrator.settings.github_host):
        raise HTTPException(
            status_code=400,
            detail=ErrorEnvelope(
                error=ErrorDetail(
                    code=ErrorCode.invalid_repo,
                    message="Only public https://github.com/<owner>/<repo> URLs are accepted.",
                    retryable=False,
                )
            ).model_dump(),
        )

    job = orchestrator.jobs.create_job(str(body.repo_url))
    background_tasks.add_task(orchestrator.run_job, job["job_id"])
    return AnalysisCreateResponse(
        job_id=job["job_id"],
        status=JobStatus.queued,
        created_at=datetime.fromisoformat(job["created_at"]),
    )


@router.get(
    "/{job_id}",
    response_model=AnalysisJobResponse,
    responses={404: {"model": ErrorEnvelope}},
)
def get_analysis_job(job_id: str, jobs: JobsRepository = Depends(AnalysisOrchestrator.jobs_dep)):
    job = jobs.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=404,
            detail=ErrorEnvelope(
                error=ErrorDetail(
                    code=ErrorCode.not_found,
                    message="Job not found.",
                    retryable=False,
                )
            ).model_dump(),
        )
    return _job_response(job)


@router.get(
    "/{job_id}/result",
    response_model=AnalysisResultResponse,
    responses={404: {"model": ErrorEnvelope}, 409: {"model": ErrorEnvelope}},
)
def get_analysis_result(job_id: str, jobs: JobsRepository = Depends(AnalysisOrchestrator.jobs_dep)):
    job = jobs.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=404,
            detail=ErrorEnvelope(
                error=ErrorDetail(
                    code=ErrorCode.not_found,
                    message="Job not found.",
                    retryable=False,
                )
            ).model_dump(),
        )
    if job["status"] != JobStatus.done.value:
        raise HTTPException(
            status_code=409,
            detail=ErrorEnvelope(
                error=ErrorDetail(
                    code=ErrorCode.not_ready,
                    message="Result not ready yet.",
                    retryable=True,
                )
            ).model_dump(),
        )
    result = jobs.get_result(job_id)
    if not result:
        raise HTTPException(
            status_code=500,
            detail=ErrorEnvelope(
                error=ErrorDetail(
                    code=ErrorCode.internal_error,
                    message="Result missing for completed job.",
                    retryable=False,
                )
            ).model_dump(),
        )
    return AnalysisResultResponse.model_validate(result)


@router.get("/{job_id}/timeline")
def get_timeline(job_id: str, jobs: JobsRepository = Depends(AnalysisOrchestrator.jobs_dep)):
    result = _require_result(jobs, job_id)
    return {"job_id": job_id, "decisions": result["decisions"]}


@router.get("/{job_id}/graph")
def get_graph(job_id: str, jobs: JobsRepository = Depends(AnalysisOrchestrator.jobs_dep)):
    result = _require_result(jobs, job_id)
    return {"job_id": job_id, "graph": result["graph"]}


@router.get("/{job_id}/contributors/{contributor_id}")
def get_contributor(job_id: str, contributor_id: str, jobs: JobsRepository = Depends(AnalysisOrchestrator.jobs_dep)):
    result = _require_result(jobs, job_id)
    for contributor in result["contributors"]:
        if contributor["contributor_id"] == contributor_id:
            return {"job_id": job_id, "contributor": contributor}
    raise HTTPException(
        status_code=404,
        detail=ErrorEnvelope(
            error=ErrorDetail(
                code=ErrorCode.not_found,
                message="Contributor not found for this job.",
                retryable=False,
            )
        ).model_dump(),
    )


def _require_result(jobs: JobsRepository, job_id: str) -> dict:
    job = jobs.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=404,
            detail=ErrorEnvelope(
                error=ErrorDetail(code=ErrorCode.not_found, message="Job not found.", retryable=False)
            ).model_dump(),
        )
    if job["status"] != JobStatus.done.value:
        raise HTTPException(
            status_code=409,
            detail=ErrorEnvelope(
                error=ErrorDetail(code=ErrorCode.not_ready, message="Result not ready yet.", retryable=True)
            ).model_dump(),
        )
    result = jobs.get_result(job_id)
    if not result:
        raise HTTPException(
            status_code=500,
            detail=ErrorEnvelope(
                error=ErrorDetail(code=ErrorCode.internal_error, message="Result missing.", retryable=False)
            ).model_dump(),
        )
    return result
