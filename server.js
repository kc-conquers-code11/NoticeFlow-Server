// server.js (Render / Production Ready)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();

// IMPORTANT: Use dynamic PORT
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors({
  origin: "*", // later you can restrict to your Vercel URL
  methods: ["POST", "GET"]
}));
app.use(express.json());

// --- Health Check (VERY IMPORTANT for Render) ---
app.get('/', (req, res) => {
  res.send(' Notice Flow AI Backend is running');
});

// --- AI Initialization ---
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-2.5-flash';

// --- Core AI Endpoint ---
app.post('/generate-notice', async (req, res) => {
  try {
    const { title, summary, sign, type } = req.body;

    if (!title || !summary || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `
You are a highly professional College Administration Officer.

Write a formal, comprehensive, and well-structured official ${type}.

Inputs:
- Title: "${title}"
- Summary: "${summary}"
- Authority Signing: ${sign}

Rules:
1. Start with: "All the students and staff members are hereby informed that..."
2. Use formal administrative language.
3. End with a cooperation request.
4. Return ONLY the body text. No subject, date, or signature.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { temperature: 0.2 }
    });

    res.json({ text: response.text.trim() });

  } catch (err) {
    console.error("❌ AI Error:", err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`🚀 Notice Flow AI Backend running on port ${PORT}`);
});
