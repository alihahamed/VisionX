# Development Process

This document captures the design decisions, implementation process, and technical reasoning behind VisionX.

---

## Phase 1 — Core Voice Interview Loop

### Goal
Build a real-time, low-latency voice interview agent that feels like talking to a real human interviewer.

### Approach
- Used **Deepgram's Agent API** as the orchestration layer — it handles STT → LLM → TTS in a single WebSocket connection, eliminating the need to manually chain three separate services.
- LLM: **GPT-4o-mini** via Deepgram's `think` provider — chosen for speed. Larger models (GPT-4o, Claude) were tested but added 800ms-1.2s of latency per turn, making conversation feel unnatural.
- Audio: Raw **LINEAR16 PCM** at native sample rate (input) and 24kHz (output). No MP3/Opus encoding overhead.
- End-of-turn detection: Tuned `eot_threshold: 0.65` and `eager_eot_threshold: 0.4` to balance between cutting off the user too early and waiting too long to respond.

### Key Decisions
- **No server-side audio processing**: All audio flows directly between the browser and Deepgram. The Express server only handles session setup (fetching auth tokens, building system prompts, RAG context).
- **WebSocket message routing**: All function calls from the AI (coding mode, report generation, interview end) arrive as `FunctionCallRequest` events. We process all functions in each batch to handle cases where the AI sends multiple tool calls in one message.

---

## Phase 2 — Interactive Coding Mode

### Goal
Allow the AI to seamlessly transition from verbal Q&A to a hands-on coding challenge mid-interview.

### Approach
- AI calls `enable_coding_mode` tool → client opens a full-screen code editor overlay
- Editor supports syntax highlighting, multiple language modes, and tracks up to 3 submission attempts
- On submit, the code is injected as a hidden system message back to the AI for evaluation
- AI responds with PASS/FAIL/FINAL_FAIL and optional hints

### Key Decisions
- **Tool-driven, not keyword-driven**: Earlier iterations used regex parsing of AI text to detect coding triggers. This was fragile. Switched to Deepgram's native function calling, which is deterministic.
- **Max 3 attempts**: Prevents infinite retry loops and forces the AI to provide the ideal approach after final failure.
- **Coding mode lock**: The interview continues verbally while coding is active — the AI can discuss the problem while the candidate codes.

---

## Phase 3 — Pre-Interview Survey & RAG Context

### Goal
Personalize every interview based on the candidate's background.

### Approach
- Multi-step survey modal captures: name, target role, experience level, tech stack
- Backend uses **Google Gemini** to generate role-specific technical questions and evaluation criteria (RAG context)
- This context is injected into the system prompt as a "difficulty anchor" — the AI uses it as reference material but never reads questions verbatim

### Key Decisions
- **Gemini for RAG, GPT-4o-mini for conversation**: Gemini generates the knowledge base once per session (cold path). GPT-4o-mini handles the hot path (real-time conversation). This separation keeps latency low while maintaining high-quality question generation.
- **Experience-adaptive**: The same tech stack produces different questions for Junior vs Senior candidates.

---

## Phase 4 — Interviewer Personas

### Goal
Let users choose the type of interviewer they want to practice with.

### Approach
- Created 4 distinct personas with unique communication styles:
  - **Balanced** — Fair, thorough, structured evaluation
  - **Strict Architect** — Blunt, system-design focused, demands concrete numbers
  - **Friendly Mentor** — Warm, encouraging, guides with hints
  - **Devil's Advocate** — Challenges every answer, tests conviction
- Each persona injects a `STYLE:` block into the system prompt that modifies how the AI communicates (not what it evaluates)

### Key Decisions
- **Modular prompt injection**: Persona styles are appended to the base prompt, not hardcoded. Adding a new persona = adding one object to `PERSONA_STYLES`.
- **Locked during interview**: The persona picker is disabled once the call starts. Changing personality mid-interview would confuse the conversation context.
- **Evaluation is persona-independent**: All personas use the same rubric and scoring criteria. A Friendly Mentor doesn't give higher scores — it just delivers feedback differently.

