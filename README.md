# SmartTravelHub

SmartTravelHub este o aplicație web full-stack construită ca asistent de călătorie bazat pe inteligență artificială. Proiectul integrează două modele AI de ultimă generație: Google Gemini 2.5 Flash și OpenAI GPT-4o; și oferă utilizatorului posibilitatea de a alege cu care dintre ele dorește să lucreze.

Aplicația are două funcționalități de bază: recunoașterea automată a obiectivelor turistice dintr-o fotografie și generarea de itinerarii de călătorie personalizate. Răspunsurile sunt generate integral în limba română.

---

## Ce face aplicația

### Recunoaștere monument din imagine

Utilizatorul încarcă o fotografie cu un obiectiv turistic, iar modelul AI analizează elementele vizuale de arhitectură, materiale de construcție, topografie, text ambient, și returnează informații despre locul respectiv: denumirea oficială, locația exactă, scurt istoric și câteva sfaturi practice pentru vizitatori.

Un detaliu important: dacă fotografia conține date EXIF cu coordonate GPS (cum se întâmplă de obicei cu pozele făcute de pe telefon), aplicația le extrage automat și le trimite ca indiciu suplimentar către model. Asta îmbunătățește semnificativ acuratețea identificării în cazuri ambigue.

După identificare, pe lângă textul generat, apare și un embed Google Maps centrat automat pe locul identificat.

### Planificator de rută

Utilizatorul completează destinația, numărul de zile, bugetul și preferințele de călătorie, iar AI-ul generează un ghid structurat pe zile. Există și câteva tag-uri rapide pentru stiluri comune: *Ritm relaxat*, *Istorie & Cultură*, *Familie*, *Locuri ascunse*; care se adaugă automat în câmpul de preferințe la click.

---

## Stivă tehnologică

**Backend** — Node.js cu Express 5, fără bază de date. Serverul funcționează ca un proxy între frontend și API-urile AI externe. Dependențele principale sunt `@google/genai` pentru Gemini și `openai` pentru GPT-4o.

**Frontend** — React 19 (Create React App), fără librării de rutare sau state management extern, toată starea este gestionată local cu hooks. Pentru iconițe se folosește `lucide-react`, iar pentru extragerea datelor EXIF din imagini, `exif-js`.

Interfața are mod întunecat și mod luminos, cu preferința salvată în `localStorage`. Ultimul rezultat generat este și el păstrat în `localStorage`, deci nu se pierde la refresh.

---

## Instalare

### Cerințe

- Node.js v18 sau mai nou
- O cheie API activă pentru [Google Gemini](https://aistudio.google.com/) și una pentru [OpenAI](https://platform.openai.com/)

### Pași

```bash
git clone https://github.com/biiancaiorga/SmartTravelHub.git
cd SmartTravelHub
```

**Backend:**

```bash
cd smart-travel-backend
npm install
```

Creează un fișier `.env` în directorul `smart-travel-backend/` cu următorul conținut:

```
GEMINI_API_KEY=cheia_ta_google_gemini
OPENAI_API_KEY=cheia_ta_openai
```

```bash
node server.js
# serverul pornește pe http://localhost:5000
```

**Frontend** (terminal separat):

```bash
cd smart-travel-frontend
npm install
npm start
# aplicația se deschide la http://localhost:3000
```

---

## Endpoint-uri backend

Toate endpoint-urile acceptă cereri de tip `POST` cu `Content-Type: application/json`.

| Rută | Body | Descriere |
|------|------|-----------|
| `/api/plan` | `{ destinatie, zile, buget, stil }` | Generează itinerariu via Gemini 2.5 Flash |
| `/api/recunoastere` | `{ imagineBase64, contextSuplimentar }` | Identifică monument via Gemini |
| `/api/openai/plan` | `{ destinatie, zile, buget, stil }` | Generează itinerariu via GPT-4o |
| `/api/openai/recunoastere` | `{ imagineBase64, contextSuplimentar }` | Identifică monument via GPT-4o |

---

## Structura proiectului

```
SmartTravelHub/
├── README.md
├── smart-travel-backend/
│   ├── .gitignore
│   ├── server.js        # logica serverului și prompturile AI
│   ├── package.json
│   └── .env             # chei API — nu se include în repository
│
└── smart-travel-frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js       # componenta principală cu toată logica UI
    │   ├── index.css    # stiluri globale și teme light/dark
    │   └── index.js
    └── package.json
```

---

## Variabile de mediu

Fișierul `.env` nu este inclus în repository și nu trebuie commit-uit niciodată. După clonare, creează-l manual în `smart-travel-backend/` cu următoarele chei:

| Variabilă | Descriere |
|-----------|-----------|
| `GEMINI_API_KEY` | Cheie API din [Google AI Studio](https://aistudio.google.com/) |
| `OPENAI_API_KEY` | Cheie API din [platforma OpenAI](https://platform.openai.com/) |

---

## Autor

Dezvoltat de [Bianca Iorga](https://github.com/biiancaiorga)
