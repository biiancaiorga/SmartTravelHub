import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

dotenv.config();

const server = express();
server.use(cors());
server.use(express.json({ limit: '50mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const googleAI = new GoogleGenAI({ apiKey: apiKey });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Google Gemini endpoints
server.post('/api/plan', async (req, res) => {
    const { destinatie, zile, buget, stil } = req.body;
    
    try {
        const promptGhid = `You are an expert travel planner. Create a clean, well-structured travel guide and day-by-day itinerary for ${destinatie}. 
        Duration: ${zile} days. Budget level: ${buget}. Specific interests/style: ${stil || 'general travel'}.
        
        THE RESPONSE FORMAT MUST STRICTLY ADHERE TO THE FOLLOWING STRUCTURE. GENERATE ALL CONTENT ENTIRELY IN ROMANIAN (except for HTML tags):
        
        <h3>${destinatie}</h3>
        <p><strong>Prezentare Generală:</strong> Provide a brief, engaging introduction to the destination</p>
        <p><strong>Detalii Buget & Stil:</strong> Explain how the specified budget and style fit this trip</p>
        <p><strong>Itinerariu pe Zile:</strong> Provide the day-by-day itinerary here using standard paragraphs and bullet points for activities</p>
        
        CRITICAL NOTE: The very first line of your response must consist ONLY of the clean destination name wrapped inside <h3> and </h3> tags. Do not add any other characters before or after this tag (no markdown formatting like **, no triple backticks \`\`\`, and no introductory text), as this specific title is parsed programmatically by the frontend to center the Google Map. Use clean HTML format (<h3>, <p>, <ul>, <li>).`;
        
        const rezultat = await googleAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptGhid,
        });
        
        return res.json({ text: rezultat.text });
    } catch (err) {
        console.error("Eroare la generarea itinerariului (Gemini):", err);
        return res.status(500).json({ error: err.message });
    }
});

server.post('/api/recunoastere', async (req, res) => {
    const { imagineBase64, contextSuplimentar } = req.body;
    
    if (!imagineBase64) {
        return res.status(400).json({ error: "Imaginea nu a fost furnizată." });
    }

    try {
        const dateImagine = {
            inlineData: {
                data: imagineBase64.split(',')[1],
                mimeType: "image/jpeg"
            }
        };
        
        const promptImagine = `You are an advanced Computer Vision AI and a world-class expert in global heritage, urban geography, and architectural history. Your absolute priority is to perform a rigorous, pixel-level analysis of ANY image provided to guarantee a 100% accurate identification.

        CONTEXT CLUES PROVIDED BY THE USER OR SYSTEM METADATA:
        ${contextSuplimentar ? `CRITICAL HINT: Use the following geographic/contextual data to restrict your search area and validate your findings: "${contextSuplimentar}"` : "No extra context provided. Rely entirely on visual elements."}

        UNIVERSAL ANALYSIS PROTOCOL (Mandatory for every image):
        1. CRITICAL: Never jump to a conclusion based on the most prominent foreground object. Avoid lazy pattern-matching. If context clues are provided above, use them immediately to narrow down the possible region or country.
        2. Cross-examine the entire scene: analyze background architecture, building styles, construction materials, window alignments, color palettes, topography, street slopes, horizon lines, and any ambient text, numbers, or logos.
        3. Cross-reference all these environmental clues with your vast knowledge base to confidently differentiate between highly similar landmarks or twin structures located within the same city or country. Your final identification must be specific, exact, and undeniable.

        THE RESPONSE FORMAT MUST STRICTLY ADHERE TO THE FOLLOWING STRUCTURE. GENERATE ALL REPLIES ENTIRELY IN ROMANIAN (except for the HTML tags):

        <h3>Insert only the exact officially recognized name of the landmark here</h3>
        <p><strong>Locația Exactă:</strong> Provide the exact city, region, country, and precise street or plaza name where this specific photo view is located</p>
        <p><strong>Scurtă Istorie:</strong> Provide rigorous high-academic historical facts, construction or inauguration year, creators if known, and its cultural or engineering significance</p>
        <p><strong>Sfaturi Utile:</strong> Provide 2-3 highly specific practical recommendations for visitors visiting this exact spot</p>

        CRITICAL FORMATTING NOTE: 
        1. The very first line of your response must consist ONLY of the clean name wrapped inside <h3> and </h3> tags.
        2. The second line MUST contain the exact text query for Google Maps, enclosed strictly within the HTML comment tag as shown: . Do not add markdown or extra spaces inside this comment.
        3. Do not add any markdown formatting (like asterisks ** or bolding inside h3), no backticks (\`\`\`), and no introductory text. This response must be raw HTML.`;
        
        const analiza = await googleAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [dateImagine, promptImagine],
        });
        
        return res.json({ text: analiza.text });
    } catch (err) {
        console.error("Eroare la analiza imaginii (Gemini):", err);
        return res.status(500).json({ error: err.message });
    }
});

