# VisionX (Intervue AI)

Intervue AI is an advanced AI-powered technical interviewing platform designed to conduct live, conversational, and interactive coding interviews. Utilizing the latest advances in large language models, voice AI, and modern web technologies, Intervue AI offers a frictionless experience for conducting highly realistic technical interviews.

## Features

- **Conversational Voice AI**: Features ultra-low latency real-time voice conversations acting as the technical interviewer.
- **Interactive Coding Mode**: Transition smoothly from verbal Q&A to hands-on coding challenges within a fully integrated live code editor.
- **Real-time Live Subtitles**: Track the conversation in real-time, with internal system commands intelligently filtered out to keep the candidate UI clean.
- **Automated Performance Reports**: Upon completing the interview, candidates receive a beautifully animated, high-fidelity report detailing their performance across multiple dimensions (System Thinking, Fundamentals, Code Quality, etc.).
- **Polished Premium UI**: Implements a sleek dark-mode, editorial-style layout using premium typography, glassmorphism, and sophisticated GSAP staggered animations.

## Tech Stack

### Client (Frontend)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Animations**: GSAP (@gsap/react), Framer Motion
- **UI Components**: Radix UI, Lucide React
- **Routing**: React Router DOM

### Server (Backend)
- **Framework**: Express.js (Node.js)
- **AI Intelligence**: Google Gemini API (`@google/genai`)
- **Speech-to-Text / Audio processing**: Deepgram SDK
- **Text-to-Speech**: MS Edge TTS (`node-edge-tts`)
- **Database & Storage**: Supabase
- **Additional LLM Tooling**: Langchain, Groq SDK

## Prerequisites

Before getting started, make sure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- `npm`

You will also need active API keys for:
- Google Gemini (or OpenAI)
- Deepgram
- Supabase

## Getting Started

The project is structured as a monorepo containing both the `client` and `server` folders.

### 1. Backend Setup

Open a terminal and navigate to the `server` directory:

```bash
cd server
npm install --legacy-peer-deps
```

Create a `.env` file in the `server` directory and configure your environment variables:
```env
# Example .env config
PORT=5000
DEEPGRAM_API_KEY=your_deepgram_api_key
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the backend server:
```bash
npm run start
```

### 2. Frontend Setup

Open a new terminal and navigate to the `client` directory:

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory if required by your configuration (e.g., matching the backend API URLs).

Start the frontend development server:
```bash
npm run dev
```

### 3. Start Interviewing
Open your browser to the URL provided by Vite (typically `http://localhost:5173`). Click "Start Call" to initiate the AI interviewer and begin the experience!

## Development & Architecture

- **`client/src/components/chat.jsx`**: Acts as the central hub managing the interview lifecycle, websocket connections, live coding mode transitions, and the final animated evaluation report.
- **`server/services/voiceInstructions.js`**: Contains the core logic and system prompts defining the AI's persona, its rules for triggering the coding interface, and instructions for outputting structured JSON for the final report.
