import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import ffmpegStatic from "ffmpeg-static";
import { spawn } from "child_process";
import wav from "wav";
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export async function TextToSpeech(text, filePath) {
  try {
    console.log("Converting tts...")
    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      "en-US-AriaNeural",
      OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS
    );
    
    const {audioStream} = await tts.toStream(text, {rate:1.2, pitch:"+5Hz"})

    const audioBuffer = await new Promise((resolve, reject) => {
      const chunks = [];

      audioStream.on("data", (chunk) => {
        chunks.push(chunk); // Collect chunks as they arrive
      });

      audioStream.on("end", () => {
        resolve(Buffer.concat(chunks)); // Join all chunks into one Buffer
      });

      audioStream.on("error", (err) => {
        reject(err); // Handle stream errors
      });
    })
    console.log("tts converted!")
    return audioBuffer;
  } catch (error) {
    console.error("❌ TTS Error:", error);
    return null;
  }
}
