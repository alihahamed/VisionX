# Frontend Implementation Plan - Proof of Thinking (Next.js 16)

## 1) Objective
Build frontend that makes contribution impact visible using backend analysis outputs:
- Decision moment timeline
- Influence graph
- Contributor narratives with citation evidence

Frontend handles submission UX, job-status UX, visualization, explainability. Frontend does not run analysis heuristics.

## 2) MVP Scope
In:
- Public GitHub URL submission
- Async analysis status polling
- Dashboard: timeline + graph + contributor cards + evidence drawer
- Contributor deep profile route
- Export-friendly contributor card route

Out:
- Private repo OAuth
- Realtime websocket stream
- Slack/Jira/Discord ingestion

## 3) Stack + Rationale
Core:
- Next.js `16.2.4` App Router
- React `19.2.4`
- TypeScript
- Tailwind CSS `4`
- TanStack Query
- React Flow / XYFlow
- Zod for runtime response validation

Why Server Components default:
- Less client JS for shell/layout.
- Better TTFB for mostly read-heavy dashboard shell.
- Matches App Router architecture.

Why Client Components selective:
- Needed for graph pan/zoom/select.
- Needed for timeline interactions and polling timer behavior.
- Avoid client overuse to keep bundle lean.

Why TanStack Query:
- Polling + retry/backoff + cache keys by `job_id`.
- Strong status transition control.

Why React Flow:
- Mature graph interaction primitives.
- Faster delivery vs custom D3 graph stack.

## 4) Why This Stack Matrix
| Chosen tool | Reason chosen | Alternative considered | Why not alternative now |
|---|---|---|---|
| Next.js 16 App Router | Native route/loading/error conventions + RSC | Vite + React Router | More manual SSR/BFF plumbing |
| React 19 | Baseline with Next 16 | React 18 | No gain in downgrade |
| TypeScript | Contract safety with backend schemas | JavaScript | Higher API drift risk |
| Tailwind 4 | Fast UI iteration + tokenized styles | CSS Modules | Slower iteration for MVP |
| TanStack Query | Robust polling/cache controls | SWR | Less granular lifecycle control |
| React Flow/XYFlow | Graph interactions solved | D3 custom | Higher build + maintenance cost |
| Zod | Runtime payload guards | Manual checks | Repetitive + fragile checks |

## 5) Information Architecture
Routes:
- `/` -> onboarding + repo URL form
- `/analyzing/[jobId]` -> progress stage screen
- `/dashboard/[jobId]` -> master dashboard
- `/contributors/[jobId]/[contributorId]` -> deep profile
- `/export/[jobId]/[contributorId]` -> printable/exportable card

## 6) Shared Enums (Must Match Backend)
Status:
- `queued | running | done | failed | timeout | invalid_repo`

Role:
- `Initiator | Implementer | Corrector | Unblocker`

Decision type:
- `convergence | replacement | unblocking | correction | architectural_pivot`

## 7) Typed Data Contracts
```ts
export type JobStatus =
  | "queued"
  | "running"
  | "done"
  | "failed"
  | "timeout"
  | "invalid_repo";

export type RoleTag = "Initiator" | "Implementer" | "Corrector" | "Unblocker";

export type DecisionType =
  | "convergence"
  | "replacement"
  | "unblocking"
  | "correction"
  | "architectural_pivot";

export interface AnalysisJob {
  job_id: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  progress_stage?: "ingest" | "classify" | "detect" | "graph" | "narrate";
  message?: string;
}

export interface DecisionMoment {
  decision_id: string;
  type: DecisionType;
  title: string;
  summary: string;
  timestamp: string;
  contributor_id: string;
  confidence: number;
  evidence: Array<{
    commit_sha: string;
    file_paths: string[];
    reason: string;
  }>;
}

export interface GraphNode {
  id: string;
  kind: "contributor" | "decision";
  label: string;
  influence_score: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  relation: "builds_on" | "unblocks" | "corrects";
}

export interface ContributorProfile {
  contributor_id: string;
  name: string;
  role: RoleTag;
  narrative: string;
  confidence: number;
  top_decisions: string[];
  evidence: Array<{
    commit_sha: string;
    reason: string;
  }>;
}
```

## 8) API Integration Plan
Backend-owned endpoints:
- `POST /api/analysis`
- `GET /api/analysis/{job_id}`
- `GET /api/analysis/{job_id}/result`
- `GET /api/analysis/{job_id}/timeline`
- `GET /api/analysis/{job_id}/graph`
- `GET /api/analysis/{job_id}/contributors/{id}`

Flow:
1. Submit `repo_url` on `/` to `POST /api/analysis`.
2. Redirect `/analyzing/[jobId]`.
3. Poll status every 1s while `queued|running`.
4. On `done`, fetch result slices and render dashboard.
5. On `failed|timeout|invalid_repo`, show actionable retry UX.

## 9) UX + State Decisions
- URL-driven state via `jobId` for refresh/share determinism.
- Stage text mirrors PRD language: ingest, detect, map, narrate.
- Explainability mandatory: every claim links to commit evidence drawer.
- Confidence shown with concise helper text; avoid opaque score-only UI.

## 10) Performance + Accessibility
Performance:
- Dynamic import graph module.
- Render top-weight edges first; expand on user request.
- Memoize transforms and keep graph layout recalcs debounced.

Accessibility:
- Keyboard navigation for timeline/card/evidence interactions.
- ARIA labels for status indicators and graph controls.
- Respect reduced-motion preference.
- Contrast-safe tokens + visible focus outlines.

## 11) Security
- No secrets in client bundle.
- Treat narrative text as untrusted; sanitize before render.
- Validate URL client-side for UX, validate server-side for trust.
- Never show backend stack traces to end users.

## 12) Milestones
- M1: Route shell + shared types + loading/error shells.
- M2: Job submit + polling + terminal-state handling.
- M3: Timeline + influence graph + evidence drawer.
- M4: Contributor deep profile + export route.
- M5: Perf/a11y tuning + polish.

## 13) Risks + Mitigation
- Contract drift -> generate TS types from OpenAPI in CI.
- Large graph lag -> weighted threshold + progressive reveal.
- Trust concerns -> evidence-first UI + confidence disclosure.

## 14) Acceptance Criteria
- User submits public repo, reaches analysis, sees dashboard.
- Dashboard includes timeline, graph, contributor narratives.
- Narrative statements map to citation evidence.
- Terminal statuses handled: `failed|timeout|invalid_repo`.
- UI remains responsive for 100-500 commit dataset outputs.

## 15) Contract Drift Prevention
Preferred MVP method:
- Generate TypeScript types from FastAPI OpenAPI schema.

Alternative:
- Shared schema package consumed by both frontend/backend.
