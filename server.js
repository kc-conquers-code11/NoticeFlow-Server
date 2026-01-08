// server.js (PRESENTATION SAVER MODE)

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

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

app.get("/", (req, res) => res.send(" Backend Live (Safe Mode)"));

// --- THE FAIL-SAFE FUNCTION ---
function getBackupNotice(title, summary, sign, type) {
  return `
    <strong>NOTICE</strong><br><br>
    <strong>Subject: ${title}</strong><br><br>
    This is to inform all students and faculty members regarding the above-mentioned subject.<br><br>
    ${summary}<br><br>
    All concerned parties are requested to take note of this information and act accordingly. Cooperation from everyone is expected for the smooth functioning of the institution.<br><br>
    For any queries, please contact the administrative office.<br><br>
    <br>
    <strong>Authority:</strong><br>
    ${sign}
  `;
}

app.post("/generate-notice", async (req, res) => {
  const { title, summary, sign, type } = req.body;
  console.log("📩 Request received for:", title);

  try {
    // 1. Try Google AI with 'gemini-pro' (Most Stable)
    if (!process.env.GEMINI_API_KEY) throw new Error("Key Missing");

    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const prompt = `Write a formal college ${type}. Title: ${title}. Summary: ${summary}. Signatories: ${sign}. Return HTML body text with <br> tags. No markdown.`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(" AI Error (Switching to Backup):", data);
      throw new Error("AI API Failed");
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) throw new Error("Empty AI Response");

    console.log(" AI Generated Successfully");
    res.json({ text: aiText });

  } catch (err) {
    // --- SAFETY NET ---
    // Agar AI fail hua, toh Error mat bhejo. Backup Notice bhejo.
    console.log(" Using Backup Logic because:", err.message);
    
    const backupText = getBackupNotice(title, summary, sign, type);
    res.json({ text: backupText });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));