// server/server.js

// 1. Load Environment Variables (for the API key)
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
// const PORT = 3000;
const PORT = process.env.PORT || 5000; 

// Server start command:
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const cors = require('cors');
app.use(cors({
    origin: '*', // Baad mein isse apne frontend URL se replace kar dena
    credentials: true
}));

// --- Middleware ---
// 1. Enable CORS: Allows your frontend (running locally) to talk to this server
app.use(cors()); 
// 2. Parse JSON: Allows the server to read the data sent from the frontend
app.use(express.json()); 
// 3. Serve Frontend Files: Allows you to load index.html from the server address
app.use(express.static('../')); 

// --- AI Initialization ---
// Initialize the Gemini client using the secure environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 
const MODEL = 'gemini-2.5-flash'; 

// --- Core AI Endpoint: Handles content generation ---
app.post('/generate-notice', async (req, res) => {
    // Check for the API key immediately for better error handling
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
        
        // 2. Call the Gemini API
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                // Lower temperature (0.2) ensures formal, deterministic output
                temperature: 0.2, 
            },
        });

        const generatedText = response.text.trim();
        
        // 3. Send the AI-generated body text back to the frontend
        res.json({ text: generatedText });

    } catch (error) {
        console.error("AI Generation Error:", error.message);
        res.status(500).json({ error: 'Failed to generate notice content from AI. Check server logs.' });
    }
});

// --- Server Startup Block (The reason your server was exiting) ---
// This command keeps the Node.js server running and actively listening on the specified port.
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  ✅ SmartNotice Backend running on http://localhost:${PORT}`);
    console.log(`  🔗 Frontend accessible at http://localhost:${PORT}/index.html`);
    console.log(`======================================================\n`);
});