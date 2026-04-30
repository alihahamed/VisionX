export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = req.body || {};
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
}
