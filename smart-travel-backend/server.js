import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Inițializăm SDK-ul Google AI folosind cheia din fișierul .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Endpoint pentru Planificarea Călătoriei (Text-to-Text)
app.post('/api/plan', async (req, res) => {
    const { destinatie, zile, buget, stil } = req.body;
    try {
        const prompt = `Creează un itinerariu detaliat pentru o vacanță în ${destinatie}. Durata: ${zile} zile. Buget: ${buget}. Interese: ${stil}. Returnează răspunsul direct în format HTML curat (folosește doar tag-uri precum <h3>, <p>, <ul>, <li>), fără blocuri de cod sau cuvinte de tipul markdown.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        res.json({ text: response.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la generarea itinerariului.' });
    }
});

// 2. Endpoint pentru Recunoaștere Obiective (Multimodal - Imagine + Text)
app.post('/api/recunoastere', async (req, res) => {
    const { imagineBase64 } = req.body;
    try {
        const part = {
            inlineData: {
                data: imagineBase64.split(',')[1], // Scoatem headerul imaginii Base64
                mimeType: "image/jpeg"
            }
        };
        
        const prompt = "Ești un ghid turistic expert. Identifică obiectivul din această imagine. Returnează numele lui, locația exactă, o scurtă istorie și un sfat util în format HTML curat (folosește h3, p, ul, li).";
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [part, prompt],
        });
        
        res.json({ text: response.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la analizarea imaginii.' });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Serverul rulează pe portul ${PORT}`));