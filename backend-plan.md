# Backend Implementation Plan - Proof of Thinking (FastAPI)

## 1) Objective
Build deterministic, explainable contribution inference from Git artifacts and expose stable APIs for the Next.js frontend.

Core backend outcome:
- Detect decision moments from commit history
- Build influence graph between contributors
- Generate contributor narratives with explicit evidence citations

## 2) Scope Summary (MVP)
In scope:
- Public GitHub repository URL ingestion
- Async job-based analysis pipeline
- Timeline, graph, contributor profile outputs
- Structured narrative generation with citations

Out of scope:
- Private repo OAuth permissions
- Multi-source ingestion (Slack/Jira/Discord)
- Real-time streaming transport

## 3) Architecture and Why
### Core stack
- FastAPI
- Pydantic v2
- PyDriller
- GitPython (fallback utilities)
- NetworkX
- SQLite (MVP persistence)
- FastAPI BackgroundTasks
- Optional LLM provider client (OpenAI/Gemini) for structured narratives

### Why FastAPI + Pydantic v2
- Strong typed request/response contracts with automatic OpenAPI.
- High development speed and good async support.
- Easy frontend contract generation from schema.

### Why PyDriller primary, GitPython fallback
- PyDriller gives high-level mining primitives for commits/modifications quickly.
- GitPython retained for edge cases (advanced diff access, repo metadata fallback).

### Why NetworkX
- Mature graph algorithms for influence scoring and centrality.
- Easy conversion to node/edge JSON for frontend graph visualization.

### Why SQLite now, Postgres-ready design
- Minimal ops for hackathon.
- Enough for job metadata + final result blobs.
- Repository layer abstraction keeps migration path open.

### Why BackgroundTasks now
- Simplest async execution model for MVP demos.
- No external queue dependency to start.
- Queue worker migration path documented below.

## 4) Why This Stack Matrix
| Chosen tool | Reason chosen | Alternative considered | Why not alternative now |
|---|---|---|---|
| FastAPI | Typed APIs + OpenAPI + speed | Flask/FastAPI-lite | Less built-in typing and docs |
| Pydantic v2 | Strict schema validation and speed | Marshmallow | Higher boilerplate for this workflow |
| PyDriller | Purpose-built commit mining | Raw git CLI parsing | More parsing complexity and fragility |
| GitPython | Reliable low-level git fallback | Dulwich | Team familiarity lower currently |
| NetworkX | Proven graph scoring algorithms | Custom graph logic | Reinventing core algorithms |
| SQLite | Zero-ops persistence for MVP | Postgres now | Adds infra overhead too early |
| BackgroundTasks | Fast async MVP path | Celery/RQ immediately | More setup than needed for hackathon |

## 5) Shared API Vocabulary (Must Match Frontend)
### Status enum
`queued | running | done | failed | timeout | invalid_repo`

### Role enum
`Initiator | Implementer | Corrector | Unblocker`

### Decision type enum
`convergence | replacement | unblocking | correction | architectural_pivot`

## 6) API Contracts
### `POST /api/analysis`
Purpose: create analysis job.

Request:
```json
{
  "repo_url": "https://github.com/org/repo"
}
```

Response `202`:
```json
{
  "job_id": "uuid",
  "status": "queued",
  "created_at": "2026-04-28T12:00:00Z"
}
```

Errors:
- `400` invalid url payload
- `422` schema validation failure

### `GET /api/analysis/{job_id}`
Purpose: poll status and stage.

Response `200`:
```json
{
  "job_id": "uuid",
  "status": "running",
  "progress_stage": "detect",
  "message": "detecting decision moments",
  "updated_at": "2026-04-28T12:00:07Z"
}
```

### `GET /api/analysis/{job_id}/result`
Purpose: full dashboard payload.

Response `200`:
```json
{
  "job_id": "uuid",
  "project": {
    "name": "repo",
    "repo_url": "https://github.com/org/repo",
    "commit_count": 214,
    "contributors_count": 5
  },
  "decisions": [],
  "graph": { "nodes": [], "edges": [] },
  "contributors": [],
  "warnings": []
}
```

Errors:
- `404` unknown job
- `409` job not complete
- `500` corrupted result

### Optional slices
- `GET /api/analysis/{job_id}/timeline`
- `GET /api/analysis/{job_id}/graph`
- `GET /api/analysis/{job_id}/contributors/{id}`

Use slices for incremental loading and payload control.

### Standard error schema
```json
{
  "error": {
    "code": "invalid_repo",
    "message": "Repository is not publicly accessible",
    "details": "optional detail",
    "retryable": false
  }
}
```

