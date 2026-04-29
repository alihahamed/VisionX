# VisionX (Intervue AI) - Architectural Overview

This document provides a comprehensive overview of the VisionX platform, its core components, the conversational AI flow, and the technical mechanisms driving the live interview experience.

## System Architecture

VisionX is designed as a full-stack JavaScript monorepo, divided into a **React/Vite Frontend** (`client`) and a **Node.js/Express Backend** (`server`).

### 1. The Frontend (Client)
The frontend serves as the interactive surface for the candidate. It manages the audio streams, the UI states (Home, Survey, Call, Coding, Report), and the WebSocket connection.
- **`chat.jsx`**: The orchestrator of the entire application. It manages the state machine of the interview, transitioning the user from the landing page to the pre-interview survey, into the live call, handling live coding prompts, and finally presenting the evaluation report.
- **State Management & Hooks**: Uses a custom `useChat()` hook that interfaces with the WebRTC/WebSocket audio streams, broadcasting user audio and receiving the AI's audio responses.
- **Live Code Editor (`codeInterface.jsx`)**: A full-featured code editor overlay that appears when the AI initiates a coding challenge. It tracks user attempts, captures snapshots, and passes them back to the server for live evaluation.
- **GSAP Animations**: Heavy use of `@gsap/react` to orchestrate smooth, editorial-style entrance and exit animations, especially noticeable in the `ReportView` component.

### 2. The Backend (Server)
The backend acts as the bridge between the candidate's audio stream and the intelligence layer (LLMs and APIs).
- **Audio Processing**: Utilizes the `@deepgram/sdk` for ultra-low latency Speech-to-Text. As the candidate speaks, Deepgram streams transcriptions back to the server.
- **Agent Intelligence (`voiceInstructions.js`)**: The core brain of the interviewer. It uses `Google Gemini` (or OpenAI) to process the candidate's transcribed speech, apply the behavioral rules defined in the system prompt, and decide what to say next. It can also emit specific "Machine Tags" (like `[[CODE_REVIEW:...]]`) to trigger actions on the client.
- **Text-to-Speech**: Synthesizes the LLM's text responses into natural-sounding speech using `node-edge-tts` (or similar TTS providers) and streams the audio buffer back to the client over WebSockets.
- **State Tracking**: The backend maintains the conversation history within the WebSocket session, keeping context of what has been discussed, what coding challenges have been issued, and how many attempts the candidate has made.

## The Interview Lifecycle

1. **Pre-Interview**: The user lands on the Home view, clicks "Get Started", and completes a brief survey (Name, Experience, Tech Stack).
2. **Connection & Handshake**: The client opens a WebSocket connection to the server. Once established, the client begins streaming microphone audio.
3. **Conversational Q&A**: The AI agent asks questions based on the user's survey. It listens for responses, determines when the user has stopped speaking, and replies.
4. **Coding Challenges**: If the AI decides to test coding skills, it verbally introduces a challenge and instructs the system to open the `CodeInterface`. 
5. **Live Evaluation**: The candidate types code and clicks Submit. The code is sent to the AI via a hidden system prompt. The AI evaluates the logic, issues a `PASS` or `FAIL` (with hints), and verbally guides the candidate.
6. **Wrap-up & Reporting**: After the coding rounds (or if the candidate runs out of attempts), the AI concludes the interview and generates a structured JSON payload representing the final evaluation.
7. **Report View**: The client receives this payload, closes the call interface, and triggers the GSAP animations to reveal the high-fidelity `ReportView`.

## Data Flow (WebSocket)
- **`Client -> Server`**: Raw Base64 audio chunks (from microphone).
- **`Client -> Server`**: Hidden textual injected messages (e.g., Code submissions, forced wrap-up signals).
- **`Server -> Client`**: Base64 audio chunks (TTS from the AI).
- **`Server -> Client`**: `ConversationText` events (Transcripts of what the user or AI said, used for live subtitles).
- **`Server -> Client`**: `AgentThinking` events (Used to show the pulse/thinking animation on the client).

## UI/UX Design Guidelines
- **Typography**: Uses the `Outfit` font globally for a modern, sleek aesthetic.
- **Color Palette**: Strictly dark-mode native (`bg-black`, `#09090b`), utilizing `white/10` borders and specific slate accents (`slate-500` for subtitles) to avoid generic, unpolished looks.
- **Layout**: Interfaces are heavily centralized and tightly packed (like the pill-shaped control nav) to eliminate dead space.

## Future Extensibility
- **Persistent Storage**: Currently, the final report is generated in memory. The next step is wiring this structured JSON to the Supabase database.
- **Multiple Agent Personas**: Extending `voiceInstructions.js` to allow candidates to select different types of interviewers (e.g., "Strict Architect", "Friendly Mentor").
