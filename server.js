const express = require("express");
const cors = require("cors");
const https = require("https");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Titonova AI backend is running");
});

app.post("/generate", (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ result: "Please enter a topic." });
  }

  const data = JSON.stringify({
    model: "gpt-4.1-mini",
    input: `Write a short engaging TikTok video script about: ${topic}`
  });

  const options = {
    hostname: "api.openai.com",
    path: "/v1/responses",
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data)
    }
  };

  const apiReq = https.request(options, (apiRes) => {
    let body = "";

    apiRes.on("data", (chunk) => {
      body += chunk;
    });

    apiRes.on("end", () => {
      try {
        const parsed = JSON.parse(body);

        if (parsed.error) {
          console.error(parsed.error);
          return res.status(500).json({ result: "OpenAI API error. Check your API key or billing." });
        }

        const text =
          parsed.output?.[0]?.content?.[0]?.text ||
          parsed.output_text ||
          "No response from AI.";

        res.json({ result: text });
      } catch (error) {
        console.error("Parse error:", error);
        res.status(500).json({ result: "Error parsing AI response." });
      }
    });
  });

  apiReq.on("error", (error) => {
    console.error("Request error:", error);
    res.status(500).json({ result: "API request failed." });
  });

  apiReq.write(data);
  apiReq.end();
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});