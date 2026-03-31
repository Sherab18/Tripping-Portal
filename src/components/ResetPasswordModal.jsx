import React, { useState } from 'react';

const ResetPasswordModal = ({ user, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage({ text: '', isError: false });

    // 1. Client-side Validation
    if (newPassword !== confirmPassword) {
      return setMessage({ text: "Passwords do not match!", isError: true });
    }
    if (newPassword.length < 6) {
      return setMessage({ text: "Password must be at least 6 characters.", isError: true });
    }

    setLoading(true);
    try {
      // 2. API Call to Server
      const response = await fetch('http://localhost:3001/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: user.username, 
          newPassword: newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: "✅ Password successfully saved to database!", isError: false });
        // 3. Close modal after 2 seconds so they see the success message
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage({ text: data.error || "Failed to update password.", isError: true });
      }
    } catch (err) {
      setMessage({ text: "Connection error. Ensure the backend is running.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        <div style={styles.header}>
          <h2 style={styles.title}>🔒 Reset Password</h2>
          <p style={styles.subtitle}>Update credentials for <strong>{user.username}</strong></p>
        </div>

        <form onSubmit={handleReset}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>New Password</label>
            <input 
              type="password" 
              placeholder="Enter new password"
              style={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <input 
              type="password" 
              placeholder="Confirm new password"
              style={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
            />
          </div>

          {message.text && (
            <div style={{ 
              ...styles.messageBox, 
              color: message.isError ? '#dc2626' : '#059669',
              backgroundColor: message.isError ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${message.isError ? '#fee2e2' : '#dcfce7'}`
            }}>
              {message.text}
            </div>
          )}

          <div style={styles.footer}>
            <button 
              type="button" 
              onClick={onClose} 
              style={styles.cancelBtn}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Saving to Database...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)', // Dark backdrop
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)'
  },
  modalCard: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid #e2e8f0'
  },
  header: {
    marginBottom: '24px',
    textAlign: 'center'
  },
  title: {
    margin: '0 0 8px 0',
    color: '#1e293b',
    fontSize: '22px',
    fontWeight: '800'
  },
  subtitle: {
    margin: 0,
    color: '#64748b',
    fontSize: '14px'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e0',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  messageBox: {
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '20px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px'
  },
  cancelBtn: {
    padding: '12px 20px',
    border: '1px solid #e2e8f0',
    background: 'white',
    color: '#64748b',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  },
  submitBtn: {
    padding: '12px 24px',
    border: 'none',
    background: '#2563eb',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '14px',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
  }
};

export default ResetPasswordModal;