// server.js (FINAL FIX - Direct API with Gemini Pro)

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
app.get("/", (req, res) => res.send("✅ Backend is Live (Gemini Pro - Direct Mode)"));

// --- Validate Key ---
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
  process.exit(1);
}

// --- API Endpoint ---
app.post("/generate-notice", async (req, res) => {
  try {
    console.log("📩 Processing request...");
    const { title, summary, sign, type } = req.body;

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

    const apiKey = process.env.GEMINI_API_KEY;
    
    //  FIX: Switched to 'gemini-pro' (Flash was causing 404s)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

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

    // Debugging: Log any API errors from Google
    if (!response.ok) {
      console.error("❌ Google API Error:", JSON.stringify(data, null, 2));
      throw new Error(data.error?.message || "Google API Refused Connection");
    }

    // Extract Text safely
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
       throw new Error("No text returned from AI");
    }
    
    console.log(" Generated successfully");
    res.json({ text: generatedText });

  } catch (err) {
    console.error(" Critical Server Error:", err.message);
    res.status(500).json({ error: "Generation Failed", details: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
