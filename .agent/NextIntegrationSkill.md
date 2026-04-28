---
name: next-integration
description: Next.js App Router integration workflow for live API-backed dashboards and polling flows.
---

## Use this skill when
- Wiring Next.js to a backend API.
- Building route-driven async flows and dashboard pages.
- Converting starter App Router pages into production UI.

## Checklist
1. Keep Server Components default; use Client Components only for interactivity.
2. Centralize API base URL in `NEXT_PUBLIC_API_BASE_URL`.
3. Use route-level loading and error states.
4. Poll job endpoints with cancellation and terminal-state guards.
5. Keep shared enums/types aligned with backend schema.
6. Avoid unnecessary client bundle weight.

## Rules
- No hardcoded backend URLs in components.
- No fetch in Client Components unless the UI needs browser-only state.
- Prefer typed fetch helpers over ad hoc requests.
