import React, { useState, useEffect } from 'react';

const AdminTrippingForm = () => {
  const [stations, setStations] = useState([]);
  const [elements, setElements] = useState([]);
  const [creators, setCreators] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastEntry, setLastEntry] = useState(null); // Track the last successful log

  const initialFormState = {
    title: '', 
    createdBy: '', 
    elementName: '',
    elementType: 'Transmission Line',
    trippingDateTime: '',
    restorationDateTime: '',
    fromSubstationId: '',
    toSubstationId: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetch('http://localhost:3001/api/substations')
      .then(res => res.json())
      .then(data => setStations(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(err => console.error("Error:", err));

    fetch('http://localhost:3001/api/elements')
      .then(res => res.json())
      .then(data => setElements(data))
      .catch(err => console.error("Error:", err));

    fetch('http://localhost:3001/api/creators')
      .then(res => res.json())
      .then(data => setCreators(data))
      .catch(err => console.error("Error:", err));
  }, []);

  const handleReset = () => {
    if (window.confirm("Clear all current fields?")) {
      setFormData(initialFormState);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.fromSubstationId === formData.toSubstationId) {
      alert("⚠️ Station A and B cannot be identical.");
      return;
    }
    if (formData.restorationDateTime && new Date(formData.restorationDateTime) <= new Date(formData.trippingDateTime)) {
      alert("⚠️ Restoration must be after Tripping.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData, elementName: formData.title };
      const response = await fetch('http://localhost:3001/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setLastEntry({ ...formData }); // Capture data for preview
        setShowSuccess(true);
        setFormData(initialFormState);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert("❌ Server rejected the log.");
      }
    } catch (err) {
      alert("❌ Connection Error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        
        <div style={styles.formCard}>
          {showSuccess && (
            <div style={styles.successOverlay}>
              <div style={styles.successBox}>
                <div style={styles.successIcon}>✔</div>
                <h3 style={{ margin: '10px 0 5px 0' }}>Incident Logged</h3>
              </div>
            </div>
          )}

          <div style={styles.header}>
            <div style={styles.badge}>System Operator Log</div>
            <h2 style={styles.title}>Tripping Incident Entry</h2>
            <p style={styles.subtitle}>BPSO Grid Stability Management</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Section 1: Element */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Network Element</label>
              <select style={styles.select} value={formData.title} required
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}>
                <option value="">Choose element...</option>
                <optgroup label="⚡ 400kV / 220kV">{elements.filter(el => el.name.startsWith("400") || el.name.startsWith("220")).map(el => <option key={el.id} value={el.name}>{el.name}</option>)}</optgroup>
                <optgroup label="⚡ 132kV / 66kV">{elements.filter(el => el.name.startsWith("132") || el.name.startsWith("66")).map(el => <option key={el.id} value={el.name}>{el.name}</option>)}</optgroup>
                <optgroup label="⚙️ Other">{elements.filter(el => !/^\d/.test(el.name)).map(el => <option key={el.id} value={el.name}>{el.name}</option>)}</optgroup>
              </select>
            </div>

            {/* Section 2: Time */}
            <div style={styles.gridRow}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Tripping Time</label>
                <input type="datetime-local" step="1" style={styles.input} required
                  value={formData.trippingDateTime} onChange={(e) => setFormData({ ...formData, trippingDateTime: e.target.value })} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Restoration Time</label>
                <input type="datetime-local" step="1" style={styles.input}
                  value={formData.restorationDateTime} onChange={(e) => setFormData({ ...formData, restorationDateTime: e.target.value })} />
              </div>
            </div>

            {/* Section 3: Stations */}
            <div style={styles.gridRow}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Station A</label>
                <select style={styles.select} value={formData.fromSubstationId} required
                  onChange={(e) => setFormData({ ...formData, fromSubstationId: e.target.value })}>
                  <option value="">Select...</option>
                  {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Station B</label>
                <select style={styles.select} value={formData.toSubstationId} required
                  onChange={(e) => setFormData({ ...formData, toSubstationId: e.target.value })}>
                  <option value="">Select...</option>
                  {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Reporting Officer</label>
              <select style={styles.select} value={formData.createdBy} required
                onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}>
                <option value="">Select Staff...</option>
                {creators.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div style={styles.buttonGroup}>
              <button type="button" onClick={handleReset} style={styles.secondaryBtn}>Clear</button>
              <button type="submit" disabled={isSubmitting} style={{...styles.primaryBtn, backgroundColor: isSubmitting ? '#94a3b8' : '#4f46e5'}}>
                {isSubmitting ? 'Syncing...' : 'Record Incident'}
              </button>
            </div>
          </form>
        </div>

        {/* --- LAST ENTRY PREVIEW (NEW) --- */}
        {lastEntry && (
          <div style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <span style={{ fontWeight: '800', fontSize: '12px', color: '#10b981' }}>● LAST LOGGED</span>
              <button onClick={() => setLastEntry(null)} style={styles.closePreview}>×</button>
            </div>
            <div style={styles.previewGrid}>
              <div style={styles.previewItem}><strong>Element:</strong> {lastEntry.title}</div>
              <div style={styles.previewItem}><strong>Staff:</strong> {lastEntry.createdBy}</div>
              <div style={styles.previewItem}><strong>Tripping:</strong> {lastEntry.trippingDateTime.replace('T', ' ')}</div>
              <div style={styles.previewItem}><strong>Restoration:</strong> {lastEntry.restorationDateTime?.replace('T', ' ') || 'Active'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '20px' },
  container: { maxWidth: '700px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
  formCard: { position: 'relative', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', overflow: 'hidden' },
  header: { padding: '30px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' },
  badge: { display: 'inline-block', padding: '4px 12px', backgroundColor: '#eef2ff', color: '#4338ca', fontSize: '11px', fontWeight: '700', borderRadius: '100px', textTransform: 'uppercase', marginBottom: '8px' },
  title: { fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  form: { padding: '30px' },
  gridRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  fieldGroup: { marginBottom: '18px' },
  label: { display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '12px', textTransform: 'uppercase' },
  select: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '14px' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '14px', boxSizing: 'border-box' },
  buttonGroup: { display: 'flex', gap: '12px', marginTop: '10px' },
  primaryBtn: { flex: 3, padding: '16px', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' },
  secondaryBtn: { flex: 1, padding: '16px', color: '#64748b', border: '1px solid #e2e8f0', backgroundColor: 'white', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' },
  successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(2px)' },
  successBox: { textAlign: 'center', color: '#166534' },
  successIcon: { fontSize: '30px', backgroundColor: '#dcfce7', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
  previewCard: { backgroundColor: '#f8fafc', padding: '15px 20px', borderRadius: '15px', border: '1px solid #e2e8f0', borderLeft: '5px solid #10b981' },
  previewHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  previewGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: '#475569' },
  closePreview: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }
};

export default AdminTrippingForm;