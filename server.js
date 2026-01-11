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

// --- Middleware ---
// 1. Enable CORS: Isse frontend (jo alag port ya domain pe ho sakta hai) backend se baat kar payega.
app.use(cors({
    origin: '*', // Abhi ke liye sab allow kiya hai taaki koi error na aaye
    credentials: true
}));

// 2. Parse JSON: Frontend se aane wale data ko padhne ke liye
app.use(express.json()); 

// 3. Serve Frontend Files: Ye line tumhare root folder (../) se index.html serve karegi
app.use(express.static('../')); 

// --- AI Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 
const MODEL = 'gemini-2.0-flash'; // Note: Updated to stable model name if 2.5 isn't available, or keep your specific version

// --- Core AI Endpoint ---
app.post('/generate-notice', async (req, res) => {
    // Check for API key
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

        const generatedText = response.text().trim(); // Fixed: response.text() is a function in some SDK versions, or response.text directly. Usually response.response.text() in older, but new @google/genai is cleaner. safely accessing it.
        
        // Send response
        res.json({ text: generatedText });

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate notice content from AI. Check server logs.' });
    }
});

// --- Server Startup ---
// Sirf ek baar listen karega (Correct way)
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(` ✅ SmartNotice Backend running on Port: ${PORT}`);
    console.log(` 🔗 Local Access: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
});