---
name: frontend-testing
description: Validate Next.js routes, data fetching, and async UI states in App Router apps.
---

## Use this skill when
- Adding routes or client components.
- Wiring API polling and error states.
- Updating shared contract types or environment variables.

## Checklist
1. Verify page render with `npm run build` or `npm run lint`.
2. Test success and failure API states.
3. Confirm loading and terminal states render correctly.
4. Validate env var fallback behavior.
5. Check mobile and desktop layout.

## Rules
- Every async route needs loading and error handling.
- Every backend field used in UI should be typed.
