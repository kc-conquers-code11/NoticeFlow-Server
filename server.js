// server/server.js

// 1. Load Environment Variables
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();

// --- Configuration ---
const PORT = process.env.PORT || 5000; 

// --- Middleware ---
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json()); 
app.use(express.static('../')); 

// --- AI Initialization (Groq) ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

//  MODEL: Llama 3.3 (Fast & Stable)
const MODEL = 'llama-3.3-70b-versatile'; 

// --- Core AI Endpoint ---
app.post('/generate-notice', async (req, res) => {
    // Check for API key
    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: GROQ_API_KEY is missing.' });
    }

    try {
        const { title, summary, sign, type } = req.body;

        // --- Prompt Engineering (Updated for Brevity) ---
        const prompt = `
            You are a highly professional College Administration Officer. 
            Write a formal, comprehensive, and well-structured official ${type} for a college based on the following event:

            **Inputs:**
            - Title/Subject: "${title}"
            - Core Context/Summary: "${summary}"
            - Authority Signing: ${sign}
            - Document Type: ${type}
            
            **Instructions:**
            1. The text must use strictly formal, administrative language.
            2. The first sentence must begin with: "All the students and staff members are hereby informed that..." 
            3. Clearly incorporate the "Core Context/Summary" into the body text.
            4. **CRITICAL:** Keep the notice CONCISE, CRISP, and TO THE POINT. Avoid repetitive sentences or flowery language. The length should be short (approx. 100-150 words max).
            5. Conclude with a simple request for cooperation.
            6. The entire response must be a single block of text (the notice body only). DO NOT include the Subject, Date, or Signature/Closing phrase in the output.
        `;
        
        // Call Groq API
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: MODEL,
            temperature: 0.1, // Lower temperature = More precise/less creative fluff
            max_tokens: 300,  // Reduced limit to prevent long essays
        });

        // Safe response handling
        const generatedText = chatCompletion.choices[0]?.message?.content || "";
        
        // Send response
        res.json({ text: generatedText.trim() });

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: 'AI Service Error. Please try again.' });
    }
});

// --- Health Check Route ---
app.get('/', (req, res) => {
    res.send("✅ Notice Flow AI (Groq Engine) is Running!");
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(` ✅ SmartNotice Backend (Groq) running on Port: ${PORT}`);
    console.log(`======================================================\n`);
});