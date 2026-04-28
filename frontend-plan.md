# Frontend Implementation Plan - Proof of Thinking (Next.js 16)

## 1) Objective
Build a production-style hackathon frontend that makes invisible contribution signals visible through:
- Decision Moment timeline
- Influence graph
- Contributor narratives with evidence citations

The frontend is responsible for ingestion UX, job-state UX, and explainable visualization of backend analysis outputs. It does not perform analysis logic.

## 2) Scope Summary (MVP)
In scope:
- Public GitHub repository URL submission
- Async job progress and polling
- Dashboard with timeline, graph, contributor cards, and evidence drill-down
- Contributor profile deep view
- Share/export-ready profile page (HTML/PDF-ready screen)

Out of scope:
- Private repo OAuth flow
- Real-time websocket streaming updates
- Multi-source ingestion (Slack/Jira/Discord)

## 3) Architecture and Why
### Core stack
- Next.js `16.2.4` (App Router)
- React `19.2.4`
- TypeScript
- Tailwind CSS `4`
- TanStack Query (frontend data orchestration)
- React Flow / XYFlow (influence graph)
- Zod (runtime response guards)

### Why Server Components by default
- Faster first paint for shell/routes and static page structure.
- Lower JS payload because data-heavy static sections stay server-rendered.
- Better fit for Next 16 App Router defaults and route-level loading/error boundaries.

### Why Client Components only where needed
Use Client Components only for:
- Graph interactions (pan/zoom/select)
- Timeline scrub/filter actions
- Polling timers and optimistic UI states

Reason: these views require browser state, event handling, and render loops. Everything else remains server-first.

### Why TanStack Query
- Reliable polling lifecycle for async jobs.
- Retry/backoff control.
- Cache segregation per `job_id`.
- Minimal custom state machine code.

### Why React Flow / XYFlow
- Graph primitives, viewport control, edge styles, and interaction model already solved.
- Faster than building a custom SVG graph with hit-testing from scratch.
- Supports progressive graph complexity as model improves.

## 4) Why This Stack Matrix
| Chosen tool | Reason chosen | Alternative considered | Why not alternative now |
|---|---|---|---|
| Next.js 16 App Router | Native routing, RSC defaults, loading/error conventions | Vite + React Router | More manual architecture and SSR/BFF wiring |
| React 19 | Compatible with Next 16 and concurrent rendering improvements | React 18 | No reason to downgrade from app baseline |
| TypeScript | Shared API contract safety with FastAPI schemas | JS only | Higher contract drift risk |
| Tailwind 4 | Fast utility styling and predictable design tokens | CSS Modules | Slower iteration for hackathon velocity |
| TanStack Query | Polling, cache keys, retries, stale logic | SWR | We need richer query lifecycle controls |
| React Flow (XYFlow) | Mature interactive graph rendering | D3 custom build | Higher engineering cost and maintenance |
| Zod | Runtime parse for API hardening | io-ts / manual checks | More boilerplate or weaker DX now |

## 5) Information Architecture
Routes:
- `/` : onboarding + repository input + validation hints
- `/analyzing/[jobId]` : staged analysis progress
- `/dashboard/[jobId]` : full project dashboard
- `/contributors/[jobId]/[contributorId]` : contributor deep profile
- `/export/[jobId]/[contributorId]` : print/export card

Page responsibilities:
- Home: submit repo URL, create job, route to analyzing.
- Analyzing: poll status, show PRD-aligned phases, handle terminal errors.
- Dashboard: fetch result slices, render summary + timeline + graph + contributors.
- Contributor profile: detailed evidence and role explanation.
- Export: static-friendly card layout.

## 6) Shared API Vocabulary (Must Match Backend)
### Status enum
`queued | running | done | failed | timeout | invalid_repo`

### Role enum
`Initiator | Implementer | Corrector | Unblocker`

### Decision type enum
`convergence | replacement | unblocking | correction | architectural_pivot`

## 7) Frontend Data Contracts (TypeScript)
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
Base path (backend-owned):
- `POST /api/analysis`
- `GET /api/analysis/{job_id}`
- `GET /api/analysis/{job_id}/result`
- `GET /api/analysis/{job_id}/timeline`
- `GET /api/analysis/{job_id}/graph`
- `GET /api/analysis/{job_id}/contributors/{id}`

Flow:
1. Home submits `repo_url` to `POST /api/analysis`.
2. Redirect to `/analyzing/{job_id}`.
3. Poll `GET /api/analysis/{job_id}` every 1s while status in `queued|running`.
4. On `done`, navigate `/dashboard/{job_id}` and fetch result slices.
5. On `failed|timeout|invalid_repo`, show actionable recovery UI.

Error handling:
- `invalid_repo`: prompt valid public URL format and access checks.
- `timeout`: suggest smaller repo or retry.
- `failed`: show trace-safe error id and retry button.

## 9) State and UX Rationale
- URL-driven state by `job_id` enables refresh/share reproducibility.
- Loading states map to analysis pipeline stages from PRD language.
- Explainability first: every narrative claim links to commit evidence drawer.
- Keep confidence visible with short explanation text; avoid opaque scoring visuals.

## 10) Performance and Accessibility
Performance:
- Lazy-load graph component with dynamic import.
- Render cap for heavy graphs (e.g., start with top-N weighted edges, expand on demand).
- Debounce graph layout recalculation.
- Memoize transformed graph/timeline datasets.

Accessibility:
- Keyboard focus order for timeline nodes, contributor cards, and evidence drawer.
- ARIA labels for graph controls and status banners.
- Contrast-safe tokens and visible focus rings.
- Reduced motion support for loading animations.

## 11) Security Requirements
- No secrets in client bundle.
- Narrative text treated as untrusted input; sanitize markdown/HTML before rendering.
- Strict URL validation client-side before submission (server remains source of truth).
- Never expose internal backend stack traces to users.

## 12) Milestones
- M1: App shell + routes + shared types + layout states.
- M2: Job creation + polling + terminal error handling.
- M3: Timeline + influence graph + evidence drawer.
- M4: Contributor deep profile + export page.
- M5: Perf tuning + a11y + polish.

## 13) Risks and Mitigations
- Contract drift: generated TS types from OpenAPI or shared schema package.
- Oversized graph: weighted edge threshold and progressive reveal.
- Narrative trust issues: enforce evidence display and confidence labels.

## 14) Acceptance Criteria
- User can submit public repo and reach dashboard through analyzing state.
- Dashboard shows decision timeline, influence graph, contributor profiles.
- Each narrative claim is traceable to commit evidence.
- Terminal errors (`failed|timeout|invalid_repo`) have explicit recovery actions.
- Performance remains usable on 100-500 commit projects.

## 15) Contract Drift Prevention
Choose one and enforce in CI:
1. Generate TypeScript API types from FastAPI OpenAPI schema.
2. Maintain shared schema package consumed by frontend and backend.

Preferred for MVP: option 1 (faster with existing FastAPI schema generation).
