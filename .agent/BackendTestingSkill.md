---
name: backend-testing
description: FastAPI testing workflow for API correctness, contract safety, and regression prevention.
---

## Use this skill when
- Adding or changing backend endpoints.
- Updating schemas, status enums, or response models.
- Fixing regressions in analysis pipeline output.

## Checklist
1. Add unit/integration tests for happy path and failure path.
2. Assert exact status codes and error schema (`error.code`, `retryable`).
3. Validate enum contract compatibility with frontend plan.
4. Run `pytest -q` before commit.
5. Add regression test for every bug fix.

## Rules
- Never merge endpoint changes without test coverage.
- Keep tests deterministic; avoid network calls.
- Prefer seeded fixtures over random data.
