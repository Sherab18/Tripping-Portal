import React, { useState, useEffect, useRef } from 'react';
import LoginForm from './components/LoginForm';
import AdminTrippingForm from './components/TrippingForm';
import TripLogs from './components/TripLogs';
import AuditLogTable from './components/AuditLogTable';
import ResetPasswordModal from './components/ResetPasswordModal';

function App() {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('bpso_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [adminView, setAdminView] = useState('form'); // 'form' or 'audit'
  const [showSettings, setShowSettings] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- EFFECTS ---
  // Close dropdown when clicking anywhere else on the screen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS ---
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('bpso_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bpso_user');
    setShowSettings(false);
  };

  const handleOpenReset = () => {
    setIsResetModalOpen(true);
    setShowSettings(false); // Close dropdown when modal opens
  };

  return (
    <div style={{ ...styles.appContainer, backgroundImage: 'url("/coverpage.jpg")' }}>
      <div style={styles.overlay}>
        
        {!user ? (
          /* --- 1. LOGIN SCREEN (Side-by-Side) --- */
          <div style={styles.loginLayout}>
            <div style={styles.leftTableSection}>
               <h3 style={styles.sectionTitle}>📋 Live Trip Incident Logs</h3>
               <TripLogs currentUser={null} />
            </div>
            <div style={styles.rightLoginSection}>
              <LoginForm onLogin={handleLogin} />
            </div>
          </div>
        ) : (
          /* --- 2. DASHBOARD (Full Width) --- */
          <div style={styles.dashboardWrapper}>
            
            {/* NAVIGATION BAR */}
            <div style={styles.headerRow}>
              <div style={styles.userInfo}>
                <span style={{ color: '#64748b' }}>BPSO Tripping Portal</span> 
                <span style={styles.dividerPipe}>|</span>
                User: <strong style={{ color: '#1e293b' }}>{user.username}</strong>
                {user.role === 'ADMIN' && <span style={styles.adminBadge}>ADMIN</span>}
              </div>

              {/* SETTINGS DROPDOWN */}
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  style={styles.settingsToggle}
                >
                  ⚙️ Settings <span style={{ fontSize: '10px', marginLeft: '5px' }}>{showSettings ? '▲' : '▼'}</span>
                </button>

                {showSettings && (
                  <div style={styles.dropdownMenu}>
                    <div style={styles.dropdownHeader}>Account Actions</div>
                    <button onClick={handleOpenReset} style={styles.dropdownItem}>
                      🔑 Reset Password
                    </button>
                    <div style={styles.menuDivider}></div>
                    <button onClick={handleLogout} style={{ ...styles.dropdownItem, color: '#e53e3e' }}>
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* MAIN CONTENT AREA */}
            <div style={styles.mainContentCard}>
              {user.role === 'ADMIN' ? (
                /* ADMIN VIEW */
                <>
                  <div style={styles.tabNav}>
                    <button 
                       onClick={() => setAdminView('form')}
                       style={adminView === 'form' ? styles.activeTab : styles.tab}>
                       ⚡ Log New Incident
                    </button>
                    <button 
                       onClick={() => setAdminView('audit')}
                       style={adminView === 'audit' ? styles.activeTab : styles.tab}>
                       🛡️ View Audit Trail
                    </button>
                  </div>
                  
                  {adminView === 'form' ? (
                    <>
                      <AdminTrippingForm currentUser={user} />
                      <div style={styles.logSection}>
                        <h3 style={styles.subTitle}>Recent Incidents</h3>
                        <TripLogs currentUser={user} />
                      </div>
                    </>
                  ) : (
                    <div style={styles.auditContainer}>
                      <AuditLogTable />
                    </div>
                  )}
                </>
              ) : (
                /* STATION USER VIEW */
                <>
                  <div style={styles.userWelcome}>
                    <h2 style={styles.title}>{user.username} Substation</h2>
                    <p style={{ color: '#64748b', margin: 0 }}>Tripping Report & File Management</p>
                  </div>
                  <div style={styles.logSection}>
                    <TripLogs currentUser={user} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- 3. MODALS --- */ }
        {isResetModalOpen && (
          <ResetPasswordModal 
            user={user} 
            onClose={() => setIsResetModalOpen(false)} 
          />
        )}
      </div>
    </div>
  );
}

// --- STYLES OBJECT ---
const styles = {
  appContainer: { backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column' },
  overlay: { backgroundColor: 'rgba(15, 23, 42, 0.6)', minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' },
  
  /* Login Screen */
  loginLayout: { display: 'flex', gap: '30px', maxWidth: '1600px', width: '100%', alignItems: 'flex-start' },
  leftTableSection: { flex: 2.5, backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', maxHeight: '85vh', overflowY: 'auto' },
  rightLoginSection: { flex: 0.8, position: 'sticky', top: '40px' },
  sectionTitle: { marginBottom: '15px', color: '#1a365d', fontWeight: '800' },

  /* Dashboard Header */
  dashboardWrapper: { width: '100%', maxWidth: '1400px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '12px 25px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  dividerPipe: { color: '#e2e8f0', fontWeight: '300' },
  adminBadge: { backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' },

  /* Settings Dropdown */
  settingsToggle: { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center' },
  dropdownMenu: { position: 'absolute', right: 0, top: '45px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)', width: '180px', zIndex: 1000, border: '1px solid #e2e8f0', padding: '8px 0' },
  dropdownHeader: { padding: '8px 16px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' },
  dropdownItem: { width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', color: '#334155', fontWeight: '500', transition: 'background 0.2s' },
  menuDivider: { height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' },

  /* Dashboard Content */
  mainContentCard: { backgroundColor: 'rgba(255, 255, 255, 0.98)', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)', minHeight: '600px' },
  tabNav: { display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' },
  tab: { padding: '10px 20px', borderRadius: '6px', border: '1px solid #cbd5e0', cursor: 'pointer', background: 'white', color: '#475569', fontWeight: '600' },
  activeTab: { padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#3182ce', color: 'white', fontWeight: 'bold' },
  
  auditContainer: { animation: 'fadeIn 0.3s ease-in' },
  logSection: { marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' },
  subTitle: { fontSize: '16px', color: '#1e293b', marginBottom: '15px' },
  userWelcome: { marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' },
  title: { color: '#1e293b', margin: '0 0 5px 0', fontSize: '24px', fontWeight: '800' }
};

export default App;