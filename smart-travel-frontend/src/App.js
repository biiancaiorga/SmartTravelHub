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
        setRezultat('<p style="color:red">Serverul pentru generarea itinerariilor este momentan suprasolicitat. Vă rugăm să așteptați un minut înainte de a reîncerca.</p>');
      }
    } catch (err) {
      setRezultat('<p style="color:red">Eroare la conectarea cu serverul.</p>');
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
        setRezultat('<p style="color:red">Serverul este momentan ocupat din cauza limitărilor API. Încearcă din nou peste un minut.</p>');
      }
    } catch (err) {
      setRezultat('<p style="color:red">Eroare la analizarea imaginii.</p>');
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

  return (
    <div className="app-container">
      <header className="app-header" style={{ position: 'relative' }}>
        <h1>SmartTravelHub</h1>
        <p>Asistent inteligent pentru analiză vizuală și itinerarii turistice customizate</p>
        
        <div style={{ position: 'absolute', top: '25px', right: '25px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
            title={isDarkMode ? "Comută la Light Mode" : "Comută la Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} color="#ffb703" /> : <Moon size={20} />}
          </button>

          {rezultat && (
            <button 
              onClick={reseteazaAplicatia}
              style={{ background: '#ea4335', border: 'none', borderRadius: '20px', padding: '0 14px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 5px rgba(234,67,53,0.2)' }}
            >
              <RotateCcw size={16} /> Reset
            </button>
          )}
        </div>
      </header>

      <div className="tabs-navigation">
        <button 
          className={`tab-btn ${activa === 'monumente' ? 'active' : ''}`} 
          onClick={() => { setActiva('monumente'); }}
        >
          Analiză Obiectiv
        </button>
        <button 
          className={`tab-btn ${activa === 'itinerariu' ? 'active' : ''}`} 
          onClick={() => { setActiva('itinerariu'); }}
        >
          Planificator Rută
        </button>
      </div>

      <main>
        {activa === 'monumente' ? (
          <div className="main-card">
            <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>Recunoaștere Monument</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Sistemul va procesa detaliile structurale ale imaginii pentru identificarea monumentului.</p>
            
            <div className="upload-zone">
              <input type="file" accept="image/*" onChange={proceseazaImagine} style={{ cursor: 'pointer' }} />
              {imaginePreview && (
                <div style={{ marginTop: '20px' }}>
                  <img src={imaginePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                </div>
              )}
            </div>

            <div className="input-group" style={{ marginTop: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>
                Indicii geografice sau detalii suplimentare (Opțional):
              </label>
              <textarea 
                className="form-input"
                style={{ width: '100%', minHeight: '65px', padding: '12px', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem' }}
                placeholder="Exemplu: Fotografia este realizată în Transilvania / Stil arhitectural gotic / Lângă un râu din Budapesta..."
                value={indiciiText}
                onChange={(e) => setIndiciiText(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>Model AI selectat pentru procesare:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className={`tab-btn engine-gemini-btn ${motorActiv === 'Google Gemini 2.5' ? 'active' : ''}`} onClick={() => setMotorActiv('Google Gemini 2.5')} style={{ flex: 1, padding: '10px' }}>Google Gemini 2.5</button>
                <button type="button" className={`tab-btn engine-openai-btn ${motorActiv === 'OpenAI GPT-4o' ? 'active' : ''}`} onClick={() => setMotorActiv('OpenAI GPT-4o')} style={{ flex: 1, padding: '10px' }}>OpenAI GPT-4o</button>
              </div>
            </div>

            <button onClick={cereRecunoastere} disabled={!imagineBase64 || incarcare || !motorActiv} className="btn-primary" style={{ marginTop: '20px' }}>
              {!motorActiv ? "Selectează un model AI de mai sus" : "Pornește Analiza Vizuală"}
            </button>
          </div>
        ) : (
          <div className="main-card">
            <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>Configurare Itinerariu</h2>
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

              <div className="input-group" style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>Model AI selectat pentru generare:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className={`tab-btn engine-gemini-btn ${motorActiv === 'Google Gemini 2.5' ? 'active' : ''}`} onClick={() => setMotorActiv('Google Gemini 2.5')} style={{ flex: 1, padding: '10px' }}>Google Gemini 2.5</button>
                  <button type="button" className={`tab-btn engine-openai-btn ${motorActiv === 'OpenAI GPT-4o' ? 'active' : ''}`} onClick={() => setMotorActiv('OpenAI GPT-4o')} style={{ flex: 1, padding: '10px' }}>OpenAI GPT-4o</button>
                </div>
              </div>

              <button type="submit" disabled={incarcare || !motorActiv} className="btn-primary" style={{ marginTop: '12px' }}>
                {!motorActiv ? "Selectează un model AI de mai sus" : "Generează Structura Ghidului"}
              </button>
            </form>
          </div>
        )}

        {incarcare && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px' }}>
            <Loader className="spin" size={32} color="var(--accent)" />
            <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Sistemul procesează cererea utilizând modelul selectat...</p>
          </div>
        )}

        {rezultat && !incarcare && (
          <div className="dashboard-layout" style={{ gridTemplateColumns: activa === 'monumente' && termenCautareHarta && !rezultat.includes("color:red") ? '1fr 1fr' : '1fr' }}>
            <div className="text-panel">
              <div dangerouslySetInnerHTML={{ __html: rezultat }} />
            </div>
            
            {activa === 'monumente' && termenCautareHarta && !rezultat.includes("color:red") && (
              <div className="map-panel" style={{ height: '380px', position: 'sticky', top: '20px' }}>
                <iframe
                  title="Google Maps Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
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