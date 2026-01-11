// server/server.js

// 1. Load Environment Variables
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();

// --- Configuration ---
// Render apna PORT dega, nahi toh local pe 5000 chalega
const PORT = process.env.PORT || 5000; 

// --- Middleware (Fixed & Consolidated) ---
// 1. Enable CORS: Allow all origins (*) so Render/Localhost don't fight
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

// 2. Parse JSON: Frontend data read karne ke liye
app.use(express.json()); 

// 3. Serve Frontend Files: Agar root se chala rahe ho toh index.html serve karega
app.use(express.static('../')); 

// --- AI Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 
// Note: 'gemini-2.0-flash' is the current stable reference. 
const MODEL = 'gemini-2.0-flash'; 

// --- Core AI Endpoint ---
app.post('/generate-notice', async (req, res) => {
    // Check for API key presence
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
    }

    try {
        const { title, summary, sign, type } = req.body;

        // --- Prompt Engineering ---
        const prompt = `
            You are a highly professional College Administration Officer. 
            Write a formal, comprehensive, and well-structured official ${type} for a college based on the following event:

            **Inputs:**
            - Title/Subject: "${title}"
            - Core Context/Summary: "${summary}"
            - Authority Signing: ${sign}
            - Document Type: ${type}
            
            **Instructions:**
            1. The text must use strictly formal, administrative language, matching the professional college notice style.
            2. The first sentence must begin with: "All the students and staff members are hereby informed that..." 
            3. Clearly incorporate the "Core Context/Summary" into the body text.
            4. Conclude with a request for cooperation (e.g., "All concerned are requested to take note of the same and cooperate...") and a standard goodwill closing phrase.
            5. The entire response must be a single block of text (the notice body). DO NOT include the Subject, Date, or Signature/Closing phrase in the output.
        `;
        
        // Call Gemini API
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                temperature: 0.2, 
            },
        });

        // Safe response handling
        let generatedText = "";
        if (typeof response.text === 'function') {
            generatedText = response.text();
        } else {
            generatedText = response.text || "";
        }
        
        // Send back to frontend
        res.json({ text: generatedText.trim() });

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate notice content. Check server logs.' });
    }
});

// --- Health Check Route (For Render) ---
app.get('/', (req, res) => {
    res.send("✅ Notice Flow AI Backend is Running!");
});

// --- Server Startup (Only ONCE at the bottom) ---
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(` ✅ SmartNotice Backend running on Port: ${PORT}`);
    console.log(` 🔗 Local Access: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
});