// OpenAI endpoints
server.post('/api/openai/plan', async (req, res) => {
    const { destinatie, zile, buget, stil } = req.body;
    
    try {
        const promptGhid = `You are an expert travel planner. Create a clean, well-structured travel guide and day-by-day itinerary for ${destinatie}. 
        Duration: ${zile} days. Budget level: ${buget}. Specific interests/style: ${stil || 'general travel'}.
        
        THE RESPONSE FORMAT MUST STRICTLY ADHERE TO THE FOLLOWING STRUCTURE. GENERATE ALL CONTENT ENTIRELY IN ROMANIAN (except for HTML tags):
        
        <h3>${destinatie}</h3>
        <p><strong>Prezentare Generală:</strong> Provide a brief, engaging introduction to the destination</p>
        <p><strong>Detalii Buget & Stil:</strong> Explain how the specified budget and style fit this trip</p>
        <p><strong>Itinerariu pe Zile:</strong> Provide the day-by-day itinerary here using standard paragraphs and bullet points for activities</p>
        
        CRITICAL NOTE: The very first line of your response must consist ONLY of the clean destination name wrapped inside <h3> and </h3> tags. Do not add any other characters before or after this tag (no markdown formatting like **, no triple backticks \`\`\`, and no introductory text), as this specific title is parsed programmatically by the frontend to center the Google Map. Use clean HTML format (<h3>, <p>, <ul>, <li>).`;
        
        const raspuns = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: promptGhid }]
        });
        
        return res.json({ text: raspuns.choices[0].message.content });
    } catch (err) {
        console.error("Eroare la generarea itinerariului (OpenAI):", err);
        return res.status(500).json({ error: err.message });
    }
});

server.post('/api/openai/recunoastere', async (req, res) => {
    const { imagineBase64, contextSuplimentar } = req.body;
    
    if (!imagineBase64) {
        return res.status(400).json({ error: "Imaginea nu a fost furnizată." });
    }

    try {
        const promptImagine = `You are an advanced Computer Vision AI and a world-class expert in global heritage, urban geography, and architectural history. Your absolute priority is to perform a rigorous, pixel-level analysis of ANY image provided to guarantee a 100% accurate identification.

        CONTEXT CLUES PROVIDED BY THE USER OR SYSTEM METADATA:
        ${contextSuplimentar ? `CRITICAL HINT: Use the following geographic/contextual data to restrict your search area and validate your findings: "${contextSuplimentar}"` : "No extra context provided. Rely entirely on visual elements."}

        UNIVERSAL ANALYSIS PROTOCOL (Mandatory for every image):
        1. CRITICAL: Never jump to a conclusion based on the most prominent foreground object. Avoid lazy pattern-matching. If context clues are provided above, use them immediately to narrow down the possible region or country.
        2. Cross-examine the entire scene: analyze background architecture, building styles, construction materials, window alignments, color palettes, topography, street slopes, horizon lines, and any ambient text, numbers, or logos.
        3. Cross-reference all these environmental clues with your vast knowledge base to confidently differentiate between highly similar landmarks or twin structures located within the same city or country. Your final identification must be specific, exact, and undeniable.

        THE RESPONSE FORMAT MUST STRICTLY ADHERE TO THE FOLLOWING STRUCTURE. GENERATE ALL REPLIES ENTIRELY IN ROMANIAN (except for the HTML tags):

        <h3>Insert only the exact officially recognized name of the landmark here</h3>
        <p><strong>Locația Exactă:</strong> Provide the exact city, region, country, and precise street or plaza name where this specific photo view is located</p>
        <p><strong>Scurtă Istorie:</strong> Provide rigorous high-academic historical facts, construction or inauguration year, creators if known, and its cultural or engineering significance</p>
        <p><strong>Sfaturi Utile:</strong> Provide 2-3 highly specific practical recommendations for visitors visiting this exact spot</p>

        CRITICAL FORMATTING NOTE: 
        1. The very first line of your response must consist ONLY of the clean name wrapped inside <h3> and </h3> tags.
        2. The second line MUST contain the exact text query for Google Maps, enclosed strictly within the HTML comment tag as shown: . Do not add markdown or extra spaces inside this comment.
        3. Do not add any markdown formatting (like asterisks ** or bolding inside h3), no backticks (\`\`\`), and no introductory text. This response must be raw HTML.`;
        
        const raspuns = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: promptImagine },
                        { type: "image_url", image_url: { url: imagineBase64 } }
                    ]
                }
            ]
        });
        
        return res.json({ text: raspuns.choices[0].message.content });
    } catch (err) {
        console.error("Eroare la analiza imaginii (OpenAI):", err);
        return res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});