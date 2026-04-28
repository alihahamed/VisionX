---
name: backend-security
description: Security baseline for FastAPI services handling repository URLs and async analysis jobs.
---

## Use this skill when
- Accepting external URLs or user-controlled inputs.
- Cloning repositories or handling filesystem paths.
- Defining error handling and observability.

## Checklist
1. Enforce HTTPS + hostname allowlist.
2. Block private/local network targets (SSRF guard).
3. Use isolated temp directories and always cleanup.
4. Cap runtime and analysis size to prevent abuse.
5. Never return stack traces to clients.
6. Log error buckets with stable codes.

## Rules
- Security validation server-side only.
- Treat all narrative content as untrusted.
- Keep secrets out of source and logs.
