import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

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

app.get("/api/get-agent-token", async (req, res) => {
  const url = "https://api.deepgram.com/v1/auth/grant";
  const options = {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: {
      ttl_seconds: 300,
    },
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

app.post("/api/get-voice-context", async (req, res) => {
  const survey = req.body.surveyData;
  console.log("Survey data", survey);

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

    const finalDocs = selectedDoc
      .map((doc) => `Topic: ${doc.metadata.topic}: ${doc.pageContent}`)
      .join("\n\n");

    // const pageContent = similiarSearch.map(s => s.pageContent)
    // console.log("page content", pageContent)

    // console.log(" RAG Context Selected:", finalDocs, "...");

    const instructions = await VoiceSysInstruction(survey, finalDocs);

    return res.json({
      instructions,
    });
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log("Server started listening on port 3021");
});
