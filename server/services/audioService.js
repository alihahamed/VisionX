import { pipeline } from "@huggingface/transformers";
import fs from "fs";
import { spawn } from "child_process";
import path from "path";

// This converts ANY audio (WebM, MP3, WAV) into the raw Float32 data the AI needs
function decodeAudio(filePath) {
  return new Promise((resolve, reject) => {
    // 1. Resolve absolute path to avoid Windows path issues
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
        return reject(new Error(`File not found: ${absolutePath}`));
    }

    const stats = fs.statSync(absolutePath);
    if (stats.size === 0) {
        return reject(new Error("File is empty (0 bytes). Frontend recording failed."));
    }

    const ffmpeg = spawn("ffmpeg", [
      "-i",
      absolutePath, // Use absolute path
      "-ar",
      "16000", // Sample rate: 16kHz
      "-ac",
      "1", // Channels: 1 (Mono)
      "-c:a",
      "pcm_f32le", // Codec: PCM 32-bit Floating Point Little Endian
      "-f",
      "f32le", // Format: Raw 32-bit float
      // "-hide_banner", // Optional: cleaner logs
      // "-loglevel", "error", // Optional: hide info logs
      "pipe:1", // Output: Stream to stdout
    ]);

    let buffers = [];

    // Collect the raw audio data coming from FFmpeg
    ffmpeg.stdout.on("data", (chunk) => {
      buffers.push(chunk);
    });

    // Handle errors - capture stderr to debug the specific FFmpeg crash reason
    let errorMessage = "";
    ffmpeg.stderr.on("data", (data) => {
      errorMessage += data.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code !== 0) {
        console.error("FFmpeg Crash Log:", errorMessage); // Log the actual FFmpeg error
        reject(new Error(`FFmpeg process exited with code ${code}. Check server logs for details.`));
      } else {
        // Combine chunks into one buffer
        const rawBuffer = Buffer.concat(buffers);

        // Create a Float32Array view of the buffer
        const float32Array = new Float32Array(
          rawBuffer.buffer,
          rawBuffer.byteOffset,
          rawBuffer.length / 4
        );

        resolve(float32Array);
      }
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
}

export async function AudioResponse(filePath) {
  try {
    console.log("Listening to the audio file at:", filePath);

    const transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny.en"
    );

    // Decode first
    const audioData = await decodeAudio(filePath);

    // Then transcribe
    const fullText = await transcriber(audioData);

    console.log("The full text is:", fullText.text);

    return fullText.text.trim();
  } catch (error) {
    console.log("Error while listening to the audio file", error);
    // Return null or empty string so the main controller handles it gracefully
    return null; 
  }
}