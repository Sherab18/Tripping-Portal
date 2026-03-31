import React from 'react';

const Navigation = ({ activeTab, setActiveTab, currentUser }) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  const menuItems = [
    { id: 'logs', label: 'Incident Logs', icon: '📋', roles: ['ADMIN', 'USER'] },
    { id: 'form', label: 'New Incident', icon: '⚡', roles: ['ADMIN'] },
    { id: 'audit', label: 'Audit Trail', icon: '🛡️', roles: ['ADMIN'] },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoSection}>
        <div style={styles.logoIcon}>⚡</div>
        <div>
          <h1 style={styles.logoText}>BPSO</h1>
          <p style={styles.logoSubtext}>Grid Management</p>
        </div>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          // Only show menu items the user has permission to see
          if (!item.roles.includes(currentUser?.role)) return null;

          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navItem,
                backgroundColor: isActive ? '#4f46e5' : 'transparent',
                color: isActive ? 'white' : '#64748b',
              }}
            >
              <span style={styles.icon}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={styles.userSection}>
        <div style={styles.userBadge}>
          {currentUser?.username?.charAt(0).toUpperCase()}
        </div>
        <div style={styles.userInfo}>
          <p style={styles.userName}>{currentUser?.username}</p>
          <p style={styles.userRole}>{currentUser?.role}</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    height: '100vh',
    backgroundColor: 'white',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
  },
  logoSection: {
    padding: '30px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #f1f5f9',
  },
  logoIcon: {
    fontSize: '24px',
    backgroundColor: '#4f46e5',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    color: 'white',
  },
  logoText: { fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: 0 },
  logoSubtext: { fontSize: '11px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' },
  nav: { padding: '20px 12px', flex: 1 },
  navItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    marginBottom: '8px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  icon: { marginRight: '12px', fontSize: '18px' },
  userSection: {
    padding: '20px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px',
  },
  userInfo: { overflow: 'hidden' },
  userName: { margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  userRole: { margin: 0, fontSize: '11px', color: '#64748b' },
};

export default Navigation;