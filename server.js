// server.js (FINAL STABLE VERSION)

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://noticepro-ai.vercel.app",
    "https://notice-flow-ai.vercel.app" // Just in case
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => res.send(" Backend Live (Gemini Pro)"));

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ KEY MISSING");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//  HUMNE 'gemini-pro' KAR DIYA KYUKI YE SABSE STABLE HAI
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

app.post("/generate-notice", async (req, res) => {
  try {
    console.log("📩 Request received..."); // Logs mein dikhega
    const { title, summary, sign, type } = req.body;

    const prompt = `Write a formal ${type} for college. Title: ${title}. Summary: ${summary}. Sign: ${sign}. Return only body text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(" Generated successfully");
    res.json({ text });

  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));