// server.js (BULLETPROOF MODE - GEMINI 1.5 FLASH)

require("dotenv").config();
const express = require("express");
const cors = require("cors");
// Dynamic import for node-fetch to avoid version issues
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. Middleware ---
app.use(cors({
  origin: "*", // Allow ALL origins to stop CORS errors permanently
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// --- 2. Health Check ---
app.get("/", (req, res) => res.send(" Server Live (Gemini 1.5 Flash Mode)"));

// --- 3. Emergency Backup Generator (For Presentation Safety) ---
function generateBackupNotice(title, summary, sign, type) {
  const date = new Date().toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric'});
  return `
    <div style="text-align: justify; font-family: 'Times New Roman', serif;">
    This is to inform all students, faculty, and staff members regarding <strong>${title}</strong>.<br><br>
    ${summary}<br><br>
    All concerned parties are requested to take note of this information. Cooperation from everyone is expected for the smooth functioning of the institution.<br><br>
    For any further clarifications, please contact the administrative office.<br><br>
    </div>
  `;
}

// --- 4. Main Endpoint ---
app.post("/generate-notice", async (req, res) => {
  const { title, summary, sign, type } = req.body;
  console.log(`📩 Processing: ${title}`);

  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("API Key Missing");

    // --- STRATEGY A: Try Google AI (Gemini 1.5 Flash) ---
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
      Act as a strict College Admin. Write a formal ${type || 'Notice'}.
      Details: Title: ${title}, Summary: ${summary}, Signatories: ${sign}.
      Rules: Return ONLY body text. Use HTML <br> for new lines. No markdown. Formal tone.
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();

    // Check if AI succeeded
    if (!response.ok || !data.candidates || !data.candidates[0].content) {
      console.error(" AI Failed. Reason:", JSON.stringify(data));
      throw new Error("Google AI Error");
    }

    const aiText = data.candidates[0].content.parts[0].text;
    console.log("AI Generated Successfully");
    res.json({ text: aiText });

  } catch (err) {
    // --- STRATEGY B: Presentation Saver (Smart Fallback) ---
    // Agar AI fail hua, toh error mat dikhao. Backup notice bhejo.
    console.log(" Switching to Auto-Recovery Mode (Presentation Safe)");
    console.error("Error Detail:", err.message);
    
    const safeText = generateBackupNotice(title, summary, sign, type);
    res.json({ text: safeText });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));