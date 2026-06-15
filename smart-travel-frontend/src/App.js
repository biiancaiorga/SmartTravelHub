import React, { useState, useEffect } from 'react';
import { Loader, Sun, Moon, RotateCcw, Download, GitCompare } from 'lucide-react';
import EXIF from 'exif-js';
import html2pdf from 'html2pdf.js';

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

  // Stare mod comparatie
  const [modComparatie, setModComparatie] = useState(false);
  const [rezultatGemini, setRezultatGemini] = useState('');
  const [rezultatOpenAI, setRezultatOpenAI] = useState('');
  const [incarcareComparatie, setIncarcareComparatie] = useState(false);

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
    setModComparatie(false);
    setRezultatGemini('');
    setRezultatOpenAI('');
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
    setModComparatie(false);
    setRezultatGemini('');
    setRezultatOpenAI('');
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

  const cereComparatieItinerariu = async (e) => {
    e.preventDefault();
    setIncarcareComparatie(true);
    setRezultatGemini('');
    setRezultatOpenAI('');
    setRezultat('');

    try {
      const [raspunsGemini, raspunsOpenAI] = await Promise.all([
        fetch('http://localhost:5000/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destinatie, zile, buget, stil })
        }),
        fetch('http://localhost:5000/api/openai/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destinatie, zile, buget, stil })
        })
      ]);

      const dateGemini = await raspunsGemini.json();
      const dateOpenAI = await raspunsOpenAI.json();

      setRezultatGemini(dateGemini.text || '<p class="eroare-text">Eroare Gemini.</p>');
      setRezultatOpenAI(dateOpenAI.text || '<p class="eroare-text">Eroare OpenAI.</p>');
    } catch (err) {
      setRezultatGemini('<p class="eroare-text">Eroare la conectarea cu serverul.</p>');
      setRezultatOpenAI('<p class="eroare-text">Eroare la conectarea cu serverul.</p>');
    } finally {
      setIncarcareComparatie(false);
    }
  };

  const cereComparatieRecunoastere = async () => {
    if (!imagineBase64) return;
    setIncarcareComparatie(true);
    setRezultatGemini('');
    setRezultatOpenAI('');
    setRezultat('');

    try {
      const [raspunsGemini, raspunsOpenAI] = await Promise.all([
        fetch('http://localhost:5000/api/recunoastere', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagineBase64, contextSuplimentar: indiciiText })
        }),
        fetch('http://localhost:5000/api/openai/recunoastere', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagineBase64, contextSuplimentar: indiciiText })
        })
      ]);

      const dateGemini = await raspunsGemini.json();
      const dateOpenAI = await raspunsOpenAI.json();

      setRezultatGemini(dateGemini.text || '<p class="eroare-text">Eroare Gemini.</p>');
      setRezultatOpenAI(dateOpenAI.text || '<p class="eroare-text">Eroare OpenAI.</p>');
    } catch (err) {
      setRezultatGemini('<p class="eroare-text">Eroare la conectarea cu serverul.</p>');
      setRezultatOpenAI('<p class="eroare-text">Eroare la conectarea cu serverul.</p>');
    } finally {
      setIncarcareComparatie(false);
    }
  };

  const adaugaStilRapid = (textPastila) => {
    if (stil === '') {
      setStil(textPastila);
    } else if (!stil.includes(textPastila)) {
      setStil(stil + ", " + textPastila);
    }
  };

  const exportPDF = () => {
    const element = document.getElementById('rezultat-continut');
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'background:#ffffff; color:#0f172a; padding:20px; font-family:Arial,sans-serif; font-size:14px; line-height:1.7;';
    wrapper.innerHTML = element.innerHTML;
    document.body.appendChild(wrapper);

    const opt = {
      margin: [15, 20, 15, 20],
      filename: `itinerariu-${destinatie || 'smarttravelhub'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(wrapper).save().then(() => {
      document.body.removeChild(wrapper);
    });
  };

  const areHarta = activa === 'monumente' && termenCautareHarta && !rezultat.includes("eroare-text");
  const areRezultatComparatie = rezultatGemini || rezultatOpenAI;

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

          {(rezultat || areRezultatComparatie) && (
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

            <button onClick={cereRecunoastere} disabled={!imagineBase64 || incarcare || incarcareComparatie || !motorActiv} className="btn-primary btn-primary--top">
              {!motorActiv ? "Selectează un model AI de mai sus" : "Pornește Analiza Vizuală"}
            </button>

            <div className="comparatie-separator">
              <span>sau</span>
            </div>

            <button
              onClick={() => { setModComparatie(true); cereComparatieRecunoastere(); }}
              disabled={!imagineBase64 || incarcare || incarcareComparatie}
              className="btn-comparatie"
            >
              <GitCompare size={16} /> Compară Gemini vs GPT-4o
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

              <button type="submit" disabled={incarcare || incarcareComparatie || !motorActiv} className="btn-primary btn-primary--small-top">
                {!motorActiv ? "Selectează un model AI de mai sus" : "Generează Structura Ghidului"}
              </button>
            </form>

            <div className="comparatie-separator">
              <span>sau</span>
            </div>

            <button
              onClick={(e) => { setModComparatie(true); cereComparatieItinerariu(e); }}
              disabled={!destinatie || !zile || !buget || incarcare || incarcareComparatie}
              className="btn-comparatie"
            >
              <GitCompare size={16} /> Compară Gemini vs GPT-4o
            </button>
          </div>
        )}

        {(incarcare || incarcareComparatie) && (
          <div className="loading-container">
            <Loader className="spin" size={32} color="var(--accent)" />
            <p className="loading-text">
              {incarcareComparatie
                ? "Se procesează simultan ambele modele AI, vă rugăm așteptați..."
                : "Sistemul procesează cererea utilizând modelul selectat..."}
            </p>
          </div>
        )}

        {rezultat && !incarcare && !modComparatie && (
          <div className={`dashboard-layout${areHarta ? ' dashboard-layout--split' : ''}`}>
            <div className="text-panel rezultat-animat">
              {activa === 'itinerariu' && (
                <button onClick={exportPDF} className="btn-export-pdf">
                  <Download size={16} /> Descarcă PDF
                </button>
              )}
              <div id="rezultat-continut" dangerouslySetInnerHTML={{ __html: rezultat }} />
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

        {areRezultatComparatie && !incarcareComparatie && modComparatie && (
          <div className="comparatie-layout rezultat-animat">
            <div className="comparatie-panel comparatie-panel--gemini">
              <div className="comparatie-header comparatie-header--gemini">
                <span className="comparatie-badge">Google Gemini 2.5 Flash</span>
              </div>
              <div className="comparatie-continut" dangerouslySetInnerHTML={{ __html: rezultatGemini }} />
            </div>
            <div className="comparatie-panel comparatie-panel--openai">
              <div className="comparatie-header comparatie-header--openai">
                <span className="comparatie-badge">OpenAI GPT-4o</span>
              </div>
              <div className="comparatie-continut" dangerouslySetInnerHTML={{ __html: rezultatOpenAI }} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;