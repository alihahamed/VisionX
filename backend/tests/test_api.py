from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import JobStatus
from app.services.orchestrator import _jobs_singleton

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_reject_invalid_repo_url():
    res = client.post("/api/analysis", json={"repo_url": "http://example.com/repo"})
    assert res.status_code == 400
    assert res.json()["detail"]["error"]["code"] == "invalid_repo"


def test_get_unknown_job():
    res = client.get("/api/analysis/does-not-exist")
    assert res.status_code == 404
    assert res.json()["detail"]["error"]["code"] == "not_found"


def test_done_result_roundtrip():
    job = _jobs_singleton.create_job("https://github.com/octocat/Hello-World")
    _jobs_singleton.set_result(
        job["job_id"],
        {
            "job_id": job["job_id"],
            "project": {
                "name": "Hello-World",
                "repo_url": "https://github.com/octocat/Hello-World",
                "commit_count": 1,
                "contributors_count": 1,
            },
            "decisions": [
                {
                    "decision_id": "D-1",
                    "type": "convergence",
                    "title": "Convergence Point",
                    "summary": "Sample summary",
                    "contributor_id": "octocat",
                    "timestamp": "2026-04-28T12:00:00+00:00",
                    "confidence": 0.7,
                    "evidence": [
                        {
                            "commit_sha": "abc1234",
                            "file_paths": ["README.md"],
                            "reason": "Sample evidence",
                        }
                    ],
                }
            ],
            "graph": {
                "nodes": [{"id": "octocat", "kind": "contributor", "label": "octocat", "influence_score": 0.2}],
                "edges": [],
            },
            "contributors": [
                {
                    "contributor_id": "octocat",
                    "name": "octocat",
                    "role": "Implementer",
                    "narrative": "Built features",
                    "confidence": 0.8,
                    "top_decisions": ["D-1"],
                    "evidence": [{"commit_sha": "abc1234", "reason": "Sample evidence"}],
                }
            ],
            "warnings": [],
        },
    )

    status_res = client.get(f"/api/analysis/{job['job_id']}")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "done"

    result_res = client.get(f"/api/analysis/{job['job_id']}/result")
    assert result_res.status_code == 200
    assert result_res.json()["job_id"] == job["job_id"]


def test_result_not_ready_returns_409():
    job = _jobs_singleton.create_job("https://github.com/octocat/Hello-World")
    res = client.get(f"/api/analysis/{job['job_id']}/result")
    assert res.status_code == 409
    assert res.json()["detail"]["error"]["code"] == "not_ready"


def test_contributor_not_found_returns_404():
    job = _jobs_singleton.create_job("https://github.com/octocat/Hello-World")
    _jobs_singleton.set_result(
        job["job_id"],
        {
            "job_id": job["job_id"],
            "project": {
                "name": "Hello-World",
                "repo_url": "https://github.com/octocat/Hello-World",
                "commit_count": 1,
                "contributors_count": 1,
            },
            "decisions": [],
            "graph": {"nodes": [], "edges": []},
            "contributors": [
                {
                    "contributor_id": "octocat",
                    "name": "octocat",
                    "role": "Implementer",
                    "narrative": "Built features",
                    "confidence": 0.8,
                    "top_decisions": [],
                    "evidence": [{"commit_sha": "abc1234", "reason": "Sample evidence"}],
                }
            ],
            "warnings": [],
        },
    )
    res = client.get(f"/api/analysis/{job['job_id']}/contributors/not-here")
    assert res.status_code == 404
    assert res.json()["detail"]["error"]["code"] == "not_found"


def test_orchestrator_clone_failure_maps_error(monkeypatch):
    from app.services.orchestrator import AnalysisOrchestrator

    job = _jobs_singleton.create_job("https://github.com/octocat/Hello-World")

    def _boom(*_args, **_kwargs):
        raise RuntimeError("clone failed")

    monkeypatch.setattr("app.services.orchestrator.clone_and_extract_with_limits", _boom)
    orchestrator = AnalysisOrchestrator(_jobs_singleton, AnalysisOrchestrator.dep().settings)
    orchestrator.run_job(job["job_id"])
    updated = _jobs_singleton.get_job(job["job_id"])
    assert updated is not None
    assert updated["status"] == JobStatus.failed.value
    assert updated["error_code"] == "clone_failed"


def test_orchestrator_timeout_state(monkeypatch):
    from app.services.orchestrator import AnalysisOrchestrator

    job = _jobs_singleton.create_job("https://github.com/octocat/Hello-World")
    orchestrator = AnalysisOrchestrator(_jobs_singleton, AnalysisOrchestrator.dep().settings)
    orchestrator.settings.max_repo_runtime_seconds = 0

    monkeypatch.setattr(
        "app.services.orchestrator.clone_and_extract_with_limits",
        lambda *_args, **_kwargs: ([], ""),
    )
    monkeypatch.setattr(
        "app.services.orchestrator.run_analysis_pipeline",
        lambda _job_id, repo_url, commits: {
            "job_id": _job_id,
            "project": {"name": "x", "repo_url": repo_url, "commit_count": len(commits), "contributors_count": 0},
            "decisions": [],
            "graph": {"nodes": [], "edges": []},
            "contributors": [],
            "warnings": [],
        },
    )

    orchestrator.run_job(job["job_id"])
    updated = _jobs_singleton.get_job(job["job_id"])
    assert updated is not None
    assert updated["status"] == JobStatus.timeout.value
    assert updated["error_code"] == "timeout"


def test_create_analysis_uses_recent_cached_result(monkeypatch):
    repo_url = "https://github.com/octocat/Hello-World"
    seed = _jobs_singleton.create_job(repo_url)
    _jobs_singleton.set_result(
        seed["job_id"],
        {
            "job_id": seed["job_id"],
            "project": {
                "name": "Hello-World",
                "repo_url": repo_url,
                "commit_count": 2,
                "contributors_count": 1,
            },
            "decisions": [],
            "graph": {"nodes": [], "edges": []},
            "contributors": [
                {
                    "contributor_id": "octocat",
                    "name": "octocat",
                    "role": "Implementer",
                    "narrative": "Built features",
                    "confidence": 0.8,
                    "top_decisions": [],
                    "evidence": [{"commit_sha": "abc1234", "reason": "Sample evidence"}],
                }
            ],
            "warnings": [],
        },
    )

    monkeypatch.setattr("app.api.routes_analysis.AnalysisOrchestrator.run_job", lambda *_args, **_kwargs: None)
    res = client.post("/api/analysis", json={"repo_url": repo_url})
    assert res.status_code == 202
    assert res.json()["status"] == "done"

    job_id = res.json()["job_id"]
    result_res = client.get(f"/api/analysis/{job_id}/result")
    assert result_res.status_code == 200
    assert result_res.json()["project"]["repo_url"] == repo_url
