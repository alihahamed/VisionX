# Project State

Last updated: 2026-04-28

## Current State

- Repo is on `main`.
- Frontend plan and backend plan exist in root:
  - `frontend-plan.md`
  - `backend-plan.md`
- Backend FastAPI scaffold is in place under `backend/`.
- Python is installed and backend endpoints are running successfully in Swagger UI.
- Core backend pieces already created:
  - `backend/app/main.py`
  - `backend/app/api/routes_analysis.py`
  - `backend/app/models/schemas.py`
  - `backend/app/services/orchestrator.py`
  - `backend/app/services/analyzer.py`
  - `backend/app/services/git_ingest.py`
  - `backend/app/storage/jobs.py`
  - `backend/tests/test_api.py`
- Extra workflow skills added under `.agent/`:
  - `BackendTestingSkill.md`
  - `BackendSecuritySkill.md`
  - `ApiContractSyncSkill.md`

## What Works

- FastAPI app structure is defined.
- API routes exist for:
  - `POST /api/analysis`
  - `GET /api/analysis/{job_id}`
  - `GET /api/analysis/{job_id}/result`
  - `GET /api/analysis/{job_id}/timeline`
  - `GET /api/analysis/{job_id}/graph`
  - `GET /api/analysis/{job_id}/contributors/{contributor_id}`
  - `GET /health`
- Pydantic schemas exist for jobs, results, graph, contributors, errors, and enums.
- SQLite job persistence is implemented.
- GitHub public URL validation and temp repo cleanup logic exist.
- Basic analysis pipeline logic exists for:
  - commit classification
  - decision detection
  - graph generation
  - contributor narrative generation
- Swagger UI can execute all current endpoints successfully.

## Blockers

- Backend runtime not yet verified in this environment.
- Python toolchain on this machine is the MSYS2 build and is missing a usable `pip`/`venv` flow for this repo.
- Commands tried:
  - `python -m pytest -q`
  - `python -m pip install -r requirements.txt`
  - `python -m venv .venv`
- Result:
  - `pip` missing
  - `ensurepip` blocked by MSYS2-managed Python policy
  - `venv` creation fails because pip bootstrap fails

## Next Steps

1. Wire the Next.js frontend to the live FastAPI endpoints.
2. Add real sample repo tests so analysis output is not only schema-valid but meaningful.
3. Tighten backend analysis heuristics and edge cases for better attribution quality.
4. Add automated backend tests for success and failure paths.
5. Add frontend polling, dashboard rendering, and contributor profile views.
6. Add deployment config and environment variables for local/dev/demo use.
7. If the demo will be public, add rate limits and stronger repo URL validation.

## Recommended Immediate Action

Start frontend-backend integration now: point Next.js at the live FastAPI server and build the dashboard flow end to end.
