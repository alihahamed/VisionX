# Project State

Last updated: 2026-04-28

## Current State

- Repo is on `main`.
- Frontend plan and backend plan exist in root:
  - `frontend-plan.md`
  - `backend-plan.md`
- Backend FastAPI scaffold is in place under `backend/`.
- Python is installed and backend endpoints are running successfully in Swagger UI.
- Frontend is connected to backend endpoints and route flow is implemented:
  - `/` submit repo URL
  - `/analyzing/[jobId]` polling tracker
  - `/dashboard/[jobId]` result dashboard
  - `/contributors/[jobId]/[contributorId]` profile view
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
- Frontend routing bug fixed: dynamic route params now resolve correctly (no more `/api/analysis/undefined`).
- Frontend lint is passing.

## Blockers

- Production build is still unstable in this environment (`spawn EPERM` / memory issues during `next build`).
- Dev workflow is usable with webpack fallback scripts, but production build validation is pending on your machine.

## Next Steps

1. Run full end-to-end validation with 2-3 real public repos and record expected outputs.
2. Improve analysis quality (decision detection and contributor role heuristics) using observed false positives/negatives.
3. Add backend test coverage for:
  - successful analysis lifecycle
  - invalid repo
  - timeout/failure branches
  - result-not-ready (`409`) behavior
4. Add frontend UX hardening:
  - dashboard empty states
  - explicit retry actions on failures
  - pagination or limits if graph/decision lists are large
5. Resolve production build stability on local machine and confirm `npm run build` cleanly.
6. Add minimal deployment setup (`.env` templates, start commands, and runbook).
7. If public demo: add basic rate limiting and stricter backend URL guards.

## Recommended Immediate Action

Run an end-to-end test now: submit a real repo, wait for `done`, verify timeline/graph/contributor pages, and capture the first list of analysis-quality fixes.
