import React, { useState, useEffect } from 'react';

const LoginForm = ({ onLogin }) => {
  const [substations, setSubstations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/substations')
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        setSubstations(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading stations:", err);
        setLoading(false);
        setError("Could not connect to the server.");
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: selectedStation, 
          password: password 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLogin(data); 
      } else {
        setError(data.message || 'Invalid Station or Password');
      }
    } catch (err) {
      setError('Connection failed. Please ensure the backend is running.');
    }
  };

  return (
    <div style={styles.loginCard}>
      {/* --- LOGO SECTION RESTORED --- */}
      <div style={styles.logoWrapper}>
        <img 
          src="/logo.jpg" 
          alt="BPSO Logo" 
          style={styles.logo} 
        />
      </div>

      <div style={styles.header}>
        <h2 style={styles.title}>BPSO Stakeholder Login</h2>
        <p style={styles.subtitle}>Select your station to access the portal</p>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#718096' }}>Loading stations...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Select Station (Username)</label>
            <select 
              style={styles.input}
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              required
            >
              <option value="">-- Choose Station --</option>
              {substations.map(station => (
                <option key={station.id} value={station.name}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <button type="submit" style={styles.loginBtn}>
            Sign In to Portal
          </button>
        </form>
      )}
      
      <div style={styles.footer}>
        Authorized Personnel Only • © 2026 BPSO
      </div>
    </div>
  );
};

const styles = {
  loginCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
    border: '1px solid #e2e8f0',
    width: '100%',
    maxWidth: '400px',
  },
  logoWrapper: { textAlign: 'center', marginBottom: '20px' },
  logo: { maxWidth: '120px', maxHeight: '120px', objectFit: 'contain' },
  header: { textAlign: 'center', marginBottom: '25px' },
  title: { color: '#1a365d', margin: '0 0 5px 0', fontSize: '22px', fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: '14px', margin: 0 },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568', fontSize: '14px' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '16px', boxSizing: 'border-box' },
  loginBtn: { width: '100%', padding: '14px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' },
  errorBox: { color: '#e53e3e', backgroundColor: '#fff5f5', padding: '12px', borderRadius: '6px', marginBottom: '15px', textAlign: 'center', fontSize: '14px', border: '1px solid #feb2b2' },
  footer: { marginTop: '25px', textAlign: 'center', fontSize: '11px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px' }
};

export default LoginForm;