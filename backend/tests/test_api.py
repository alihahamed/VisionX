from fastapi.testclient import TestClient

from app.main import app
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
