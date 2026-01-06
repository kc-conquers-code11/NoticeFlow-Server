// server.js (Render + Production READY)

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// IMPORTANT: Render requires dynamic PORT
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors({
  origin: "*", // later restrict to Vercel domain
  methods: ["GET", "POST"]
}));
app.use(express.json());

// --- Health Check (MANDATORY for Render) ---
app.get("/", (req, res) => {
  res.send(" Notice Flow AI Backend is running");
});

// --- Validate API Key ---
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
  process.exit(1);
}

// --- Gemini AI Initialization (STABLE) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

// --- Core AI Endpoint ---
app.post("/generate-notice", async (req, res) => {
  try {
    const { title, summary, sign, type } = req.body;

    if (!title || !summary || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `
You are a highly professional College Administration Officer.

Write a formal, well-structured official ${type}.

Rules:
- Start with: "All the students and staff members are hereby informed that..."
- Use formal administrative language only
- Clearly include the summary
- End with a cooperation request
- Return ONLY the notice body text
- Do NOT include subject, date, or signature

Title: ${title}
Summary: ${summary}
Authority: ${sign}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });

  } catch (err) {
    console.error("❌ Gemini AI Error:", err.message);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Notice Flow AI Backend running on port ${PORT}`);
});
