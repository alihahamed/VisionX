# VisionX — Intervue AI

AI-powered technical interview platform that conducts live, adaptive voice interviews with real-time coding challenges, body language analysis, and automated evaluation reports.

## What It Does

- **Live Voice Interview** — Real-time conversational AI interviewer using Deepgram's voice agent with ultra-low latency STT/TTS and GPT-4o-mini for reasoning
- **Adaptive Difficulty** — Dynamically adjusts question depth based on candidate responses, experience level, and tech stack
- **Interactive Coding Mode** — Mid-interview coding challenges with a live code editor, multi-attempt evaluation, and AI-powered code review
- **Body Language Analysis** — Real-time face tracking via MediaPipe FaceLandmarker (browser-side, zero server cost) measuring eye contact, head stability, and facial engagement
- **Interviewer Personas** — 4 selectable AI personalities: Balanced, Strict Architect, Friendly Mentor, Devil's Advocate — each with distinct communication styles injected into the system prompt
- **Automated Reports** — Structured evaluation across 6 rubric dimensions with strengths, gaps, evidence, and next steps, animated with GSAP

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Animations | GSAP + @gsap/react, Framer Motion |
| UI Components | Radix UI (shadcn), Lucide React |
| Voice Agent | Deepgram SDK (STT + TTS + Agent) |
| LLM (Think) | OpenAI GPT-4o-mini (via Deepgram Agent) |
| Knowledge Base | Google Gemini API (@google/genai) |
| Face Analysis | MediaPipe FaceLandmarker (@mediapipe/tasks-vision) |
| Database | Supabase |
| Server | Express.js (Node.js) |

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- API keys for: **Deepgram**, **Google Gemini**, **Supabase**

## Setup

### Backend

```bash
cd server
npm install --legacy-peer-deps
```

Create `server/.env`:
```env
PORT=3021
DEEPGRAM_API_KEY=your_key
GEMINI_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
```

```bash
npm run start
```

### Frontend

```bash
cd client
npm install
```

```bash
npm run dev
```

Open `http://localhost:5173`, complete the survey, select your voice + persona, and start the interview.

## Architecture

```
client/
├── src/components/
│   ├── chat.jsx              # Interview lifecycle orchestrator
│   ├── codeInterface.jsx     # Live code editor overlay
│   ├── surveyModal.jsx       # Pre-interview survey flow
│   ├── voicePicker.jsx       # TTS voice selector
│   └── personaPicker.jsx     # AI persona selector
├── src/hooks/
│   └── useFaceAnalysis.js    # MediaPipe face tracking hook
server/
├── index.js                  # Express + WebSocket server
├── services/
│   └── voiceInstructions.js  # System prompt + persona styles
└── knowledgeBase.js          # RAG context generation via Gemini
```

### Key Files

- **`chat.jsx`** — Central hub: manages WebSocket connection, audio streams, function call routing, coding mode transitions, presence HUD overlay, and the final animated report
- **`voiceInstructions.js`** — Dynamic system prompt builder that injects persona-specific communication styles and interview flow rules
- **`useFaceAnalysis.js`** — Custom React hook running MediaPipe's FaceLandmarker at configurable FPS, computing iris tracking, yaw variance, and blendshape engagement scores

## Documentation

- [`process.md`](./process.md) — Development process, design decisions, and technical deep dives
- [`overview.md`](./overview.md) — Full architectural overview and data flow documentation
