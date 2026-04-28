import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import crypto from "crypto";

import { AudioResponse } from "./services/audioService.js";
import { getAiResponse } from "./services/aiService.js";
import { TextToSpeech } from "./services/ttsService.js";
import { VoiceSysInstruction } from "./services/voiceInstructions.js";
import { json } from "stream/consumers";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { VectorStore } from "@langchain/core/vectorstores";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

const app = express();
app.use(cors());
app.use(express.json());

const port = 3021;
const VOICE_CONTEXT_CACHE_TTL_MS = 10 * 60 * 1000;
const voiceContextCache = new Map();
const voiceTelemetry = [];

app.get("/api/get-agent-token", async (req, res) => {
  const url = "https://api.deepgram.com/v1/auth/grant";
  const options = {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ttl_seconds: 300,
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    return res.json({
      key: data.access_token,
    });
  } catch (error) {
    console.log("error generating access token", error);
    res.status(500).json({
      error: "failed to provide interview context",
    });
  }
});

const client = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_API_KEY,
);

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "gemini-embedding-001",
  taskType: TaskType.RETRIEVAL_QUERY,
  apiKey: process.env.GOOGLE_API_KEY,
});

const vectorStore = new SupabaseVectorStore(embeddings, {
  client,
  tableName: "documents",
});

console.log("Vector store initialized");

function buildFallbackInterviewContext(survey) {
  const role = survey?.targetRole || "Software Developer";
  const stack = survey?.techStack || "general backend";
  const exp = survey?.experience || "No Experience";

  return [
    `Topic: Fundamentals: Q: Explain ${stack} in simple terms. A: Keep answer beginner-friendly, then expand with one practical example.`,
    `Topic: APIs: Q: How would you design a basic REST endpoint for ${role}? A: Mention method, route, validation, status codes, and error handling.`,
    `Topic: Debugging: Q: A feature works locally but fails in production. How do you debug it? A: Cover logs, env parity, reproduction, rollback, and monitoring.`,
    `Topic: Databases: Q: How do you model data for ${stack} projects? A: Explain normalization tradeoffs, indexes, and query performance basics.`,
    `Topic: Leveling: Q: Ask one ${exp}-appropriate follow-up based on candidate answer quality. A: If candidate struggles, simplify; if strong, deepen.`,
  ].join("\n\n");
}

app.post("/api/get-voice-context", async (req, res) => {
  const survey = req.body.surveyData;
  const sessionId = req.body.sessionId || "anonymous";
  console.log("Survey data", survey);

  try {
    const cacheKey = crypto
      .createHash("sha1")
      .update(
        JSON.stringify({
          sessionId,
          techStack: survey?.techStack,
          targetRole: survey?.targetRole,
          experience: survey?.experience,
        }),
      )
      .digest("hex");

    const cached = voiceContextCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < VOICE_CONTEXT_CACHE_TTL_MS) {
      return res.json({
        instructions: cached.instructions,
        cacheHit: true,
      });
    }

    let finalDocs = "";
    try {
      const results = await vectorStore.similaritySearch(
        `${survey.techStack} interview questions for ${survey.targetRole}`, // what to search for based on the keywords
        10, // 10 similiar questions
        {
          // only look in this specific pile
          stack: survey.techStack,
          difficulty: survey.experience,
        },
      );

      const shuffled = results.sort(() => 0.5 - Math.random());
      const selectedDoc = shuffled.slice(0, 5); // selecting 5 random questions
      finalDocs = selectedDoc
        .map((doc) => `Topic: ${doc.metadata.topic}: ${doc.pageContent}`)
        .join("\n\n");
    } catch (vectorError) {
      console.warn("Vector search unavailable, using fallback context:", vectorError?.message || vectorError);
      finalDocs = buildFallbackInterviewContext(survey);
    }

    // const pageContent = similiarSearch.map(s => s.pageContent)
    // console.log("page content", pageContent)

    // console.log(" RAG Context Selected:", finalDocs, "...");

    const instructions = await VoiceSysInstruction(survey, finalDocs);

    voiceContextCache.set(cacheKey, {
      instructions,
      createdAt: Date.now(),
    });

    return res.json({
      instructions,
      cacheHit: false,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "failed to provide interview context",
    });
  }
});

app.post("/api/voice-telemetry", (req, res) => {
  const payload = req.body || {};
  const entry = {
    ts: new Date().toISOString(),
    ...payload,
  };

  voiceTelemetry.push(entry);
  if (voiceTelemetry.length > 1000) {
    voiceTelemetry.shift();
  }

  const marks = payload?.marks || {};
  const tMic = marks.t_mic ?? null;
  const tSttPartial = marks.t_stt_partial ?? null;
  const tFirstToken = marks.t_first_token ?? null;
  const tFirstAudio = marks.t_first_audio ?? null;

  const toDelta = (start, end) =>
    typeof start === "number" && typeof end === "number"
      ? Math.max(0, end - start)
      : null;

  const summary = {
    sttLatencyMs: toDelta(tMic, tSttPartial),
    firstTokenLatencyMs: toDelta(tMic, tFirstToken),
    firstAudioLatencyMs: toDelta(tMic, tFirstAudio),
  };

  console.log("[voice-telemetry]", {
    sessionId: payload.sessionId,
    turnId: payload.turnId,
    summary,
  });

  return res.json({ ok: true });
});

app.listen(port, () => {
  console.log("Server started listening on port 3021");
});
