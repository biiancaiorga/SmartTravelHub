import React, { useState, useEffect } from 'react';
import { Loader, Sun, Moon, RotateCcw } from 'lucide-react';
import EXIF from 'exif-js';

function App() {
  const [activa, setActiva] = useState('monumente');
  const [destinatie, setDestinatie] = useState('');
  const [zile, setZile] = useState('');
  const [buget, setBuget] = useState('');
  const [stil, setStil] = useState('');
  const [incarcare, setIncarcarcare] = useState(false);
  const [imaginePreview, setImaginePreview] = useState(null);
  const [imagineBase64, setImagineBase64] = useState('');
  
  const [rezultat, setRezultat] = useState('');
  const [indiciiText, setIndiciiText] = useState('');
  const [termenCautareHarta, setTermenCautareHarta] = useState('');
  const [motorActiv, setMotorActiv] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('st_tema') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('st_tema', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('st_tema', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('st_rezultat', rezultat);
    localStorage.setItem('st_indicii', indiciiText);
    localStorage.setItem('st_harta', termenCautareHarta);
    localStorage.setItem('st_motor', motorActiv);
  }, [rezultat, indiciiText, termenCautareHarta, motorActiv]);

  const convertesteInDecimal = (coordonate, referinta) => {
    if (!coordonate) return null;
    const grade = coordonate[0] ? coordonate[0].numerator / coordonate[0].denominator : 0;
    const minute = coordonate[1] ? coordonate[1].numerator / coordonate[1].denominator : 0;
    const secunde = coordonate[2] ? coordonate[2].numerator / coordonate[2].denominator : 0;
    let rezultatDecimal = grade + (minute / 60) + (secunde / 3600);
    if (referinta === "S" || referinta === "W") rezultatDecimal = rezultatDecimal * -1;
    return rezultatDecimal;
  };

  const proceseazaImagine = (e) => {
    const fisier = e.target.files[0];
    if (fisier) {
      setImaginePreview(URL.createObjectURL(fisier));
      setIndiciiText('');
      
      EXIF.getData(fisier, function() {
        const lat = EXIF.getTag(this, "GPSLatitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef");
        const lon = EXIF.getTag(this, "GPSLongitude");
        const lonRef = EXIF.getTag(this, "GPSLongitudeRef");
        
        if (lat && lon) {
          const latDecimal = convertesteInDecimal(lat, latRef);
          const lonDecimal = convertesteInDecimal(lon, lonRef);
          if (latDecimal && lonDecimal) {
            setIndiciiText(`[SISTEM - Coordonate GPS detectate automat în fișier: Lat ${latDecimal.toFixed(5)}, Lon ${lonDecimal.toFixed(5)}]`);
          }
        }
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagineBase64(reader.result);
      };
      reader.readAsDataURL(fisier);
    }
  };

  const reseteazaAplicatia = () => {
    setRezultat('');
    setIndiciiText('');
    setTermenCautareHarta('');
    setImaginePreview(null);
    setImagineBase64('');
    setDestinatie('');
    setZile('');
    setBuget('');
    setStil('');
    setMotorActiv('');
    localStorage.removeItem('st_rezultat');
    localStorage.removeItem('st_indicii');
    localStorage.removeItem('st_harta');
    localStorage.removeItem('st_motor');
  };

  const resetTab = () => {
    setRezultat('');
    setTermenCautareHarta('');
    setImaginePreview(null);
    setImagineBase64('');
    setMotorActiv('');
    setDestinatie('');
    setZile('');
    setBuget('');
    setStil('');
    setIndiciiText('');
  };

  const cereItinerariu = async (e) => {
    e.preventDefault();
    setIncarcarcare(true);
    setRezultat('');
    setTermenCautareHarta('');
    
    const urlPlan = motorActiv === 'OpenAI GPT-4o' 
      ? 'http://localhost:5000/api/openai/plan' 
      : 'http://localhost:5000/api/plan';

    try {
      const raspuns = await fetch(urlPlan, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinatie, zile, buget, stil })
      });
      const date = await raspuns.json();
      
      if (raspuns.ok && date.text) {
        setRezultat(date.text);
        setTermenCautareHarta(destinatie);
      } else {
        setRezultat('<p class="eroare-text">Serverul pentru generarea itinerariilor este momentan suprasolicitat. Vă rugăm să așteptați un minut înainte de a reîncerca.</p>');
      }
    } catch (err) {
      setRezultat('<p class="eroare-text">Eroare la conectarea cu serverul.</p>');
    } finally {
      setIncarcarcare(false);
    }
  };

  const cereRecunoastere = async () => {
    if (!imagineBase64) return;
    setIncarcarcare(true);
    setRezultat('');
    setTermenCautareHarta('');
    
    const urlRecunoastere = motorActiv === 'OpenAI GPT-4o' 
      ? 'http://localhost:5000/api/openai/recunoastere' 
      : 'http://localhost:5000/api/recunoastere';

    try {
      const raspuns = await fetch(urlRecunoastere, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagineBase64, contextSuplimentar: indiciiText }) 
      });
      const date = await raspuns.json();
      
      if (raspuns.ok && date.text) {
        setRezultat(date.text);
        
        const potrivire = date.text.match(/<h3>(.*?)<\/h3>/);
        if (potrivire && potrivire[1]) {
          setTermenCautareHarta(potrivire[1]);
        }
      } else {
        setRezultat('<p class="eroare-text">Serverul este momentan ocupat din cauza limitărilor API. Încearcă din nou peste un minut.</p>');
      }
    } catch (err) {
      setRezultat('<p class="eroare-text">Eroare la analizarea imaginii.</p>');
    } finally {
      setIncarcarcare(false);
    }
  };

  const adaugaStilRapid = (textPastila) => {
    if (stil === '') {
      setStil(textPastila);
    } else if (!stil.includes(textPastila)) {
      setStil(stil + ", " + textPastila);
    }
  };

  const areHarta = activa === 'monumente' && termenCautareHarta && !rezultat.includes("eroare-text");

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>SmartTravelHub</h1>
        <p>Asistent inteligent pentru analiză vizuală și itinerarii turistice customizate</p>
        
        <div className="header-controls">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="btn-theme-toggle"
            title={isDarkMode ? "Comută la Light Mode" : "Comută la Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} color="#ffb703" /> : <Moon size={20} />}
          </button>

          {rezultat && (
            <button onClick={reseteazaAplicatia} className="btn-reset">
              <RotateCcw size={16} /> Reset
            </button>
          )}
        </div>
      </header>

      <div className="tabs-navigation">
        <button 
          className={`tab-btn ${activa === 'monumente' ? 'active' : ''}`} 
          onClick={() => { setActiva('monumente'); resetTab(); }}
        >
          Analiză Obiectiv
        </button>
        <button 
          className={`tab-btn ${activa === 'itinerariu' ? 'active' : ''}`} 
          onClick={() => { setActiva('itinerariu'); resetTab(); }}
        >
          Planificator Rută
        </button>
      </div>

      <main>
        {activa === 'monumente' ? (
          <div className="main-card">
            <h2 className="card-title">Recunoaștere Monument</h2>
            <p className="card-subtitle">Sistemul va procesa detaliile structurale ale imaginii pentru identificarea monumentului.</p>
            
            <div className="upload-zone">
              <input className="upload-input" type="file" accept="image/*" onChange={proceseazaImagine} />
              {imaginePreview && (
                <div className="preview-container">
                  <img src={imaginePreview} alt="Preview" className="preview-img" />
                </div>
              )}
            </div>

            <div className="input-group input-group--top">
              <label className="form-label">
                Indicii geografice sau detalii suplimentare (Opțional):
              </label>
              <textarea 
                className="form-input form-textarea"
                placeholder="Exemplu: Fotografia este realizată în Transilvania / Stil arhitectural gotic / Lângă un râu din Budapesta..."
                value={indiciiText}
                onChange={(e) => setIndiciiText(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="form-label">Model AI selectat pentru procesare:</label>
              <div className="engine-selector">
                <button type="button" className={`tab-btn engine-btn engine-gemini-btn ${motorActiv === 'Google Gemini 2.5' ? 'active' : ''}`} onClick={() => setMotorActiv('Google Gemini 2.5')}>Google Gemini 2.5</button>
                <button type="button" className={`tab-btn engine-btn engine-openai-btn ${motorActiv === 'OpenAI GPT-4o' ? 'active' : ''}`} onClick={() => setMotorActiv('OpenAI GPT-4o')}>OpenAI GPT-4o</button>
              </div>
            </div>

            <button onClick={cereRecunoastere} disabled={!imagineBase64 || incarcare || !motorActiv} className="btn-primary btn-primary--top">
              {!motorActiv ? "Selectează un model AI de mai sus" : "Pornește Analiza Vizuală"}
            </button>
          </div>
        ) : (
          <div className="main-card">
            <h2 className="card-title">Configurare Itinerariu</h2>
            <form onSubmit={cereItinerariu}>
              <div className="input-group">
                <input type="text" placeholder="Destinația" value={destinatie} onChange={e => setDestinatie(e.target.value)} required className="form-input" />
              </div>
              <div className="input-group">
                <input type="number" placeholder="Număr de zile" value={zile} onChange={e => setZile(e.target.value)} required className="form-input" />
              </div>
              <div className="input-group">
                <input type="text" placeholder="Buget disponibil (ex. 500 €, 2000 lei, buget redus, fără limită)" value={buget} onChange={e => setBuget(e.target.value)} required className="form-input" />
              </div>
              <div className="input-group">
                <input type="text" placeholder="Preferințe specifice" value={stil} onChange={e => setStil(e.target.value)} className="form-input" />
                <div className="pastile-wrapper">
                  <button type="button" onClick={() => adaugaStilRapid("Ritm relaxat")} className="pastila-tag">Ritm relaxat</button>
                  <button type="button" onClick={() => adaugaStilRapid("Istorie & Cultură")} className="pastila-tag">Istorie & Cultură</button>
                  <button type="button" onClick={() => adaugaStilRapid("Familie")} className="pastila-tag">Familie</button>
                  <button type="button" onClick={() => adaugaStilRapid("Locuri ascunse")} className="pastila-tag">Locuri ascunse</button>
                </div>
              </div>

              <div className="input-group input-group--top">
                <label className="form-label">Model AI selectat pentru generare:</label>
                <div className="engine-selector">
                  <button type="button" className={`tab-btn engine-btn engine-gemini-btn ${motorActiv === 'Google Gemini 2.5' ? 'active' : ''}`} onClick={() => setMotorActiv('Google Gemini 2.5')}>Google Gemini 2.5</button>
                  <button type="button" className={`tab-btn engine-btn engine-openai-btn ${motorActiv === 'OpenAI GPT-4o' ? 'active' : ''}`} onClick={() => setMotorActiv('OpenAI GPT-4o')}>OpenAI GPT-4o</button>
                </div>
              </div>

              <button type="submit" disabled={incarcare || !motorActiv} className="btn-primary btn-primary--small-top">
                {!motorActiv ? "Selectează un model AI de mai sus" : "Generează Structura Ghidului"}
              </button>
            </form>
          </div>
        )}

        {incarcare && (
          <div className="loading-container">
            <Loader className="spin" size={32} color="var(--accent)" />
            <p className="loading-text">Sistemul procesează cererea utilizând modelul selectat...</p>
          </div>
        )}

        {rezultat && !incarcare && (
          <div className={`dashboard-layout${areHarta ? ' dashboard-layout--split' : ''}`}>
            <div className="text-panel rezultat-animat">
              <div dangerouslySetInnerHTML={{ __html: rezultat }} />
            </div>
            
            {areHarta && (
              <div className="map-panel">
                <iframe
                  title="Google Maps Location"
                  width="100%"
                  height="100%"
                  className="map-iframe"
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(termenCautareHarta)}&t=&z=16&ie=UTF8&iwloc=B&output=embed`}
                ></iframe>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;