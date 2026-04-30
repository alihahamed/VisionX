export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = "https://api.deepgram.com/v1/auth/grant";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl_seconds: 300 }),
    });

    const data = await response.json();
    return res.json({ key: data.access_token });
  } catch (error) {
    console.error("get-agent-token error:", error);
    return res.status(500).json({ error: "failed to provide interview context" });
  }
}
