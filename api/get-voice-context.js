import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { TaskType } from "@google/generative-ai";
import crypto from "crypto";
import { VoiceSysInstruction } from "../server/services/voiceInstructions.js";

// ── Shared singletons (persist across warm invocations) ──────────────────────

let vectorStore = null;
let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_PROJECT_URL,
      process.env.SUPABASE_API_KEY
    );
  }
  return supabaseClient;
}

function getVectorStore() {
  if (!vectorStore) {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "gemini-embedding-001",
      taskType: TaskType.RETRIEVAL_QUERY,
      apiKey: process.env.GOOGLE_API_KEY,
    });
    vectorStore = new SupabaseVectorStore(embeddings, {
      client: getSupabase(),
      tableName: "documents",
    });
  }
  return vectorStore;
}

// ── Fallback context (when vector search is unavailable) ─────────────────────

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

// ── In-memory cache (per warm instance) ──────────────────────────────────────
const VOICE_CONTEXT_CACHE_TTL_MS = 10 * 60 * 1000;
const voiceContextCache = new Map();

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const survey = req.body?.surveyData;
  const sessionId = req.body?.sessionId || "anonymous";

  try {
    const cacheKey = crypto
      .createHash("sha1")
      .update(
        JSON.stringify({
          sessionId,
          techStack: survey?.techStack,
          targetRole: survey?.targetRole,
          experience: survey?.experience,
        })
      )
      .digest("hex");

    const cached = voiceContextCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < VOICE_CONTEXT_CACHE_TTL_MS) {
      return res.json({ instructions: cached.instructions, cacheHit: true });
    }

    let finalDocs = "";
    try {
      const results = await getVectorStore().similaritySearch(
        `${survey.techStack} interview questions for ${survey.targetRole}`,
        10,
        { stack: survey.techStack, difficulty: survey.experience }
      );
      const shuffled = results.sort(() => 0.5 - Math.random());
      const selectedDoc = shuffled.slice(0, 5);
      finalDocs = selectedDoc
        .map((doc) => `Topic: ${doc.metadata.topic}: ${doc.pageContent}`)
        .join("\n\n");
    } catch (vectorError) {
      console.warn("Vector search unavailable, using fallback:", vectorError?.message);
      finalDocs = buildFallbackInterviewContext(survey);
    }

    const instructions = await VoiceSysInstruction(survey, finalDocs);

    voiceContextCache.set(cacheKey, { instructions, createdAt: Date.now() });

    return res.json({ instructions, cacheHit: false });
  } catch (error) {
    console.error("get-voice-context error:", error);
    return res.status(500).json({ error: "failed to provide interview context" });
  }
}
