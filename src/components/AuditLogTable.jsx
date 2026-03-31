import React, { useState, useEffect } from 'react';

const AuditLogTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/audit-logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch system logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getActionStyle = (action) => {
    const actions = {
      'UPLOAD_FILE': { color: '#2563eb', bg: '#eff6ff', label: 'File Upload' },
      'DELETE_FILE': { color: '#dc2626', bg: '#fef2f2', label: 'File Delete' },
      'DELETE_INCIDENT': { color: '#991b1b', bg: '#fee2e2', label: 'Incident Delete' },
      'STATUS_CHANGE': { color: '#059669', bg: '#ecfdf5', label: 'Status Update' },
      'CREATE_INCIDENT': { color: '#7c3aed', bg: '#f5f3ff', label: 'New Incident' },
    };
    return actions[action] || { color: '#4b5563', bg: '#f3f4f6', label: action };
  };

  const filteredLogs = logs.filter(log => 
    log.user?.toLowerCase().includes(filter.toLowerCase()) || 
    log.details?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div style={styles.loading}>Accessing System Records...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>System Audit Trail</h2>
          <p style={styles.subtitle}>Official record of all stakeholder activities and data modifications.</p>
        </div>
        <div style={styles.controls}>
          <input 
            type="text" 
            placeholder="Search by staff or detail..." 
            style={styles.searchInput}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button onClick={fetchLogs} style={styles.refreshBtn}>🔄 Sync</button>
        </div>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Timestamp</th>
              <th style={styles.th}>Authorized Stations</th>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>Activity Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="4" style={styles.empty}>No matching system logs found.</td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const styleConfig = getActionStyle(log.action);
                return (
                  <tr key={log.id} style={styles.tr}>
                    <td style={styles.tdTime}>
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td style={styles.tdUser}>
                      <div style={styles.userBadge}>
                        <span style={styles.userInitial}>{log.user?.charAt(0) || 'S'}</span>
                        {log.user || "System Process"}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ 
                        ...styles.actionBadge, 
                        color: styleConfig.color, 
                        backgroundColor: styleConfig.bg 
                      }}>
                        {styleConfig.label}
                      </span>
                    </td>
                    <td style={styles.tdDetails}>{log.details}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' },
  title: { fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' },
  controls: { display: 'flex', gap: '10px', alignItems: 'center' },
  searchInput: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '13px', width: '220px' },
  refreshBtn: { padding: '8px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  tableWrapper: { overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' },
  th: { padding: '14px 12px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' },
  td: { padding: '14px 12px', verticalAlign: 'middle' },
  tdTime: { padding: '14px 12px', color: '#64748b', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
  tdUser: { padding: '14px 12px', fontWeight: '600', color: '#1e293b' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '8px' },
  userInitial: { width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' },
  tdDetails: { padding: '14px 12px', color: '#334155', lineHeight: '1.5' },
  actionBadge: { padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' },
  empty: { padding: '60px', textAlign: 'center', color: '#94a3b8' },
  loading: { padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: '600' }
};

export default AuditLogTable;