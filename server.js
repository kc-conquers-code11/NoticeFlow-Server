// server.js (Direct API Call - No Library Issues)

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://noticepro-ai.vercel.app",
    "https://notice-flow-ai.vercel.app"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// --- Health Check ---
app.get("/", (req, res) => res.send(" Backend is Live (Direct API Mode)"));

// --- Validate Key ---
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
  process.exit(1);
}

// --- API Endpoint (The "Nuclear" Option) ---
app.post("/generate-notice", async (req, res) => {
  try {
    console.log("📩 Processing request...");
    const { title, summary, sign, type } = req.body;

    // 1. Construct the Prompt
    const prompt = `
      You are a professional College Admin. Write a formal ${type || 'Notice'}.
      
      Details:
      - Title: ${title}
      - Context: ${summary}
      - Signatories: ${sign}

      Rules:
      - Use strict formal academic tone.
      - Start directly with the body text.
      - Use <br> tags for line breaks.
      - Do NOT include a subject line or date in the output.
    `;

    // 2. Call Google API Directly (Bypassing the broken library)
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();

    // 3. Error Handling for Google API
    if (!response.ok) {
      console.error("Google API Error:", data);
      throw new Error(data.error?.message || "Google API Refused Connection");
    }

    // 4. Extract Text
    const generatedText = data.candidates[0].content.parts[0].text;
    
    console.log(" Generated successfully");
    res.json({ text: generatedText });

  } catch (err) {
    console.error("❌ Generation Failed:", err.message);
    res.status(500).json({ error: "Generation Failed", details: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
