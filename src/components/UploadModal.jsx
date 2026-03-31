import React, { useState, useEffect } from 'react';

/**
 * UploadModal Component
 * Handles the uploading of FIR, DR, and EL reports with validation and audit support.
 * @param {Object} trip - The incident data object.
 * @param {string} userSide - Either 'A' (From) or 'B' (To).
 * @param {Object} currentUser - The logged-in user session object.
 */
const UploadModal = ({ trip, userSide, onClose, onRefresh, currentUser }) => {
  const [file, setFile] = useState(null);
  const [reportType, setReportType] = useState('FIR'); 
  const [uploading, setUploading] = useState(false);

  // Configuration for different report types
  const getFileConfig = () => {
    switch (reportType) {
      case 'FIR':
        return { 
          label: 'First Information Report', 
          accept: '.xlsx, .xls', 
          icon: '📊', 
          format: 'Excel (.xlsx, .xls)' 
        };
      case 'DR':
        return { 
          label: 'Disturbance Record', 
          accept: '.zip, .rar, .xar', 
          icon: '🗜️', 
          format: 'Archive (.zip, .rar, .xar)' 
        };
      case 'EL':
        return { 
          label: 'Event Logger / ER', 
          accept: '.pdf', 
          icon: '📄', 
          format: 'PDF Document (.pdf)' 
        };
      default:
        return { label: 'File', accept: '*', icon: '📁', format: 'Any' };
    }
  };

  const config = getFileConfig();

  // Reset file selection when user switches report types to prevent mismatch
  useEffect(() => {
    setFile(null);
  }, [reportType]);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first");
    
    setUploading(true);
    const formData = new FormData();
    formData.append('reportFile', file);
    formData.append('tripId', trip.id);
    formData.append('reportType', reportType);
    formData.append('stationSide', userSide);
    
    // Pass the current user's name for the backend Audit Log
    formData.append('username', currentUser?.username || "Unknown User");

    try {
      const res = await fetch('http://localhost:3001/api/upload-report', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(`✅ ${reportType} uploaded successfully!`);
        onRefresh(); 
        onClose();
      } else {
        // Displays backend validation errors (e.g., "DR must be Archive")
        alert(`❌ Upload failed: ${data.error || 'Check server constraints'}`);
      }
    } catch (err) {
      console.error("Network Error:", err);
      alert("Could not connect to server. Ensure backend is running.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Technical Document Upload</h3>
          <p style={styles.modalSubtitle}>Incident: <strong>{trip.title}</strong></p>
        </div>

        <div style={styles.modalBody}>
          {/* Station Side Badge */}
          <div style={styles.sideBadge}>
            📍 Reporting for: {userSide === 'A' ? 'Station A (Origin)' : 'Station B (Destination)'}
          </div>

          {/* Report Category Selection */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>1. Select Report Category</label>
            <select 
              style={styles.select} 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="FIR">📊 FIR (Excel Format)</option>
              <option value="DR">🗜️ DR (ZIP / RAR / XAR)</option>
              <option value="EL">📄 EL / ER (PDF Format)</option>
            </select>
          </div>

          {/* Interactive Upload Zone */}
          <div style={styles.uploadZone}>
            <label style={styles.label}>2. Attach {config.label}</label>
            <div style={styles.fileInputWrapper}>
              <span style={styles.fileIcon}>{config.icon}</span>
              <input 
                type="file" 
                key={reportType} // Reset input when reportType changes
                onChange={(e) => setFile(e.target.files[0])} 
                accept={config.accept}
                style={styles.fileInput}
              />
            </div>
            {file && (
              <div style={styles.selectedFileName}>
                📎 Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
            <p style={styles.hint}>Required: <strong>{config.format}</strong></p>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button 
            onClick={handleUpload} 
            disabled={uploading || !file} 
            style={{
              ...styles.uploadBtn,
              backgroundColor: uploading || !file ? '#cbd5e1' : '#4f46e5',
              cursor: uploading || !file ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? 'Processing...' : 'Confirm & Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { 
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(15, 23, 42, 0.75)', 
    display: 'flex', justifyContent: 'center', alignItems: 'center', 
    zIndex: 10000, backdropFilter: 'blur(3px)' 
  },
  modalCard: { 
    backgroundColor: 'white', borderRadius: '16px', width: '440px', 
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden' 
  },
  modalHeader: { padding: '24px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' },
  modalTitle: { margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' },
  modalSubtitle: { margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' },
  modalBody: { padding: '24px' },
  sideBadge: { 
    backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px', 
    fontSize: '12px', fontWeight: '700', color: '#4338ca', marginBottom: '20px', textAlign: 'center' 
  },
  fieldGroup: { marginBottom: '20px' },
  label: { 
    display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '11px', 
    color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' 
  },
  select: { 
    width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', 
    backgroundColor: '#fff', fontSize: '14px', outline: 'none', cursor: 'pointer', color: '#1e293b' 
  },
  uploadZone: { 
    padding: '20px', border: '2px dashed #e2e8f0', borderRadius: '12px', 
    backgroundColor: '#f8fafc', textAlign: 'center' 
  },
  fileInputWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' },
  fileIcon: { fontSize: '24px', marginRight: '10px' },
  fileInput: { fontSize: '13px', color: '#64748b' },
  selectedFileName: { fontSize: '12px', color: '#10b981', fontWeight: '600', marginTop: '5px' },
  hint: { fontSize: '11px', color: '#94a3b8', marginTop: '10px', fontStyle: 'italic' },
  modalFooter: { 
    padding: '16px 24px', backgroundColor: '#f8fafc', display: 'flex', gap: '12px', borderTop: '1px solid #f1f5f9' 
  },
  cancelBtn: { 
    flex: 1, padding: '12px', backgroundColor: 'white', color: '#64748b', 
    border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' 
  },
  uploadBtn: { 
    flex: 2, padding: '12px', color: 'white', border: 'none', 
    borderRadius: '10px', fontWeight: '700', transition: 'all 0.2s' 
  }
};

export default UploadModal;