---

## Phase 5 — Body Language & Presence Analysis

### Goal
Add a non-verbal dimension to the interview evaluation — something traditional AI interview platforms don't offer.

### Approach
- Integrated **MediaPipe FaceLandmarker** (`@mediapipe/tasks-vision`) running entirely in the browser via WebAssembly
- Tracks 478 face landmarks + 52 blendshape scores per frame
- Three computed metrics:
  - **Eye Contact**: Iris landmark displacement relative to eye socket center. Below threshold = looking at camera.
  - **Head Stability**: Yaw variance over a sliding window. Low variance = composed, high variance = fidgety.
  - **Engagement**: Blendshape activity (brow raises, smiles, jaw movement). Active face = engaged.
- Composite score: `(eye_contact × 0.45) + (head_stability × 0.30) + (engagement × 0.25)`

### Key Decisions
- **Client-side only**: Zero server cost. The ~4MB WASM model loads from CDN on first use. All processing happens in the browser.
- **Configurable FPS**: Running at adjustable intervals to balance accuracy vs CPU usage. The hook auto-skips frames when the tab is backgrounded.
- **Non-penalizing on face loss**: If MediaPipe can't detect a face (bad lighting, camera angle), those frames are skipped — not counted against the candidate.
- **Live HUD**: A small eye contact percentage pill overlay on the webcam feed gives real-time feedback without being distracting.

---

## Phase 6 — Automated Reports

### Goal
Generate a comprehensive, visually polished evaluation report the moment the interview ends.

### Approach
- AI calls `finalize_interview_report` with structured JSON: verdict, overall score, 6-dimension rubric, strengths, gaps, evidence, next steps, and summary
- Client normalizes the payload (defaults for missing fields) and merges in the presence/body language data
- Report renders as a full-screen overlay with GSAP-orchestrated entrance animations: fade, stagger, scale, and a count-up progress bar for the presence score

### Key Decisions
- **Structured function calling, not text parsing**: The report schema is defined in the tool's parameter spec. The AI generates valid JSON directly — no regex extraction needed.
- **Presence data merged client-side**: The AI doesn't know about eye contact scores. The face analysis hook's `getPresenceReport()` is called at finalize time and injected into the report object before rendering.
- **Report persisted to localStorage**: Acts as a safety net if the user accidentally closes the tab.

---

## Prompt Engineering Notes

### System Prompt Size vs Latency
The system prompt directly impacts per-turn latency because the LLM processes it on every turn. We found:
- **~8KB prompt**: Added 400-600ms latency per turn, broke barge-in interruption
- **~3.5KB prompt**: Sweet spot — all behavioral rules preserved, snappy responses, clean interruption

### Optimization Techniques
- **Dense formatting**: Telegram-style instructions instead of verbose paragraphs. LLMs parse structured lists faster than prose.
- **Single-line persona blocks**: Each persona's communication style is one dense paragraph, not a numbered list.
- **No redundant context**: If a rule is already implied by the function schema (e.g., "call finalize_interview_report with verdict"), don't repeat it in the prompt body.

---

## Challenges & Lessons

1. **Batch function calls**: Deepgram's agent can send multiple function calls in one WebSocket message. Our initial handler only processed `functions[0]`, silently dropping `end_interview` when it arrived alongside `finalize_interview_report`. Fixed by iterating over all functions.

2. **Prompt bloat → latency spiral**: As features were added, the system prompt grew organically. Each addition seemed small, but the cumulative effect doubled response time. Lesson: treat prompt tokens like bytes — every one costs latency.

3. **MediaPipe on low-end devices**: FaceLandmarker with GPU delegate works well on modern hardware but can struggle on integrated GPUs. The hook dynamically adjusts its processing interval if frames take too long.

4. **Select component z-index wars**: The survey modal's dropdowns required careful z-index management (`z-[300]`) to render above the modal overlay. Radix portals helped but needed explicit configuration.
