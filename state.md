# Project State

Last updated: 2026-04-28

## Current Phase

Phase: Performance + Reliability Hardening

Goal in this phase:
- Reduce repo analysis latency variance.
- Improve dashboard first paint and avoid render stalls.
- Add guardrails for oversized repositories.

## Last Session Work

### Backend Hotfix

- Replaced PyDriller traversal in the hot path with fast `git log --numstat` parsing in [backend/app/services/git_ingest.py](c:/Users/aliah/Pictures/hackton/backend/app/services/git_ingest.py).
- Added partial clone flag `--filter=blob:none` to reduce object download size for large repos.
- Added warm-cache reuse by `repo_url` (30 min default): repeat analysis requests can return `status=done` immediately from cached result in [backend/app/api/routes_analysis.py](c:/Users/aliah/Pictures/hackton/backend/app/api/routes_analysis.py) and [backend/app/storage/jobs.py](c:/Users/aliah/Pictures/hackton/backend/app/storage/jobs.py).
- Tuned fast defaults in [backend/app/core/config.py](c:/Users/aliah/Pictures/hackton/backend/app/core/config.py):
  - `max_commits=220`
  - `clone_depth=180`
  - `max_repo_runtime_seconds=12`
  - `cache_ttl_minutes=30`
- Exposed `error_code` and `error_message` from job status responses:
  - [backend/app/models/schemas.py](c:/Users/aliah/Pictures/hackton/backend/app/models/schemas.py)
  - [backend/app/api/routes_analysis.py](c:/Users/aliah/Pictures/hackton/backend/app/api/routes_analysis.py)
- Frontend analyzing screen now shows backend failure detail instead of generic "smaller repo" text:
  - [components/analyzing-tracker.tsx](c:/Users/aliah/Pictures/hackton/components/analyzing-tracker.tsx)
  - [lib/types.ts](c:/Users/aliah/Pictures/hackton/lib/types.ts)
  - [lib/schemas.ts](c:/Users/aliah/Pictures/hackton/lib/schemas.ts)

### Backend

- Added ingest fast path controls:
  - shallow clone (`clone_depth`, default `300`)
  - clone flags: `--no-tags --single-branch`
  - repository size cap (`max_repo_size_mb`, default `120`)
- Added config keys in [backend/app/core/config.py](c:/Users/aliah/Pictures/hackton/backend/app/core/config.py).
- Updated orchestrator ingest call to pass limits in [backend/app/services/orchestrator.py](c:/Users/aliah/Pictures/hackton/backend/app/services/orchestrator.py).
- Added lightweight slice endpoints in [backend/app/api/routes_analysis.py](c:/Users/aliah/Pictures/hackton/backend/app/api/routes_analysis.py):
  - `GET /api/analysis/{job_id}/summary`
  - `GET /api/analysis/{job_id}/contributors`

### Frontend

- Added typed summary/contributors slice contracts in:
  - [lib/types.ts](c:/Users/aliah/Pictures/hackton/lib/types.ts)
  - [lib/schemas.ts](c:/Users/aliah/Pictures/hackton/lib/schemas.ts)
  - [lib/api.ts](c:/Users/aliah/Pictures/hackton/lib/api.ts)
  - [lib/queries.ts](c:/Users/aliah/Pictures/hackton/lib/queries.ts)
- Refactored dashboard to progressive loading in [components/dashboard-client.tsx](c:/Users/aliah/Pictures/hackton/components/dashboard-client.tsx):
  - load summary first
  - load timeline/graph/contributors independently
- Submit flow in [components/repo-submission.tsx](c:/Users/aliah/Pictures/hackton/components/repo-submission.tsx) now routes directly to dashboard when backend returns cached `status=done`.
- Added graph safety mode in [components/dashboard-shell.tsx](c:/Users/aliah/Pictures/hackton/components/dashboard-shell.tsx):
  - initial cap: top `80` edges
  - optional full graph load button

### Test / Validation

- Backend tests updated for orchestrator symbol rename in [backend/tests/test_api.py](c:/Users/aliah/Pictures/hackton/backend/tests/test_api.py).
- Validation status:
  - `npm run lint` -> pass
  - `npx tsc --noEmit` -> pass
  - `pytest` -> 9 passed (1 warning from `.pytest_cache` permission)
  - Hotfix validation: `npm run lint`, `npx tsc --noEmit`, and `pytest` all pass.

## Decisions Made

1. Use shallow clone by default instead of full clone.
Reason: fastest consistent ingest improvement for public GitHub repos.

2. Add hard repository size cap.
Reason: avoid long-tail stalls and memory spikes that degrade UX.

3. Shift dashboard from monolithic `/result` fetch to progressive slices.
Reason: first paint should not wait for graph and contributors payload.

4. Add graph safe mode with capped edges by default.
Reason: prevent heavy graph render from blocking or freezing UI.

5. Keep full graph available via explicit user action.
Reason: preserve completeness without penalizing baseline reliability.

6. Remove PyDriller from request hot path.
Reason: PyDriller prints commit traversal and performs heavier diff mining; `git log --numstat` is faster and stable enough for MVP metadata extraction.

7. Reuse fresh results for same repository URL.
Reason: repeated runs should feel instant and avoid unnecessary clone/analysis cost.

## Open Questions

1. Should oversized repos return `invalid_repo` or a dedicated `repo_too_large` error code?
Current behavior: message indicates size cap breach; code maps through existing failure bucket.

2. What default caps should be product policy?
Current defaults: `clone_depth=300`, `max_repo_size_mb=120`, `max_commits=500`.

3. Should we add a background worker queue (RQ/Celery/Arq) now or after demo stabilization?
Current system still uses `BackgroundTasks`.

4. Should dashboard contributor cards load from summary metadata first (count placeholders) before contributor payload arrives?
Current behavior: cards appear when contributor slice resolves.

5. Do you want a strict retry/backoff policy on slice endpoints for flaky local networks?
Current behavior: queries run with `retry: false` except status polling flow.

6. Should big repos be sampled by latest commits only or by mixed time windows?
Current behavior: latest shallow history with max commit cap.