## 7) Data Models
### Job model
- `job_id: UUID`
- `repo_url: str`
- `status: JobStatus`
- `progress_stage: ingest|classify|detect|graph|narrate`
- `error_code?: str`
- `error_message?: str`
- `created_at: datetime`
- `updated_at: datetime`

### Decision model
- `decision_id: str`
- `type: DecisionType`
- `title: str`
- `summary: str`
- `contributor_id: str`
- `timestamp: datetime`
- `confidence: float (0..1)`
- `evidence: EvidenceRef[]`

### Contributor profile model
- `contributor_id: str`
- `name: str`
- `role: RoleTag`
- `narrative: str`
- `confidence: float (0..1)`
- `top_decisions: string[]`
- `evidence: EvidenceRef[]`

### Graph model
- `nodes: GraphNode[]`
- `edges: GraphEdge[]`

### Evidence rules
- Every claimable decision/profile item must include `>=1` evidence reference.
- Evidence reference must include `commit_sha` and `reason`.
- Confidence without evidence is invalid.

## 8) Processing Pipeline
1. Ingest:
- Validate URL format and allowed host policy.
- Create temp workspace for clone.
- Clone with depth strategy (configurable; full clone fallback when needed).

2. Traverse:
- Iterate commits oldest -> newest.
- Extract author, timestamp, message, modified files, line deltas.

3. Noise filtering:
- Exclude lockfiles (`package-lock.json`, `yarn.lock`, etc.).
- Exclude generated/build/vendor paths.
- Exclude binaries and mass-format commits beyond threshold.

4. Commit classification:
- Classify each commit as `feature|refactor|bug_fix|architecture|noise` via heuristic rules.

5. Decision detection:
- Detect:
  - `convergence`
  - `replacement`
  - `unblocking`
  - `correction`
  - `architectural_pivot`
- Assign confidence and evidence list.

6. Influence graph:
- Build contributor dependency edges from file/module evolution.
- Compute influence scores via weighted edge metrics/centrality.
- Tag contributor roles: `Initiator|Implementer|Corrector|Unblocker`.

7. Narrative generation:
- Feed deterministic evidence bundle into LLM structured-output prompt.
- Enforce JSON schema output.
- Reject narratives without matching evidence ids.

8. Persist and cleanup:
- Save result payload.
- Delete temp clone/work dir regardless of success/failure.

## 9) Non-Functional Targets
- Performance goal: 100-500 commits processed under 15s on demo-grade hardware.
- Reliability: deterministic pipeline outputs for same repository snapshot.
- Privacy: no raw source retained after job completion; metadata/result only.

## 10) Security and Privacy
- URL validation/allowlist:
  - Allow only `github.com` public HTTPS URLs in MVP.
- SSRF safeguards:
  - Block internal/private network targets.
  - Disallow redirects to non-allowlisted hosts.
- Repo resource limits:
  - Max clone size, max commit count, max analysis runtime.
- Path safety:
  - Sanitize and isolate temp paths.
  - Never checkout outside controlled temp root.

## 11) Observability
- Structured logs:
  - `job_id`, stage, duration_ms, status, error_code.
- Timing metrics per stage:
  - ingest/classify/detect/graph/narrate.
- Failure buckets:
  - `invalid_repo`, `clone_failed`, `parse_failed`, `timeout`, `llm_schema_error`, `internal_error`.

## 12) Migration Path (Post-MVP)
- Replace `BackgroundTasks` with queue workers (Celery/RQ/Arq).
- Move SQLite to Postgres with repository abstraction unchanged.
- Add object storage if intermediate artifacts need retention.

## 13) Milestones
- B1: API skeleton + job persistence + status polling.
- B2: Repo ingestion + commit parsing + filters.
- B3: Classifier + decision detector + graph build.
- B4: Narrative generation + evidence validation.
- B5: Performance tuning + observability + hardening.

## 14) Risks and Mitigations
- Misattribution risk:
  - Mitigate with explicit confidence + evidence display and dispute-friendly payload design.
- Large repo latency:
  - Cap scope and expose warning/timeout pathway.
- LLM drift/hallucination:
  - Structured output schema + evidence id checks + deterministic fallback summary.

## 15) Acceptance Criteria
- Public repo URL can produce a completed analysis job with timeline, graph, and profiles.
- Status API reflects all terminal states exactly (`done|failed|timeout|invalid_repo`).
- Every contributor narrative has commit-citation evidence.
- Temp clone data removed after completion/failure.
- Logs and timing metrics available per job stage.

## 16) Contract Drift Prevention
Choose one and enforce in CI:
1. Generate TypeScript types from FastAPI OpenAPI schema (preferred MVP).
2. Shared schema package consumed by backend and frontend.

Preferred for MVP: option 1 for speed and lower maintenance burden.
