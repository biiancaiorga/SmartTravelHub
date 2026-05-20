import React, { useState } from 'react';
import { Camera, MapPin, Compass, Loader } from 'lucide-react';

function App() {
  const [tab, setTab] = useState('recunoastere');
  const [incarcare, setIncarcare] = useState(false);
  const [rezultat, setRezultat] = useState('');
  const [form, setForm] = useState({ destinatie: '', zile: '3', buget: 'Mediu', stil: '' });

  const handleImagine = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      setIncarcare(true);
      setRezultat('');
      try {
        const res = await fetch('http://localhost:5000/api/recunoastere', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagineBase64: reader.result })
        });
        const date = await res.json();
        setRezultat(date.text);
      } catch (err) {
        setRezultat('<p style="color:red">Eroare la conectarea cu serverul.</p>');
      }
      setIncarcare(false);
    };
    if (file) reader.readAsDataURL(file);
  };

  const handlePlanifica = async (e) => {
    e.preventDefault();
    setIncarcare(true);
    setRezultat('');
    try {
      const res = await fetch('http://localhost:5000/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const date = await res.json();
      setRezultat(date.text);
    } catch (err) {
      setRezultat('<p style="color:red">Eroare la generarea itinerariului.</p>');
    }
    setIncarcare(false);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.titlu}><Compass size={36} color="#007bff" /> SmartTravelHub</h1>
        <p style={styles.subtitlu}>Platformă web integrată pentru planificarea călătoriilor și recunoașterea obiectivelor utilizând AI</p>
      </header>

      <div style={styles.tabContainer}>
        <button 
          style={{...styles.tabButon, borderBottom: tab === 'recunoastere' ? '3px solid #007bff' : 'none'}}
          onClick={() => { setTab('recunoastere'); setRezultat(''); }}
        >
          <Camera size={18} /> Recunoaștere Obiective
        </button>
        <button 
          style={{...styles.tabButon, borderBottom: tab === 'planificator' ? '3px solid #007bff' : 'none'}}
          onClick={() => { setTab('planificator'); setRezultat(''); }}
        >
          <MapPin size={18} /> Planificator Călătorie
        </button>
      </div>

      <main style={styles.main}>
        {tab === 'recunoastere' ? (
          <div style={styles.card}>
            <h2>Identifică un monument istoric sau un obiectiv</h2>
            <p style={{color: '#666'}}>Încarcă o fotografie clară din vacanță, iar modelul multimodal o va analiza instant.</p>
            <input type="file" accept="image/*" onChange={handleImagine} style={styles.inputFile} />
          </div>
        ) : (
          <div style={styles.card}>
            <h2>Generează traseul tău personalizat</h2>
            <form onSubmit={handlePlanifica} style={styles.form}>
              <input 
                type="text" placeholder="Unde vrei să mergi? (ex: Paris)" required
                onChange={(e) => setForm({...form, destinatie: e.target.value})} style={styles.input}
              />
              <input 
                type="number" placeholder="Câte zile? (ex: 4)" min="1" required
                onChange={(e) => setForm({...form, zile: e.target.value})} style={styles.input}
              />
              <select onChange={(e) => setForm({...form, buget: e.target.value})} style={styles.input}>
                <option value="Economic">Economic (Backpacker)</option>
                <option value="Mediu">Mediu (Standard)</option>
                <option value="Premium">Premium (Lux)</option>
              </select>
              <input 
                type="text" placeholder="Ce vrei să vizitezi? (ex: muzee, artă, parcuri)" 
                onChange={(e) => setForm({...form, stil: e.target.value})} style={styles.input}
              />
              <button type="submit" style={styles.butonGenerare}>Generează Ghid Virtual</button>
            </form>
          </div>
        )}

        {incarcare && (
          <div style={styles.loading}>
            <Loader className="spin" size={32} color="#007bff" />
            <p>Inteligența Artificială procesează datele...</p>
          </div>
        )}

        {rezultat && (
          <div style={styles.rezultatCard}>
            <h3 style={{marginTop: 0, color: '#007bff'}}> Răspunsul Inteligent:</h3>
            <div dangerouslySetInnerHTML={{ __html: rezultat }} />
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh', padding: '20px' },
  header: { textAlign: 'center', marginBottom: '40px' },
  titlu: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '2.5rem', color: '#333' },
  subtitlu: { color: '#666', fontSize: '1.1rem' },
  tabContainer: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' },
  tabButon: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
  main: { maxWidth: '800px', margin: '0 auto' },
  card: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' },
  inputFile: { marginTop: '20px', padding: '10px', border: '1px dashed #ccc', borderRadius: '6px', width: '80%' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' },
  input: { padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' },
  butonGenerare: { padding: '12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' },
  loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px', gap: '10px' },
  rezultatCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '30px', textAlign: 'left', lineHeight: '1.6' }
};

export default App;