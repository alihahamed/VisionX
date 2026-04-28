---
name: api-contract-sync
description: Keep FastAPI OpenAPI and frontend TypeScript contracts aligned.
---

## Use this skill when
- Adding/changing response models, enums, or endpoint paths.
- Updating frontend data contracts.

## Checklist
1. Update Pydantic models first.
2. Verify OpenAPI reflects schema changes.
3. Regenerate frontend types from OpenAPI (preferred).
4. Confirm enum parity:
   - `queued|running|done|failed|timeout|invalid_repo`
   - `Initiator|Implementer|Corrector|Unblocker`
   - `convergence|replacement|unblocking|correction|architectural_pivot`
5. Add tests for changed API shape.

## Rules
- Backend schema is source of truth.
- Never introduce silent breaking contract changes.
