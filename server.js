// server.js (Render Fixed & Updated)

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors({
  origin: [
    "http://localhost:5500",             // Local Testing
    "http://127.0.0.1:5500",             // Local IP
    "https://noticepro-ai.vercel.app",   // Vercel App
    "https://notice-flow-ai.vercel.app"  // (Optional: Add if you have alternate domains)
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// --- Health Check ---
app.get("/", (req, res) => res.send("✅ Backend is Alive & Model Updated"));

// --- AI Setup ---
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// USE STANDARD FLASH MODEL (Works with lib version ^0.21.0)
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash" 
});

app.post("/generate-notice", async (req, res) => {
  try {
    const { title, summary, sign, type } = req.body;

    if (!title || !summary) {
      return res.status(400).json({ error: "Title and Summary are required" });
    }

    const prompt = `
      You are a College Admin. Write a formal ${type || 'Notice'}.
      
      Details:
      - Title: ${title}
      - Context: ${summary}
      - Signatories: ${sign}

      Rules:
      - Formal tone.
      - Start directly with the body text (No subject line in output).
      - Output HTML-ready text (use <br> for new lines).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });

  } catch (err) {
    console.error("❌ AI Generation Error:", err);
    // Send the actual error to the frontend to help debugging
    res.status(500).json({ 
        error: "AI Generation Failed", 
        details: err.message 
    });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));