import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const server = express();
server.use(cors());
server.use(express.json({ limit: '50mb' }));

// Configurare și inițializare API Google Gemini
const apiKey = process.env.GEMINI_API_KEY;
const googleAI = new GoogleGenAI({ apiKey: apiKey });

// SECTION 1: Endpoint pentru generarea itinerariilor de călătorie (Text)
server.post('/api/plan', async (req, res) => {
    const { destinatie, zile, buget, stil } = req.body;
    
    try {
        const promptGhid = `Creează un ghid turistic și un itinerariu detaliat pentru o vacanță în ${destinatie}. Durata: ${zile} zile. Buget: ${buget}. Interese specifice: ${stil || 'generale'}. Returnează răspunsul direct în format HTML curat (folosește doar tag-uri precum <h3>, <p>, <ul>, <li>), fără blocuri de cod sau markdown.`;
        
        const rezultat = await googleAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptGhid,
        });
        
        return res.json({ text: rezultat.text });
    } catch (err) {
        console.error("Eroare la generarea itinerariului:", err);
        return res.status(500).json({ error: err.message });
    }
});

// SECTION 2: Endpoint pentru recunoașterea monumentelor din imagini (Multimodal)
server.post('/api/recunoastere', async (req, res) => {
    const { imagineBase64 } = req.body;
    
    if (!imagineBase64) {
        return res.status(400).json({ error: "Imaginea nu a fost furnizată." });
    }

    try {
        // Conversia imaginii din format Base64 pentru a fi acceptată de API-ul Google
        const dateImagine = {
            inlineData: {
                data: imagineBase64.split(',')[1],
                mimeType: "image/jpeg"
            }
        };
        
        const promptImagine = "Ești un ghid turistic digital expert. Analizează imaginea și identifică monumentul. Returnează: Numele exact, Locația exacta, O scurtă istorie și 2 sfaturi utile în format HTML curat (cu <h3>, <p>, <ul>, <li>). Fii foarte specific cu datele.";
        
        const analiza = await googleAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [dateImagine, promptImagine],
        });
        
        return res.json({ text: analiza.text });
    } catch (err) {
        console.error("Eroare la analiza imaginii:", err);
        return res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Aplicatia de backend ruleaza pe portul ${PORT}`);
});