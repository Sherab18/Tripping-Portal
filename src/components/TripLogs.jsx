import React, { useState, useEffect, useRef } from 'react';
import UploadModal from './UploadModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const TripLogs = ({ currentUser }) => {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // State for Visual Alert
  const [newIncidentId, setNewIncidentId] = useState(null);

  const prevTripsRef = useRef([]);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isStationUser = currentUser?.role === 'USER' || !!currentUser?.substationId;

  // Audio Objects
  const incidentSound = new Audio('/sounds/new-incident.mp3');
  const uploadSound = new Audio('/sounds/file-upload.mp3');

  const fetchTrips = () => {
    fetch('http://localhost:3001/api/trips')
      .then(res => res.json())
      .then(data => {
        if (prevTripsRef.current.length > 0) {
          checkAndPlaySounds(prevTripsRef.current, data);
        }
        setTrips(data);
        prevTripsRef.current = data;
      })
      .catch(err => console.error("Fetch error:", err));
  };

  const checkAndPlaySounds = (oldTrips, newTrips) => {
    // 1. New Incident Detection (Audio + Visual Flash)
    if (newTrips.length > oldTrips.length) {
      incidentSound.play().catch(e => console.log("Audio play blocked"));
      
      // Identify the ID of the newly added incident
      const newestTrip = newTrips[newTrips.length - 1];
      setNewIncidentId(newestTrip.id);
      
      // Remove visual highlight after 5 seconds
      setTimeout(() => setNewIncidentId(null), 5000);
    }

    // 2. File Upload Detection (Audio only)
    newTrips.forEach(newTrip => {
      const oldTrip = oldTrips.find(t => t.id === newTrip.id);
      if (oldTrip) {
        const fileWasAdded = (!oldTrip.fromFIR && newTrip.fromFIR) || (!oldTrip.toFIR && newTrip.toFIR) || (!oldTrip.fromDR && newTrip.fromDR) || (!oldTrip.toDR && newTrip.toDR);
        if (fileWasAdded) {
          uploadSound.play().catch(e => console.log("Audio play blocked"));
        }
      }
    });
  };

  useEffect(() => {
    fetchTrips();
    const interval = setInterval(fetchTrips, 20000);
    return () => clearInterval(interval);
  }, []);

  const calculateDuration = (start, end) => {
    if (!start || !end) return "Active";
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffInMs = endTime - startTime;
    if (diffInMs < 0) return "Invalid";
    const totalSeconds = Math.floor(diffInMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

  const getStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonthTrips = trips.filter(t => {
      const d = new Date(t.trippingDateTime);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    let pendingFIR = 0, pendingDR = 0;
    thisMonthTrips.forEach(t => {
      if (!t.fromFIR) pendingFIR++; if (!t.toFIR) pendingFIR++;
      if (!t.fromDR) pendingDR++; if (!t.toDR) pendingDR++;
    });
    return { pendingFIR, pendingDR, totalIncidents: thisMonthTrips.length };
  };

  const stats = getStats();

  const handleUpdateStatus = async (tripId, newStatus) => {
    if (!window.confirm(`Mark this incident as ${newStatus}?`)) return;
    try {
      const response = await fetch(`http://localhost:3001/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, username: currentUser?.username }),
      });
      if (response.ok) fetchTrips();
    } catch (error) { console.error("Status error:", error); }
  };

  const filteredTrips = trips.filter((trip) => {
    const tripDate = new Date(trip.trippingDateTime).toISOString().split('T')[0];
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (trip.title?.toLowerCase() || "").includes(searchLower) ||
      (trip.fromSubstation?.name?.toLowerCase() || "").includes(searchLower) ||
      (trip.toSubstation?.name?.toLowerCase() || "").includes(searchLower);
    const matchesStart = startDate ? tripDate >= startDate : true;
    const matchesEnd = endDate ? tripDate <= endDate : true;
    return matchesSearch && matchesStart && matchesEnd;
  });

  const downloadPDF = () => {
    const doc = new jsPDF('landscape');
    const tableRows = filteredTrips.map(trip => [
      trip.title, trip.createdBy, new Date(trip.trippingDateTime).toLocaleString(),
      trip.restorationDateTime ? new Date(trip.restorationDateTime).toLocaleString() : "Active",
      calculateDuration(trip.trippingDateTime, trip.restorationDateTime),
      trip.fromSubstation?.name, trip.toSubstation?.name, trip.status || "OPENED"
    ]);
    autoTable(doc, {
      head: [["Incident", "Logged By", "Tripping Time", "Restoration Time", "Duration", "Station A", "Station B", "Status"]],
      body: tableRows,
      startY: 20
    });
    doc.save("BPSO_Tripping_Report.pdf");
  };

  const StatusIcon = ({ fileName, tripId, fieldName }) => {
    const isDone = !!fileName;
    const handleDeleteFile = async () => {
      if (!window.confirm("Delete this file permanently?")) return;
      try {
        const res = await fetch(`http://localhost:3001/api/delete-report/${tripId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fieldName, username: currentUser?.username })
        });
        if (res.ok) fetchTrips();
      } catch (err) { console.error("File delete error:", err); }
    };
    return (
      <div style={styles.statusIconWrapper}>
        {isDone ? (
          <>
            <a href={`http://localhost:3001/uploads/${fileName}`} target="_blank" rel="noreferrer" style={styles.successText}>✔</a>
            {isAdmin && <button onClick={handleDeleteFile} style={styles.trashBtn}>🗑️</button>}
          </>
        ) : <span style={styles.errorText}>✘</span>}
      </div>
    );
  };

  return (
    <div style={styles.mainContainer}>
      
      {/* Visual Flash Animation */}
      <style>
        {`
          @keyframes alertFlash {
            0% { background-color: #ffffff; }
            50% { background-color: #fef3c7; border: 2px solid #f59e0b; }
            100% { background-color: #ffffff; }
          }
          .row-flash {
            animation: alertFlash 1s ease-in-out 5;
          }
        `}
      </style>

      {isAdmin && (
        <div style={styles.topHeader}>
          <div style={styles.statsRow}>
            <div style={styles.card}><p style={styles.cardLabel}>Monthly Incidents</p><p style={styles.cardValue}>{stats.totalIncidents}</p></div>
            <div style={{ ...styles.card, borderLeft: '4px solid #ef4444' }}><p style={styles.cardLabel}>Pending FIRs</p><p style={{ ...styles.cardValue, color: '#ef4444' }}>{stats.pendingFIR}</p></div>
            <div style={{ ...styles.card, borderLeft: '4px solid #f59e0b' }}><p style={styles.cardLabel}>Pending DRs</p><p style={{ ...styles.cardValue, color: '#f59e0b' }}>{stats.pendingDR}</p></div>
          </div>
          <button onClick={downloadPDF} style={styles.primaryBtn}>📥 Export PDF Report</button>
        </div>
      )}

      <div style={styles.filterSection}>
        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.inputField} />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.dateField} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.dateField} />
        <button onClick={() => { setSearchTerm(""); setStartDate(""); setEndDate(""); }} style={styles.ghostBtn}>Reset</button>
      </div>

      <div style={styles.tableShadowBox}>
        <table style={styles.mainTable}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={styles.th}>Tripping Element</th>
              <th style={styles.th}>Logged By</th>
              <th style={styles.th}>Tripping Time</th>
              <th style={styles.th}>Restoration Time</th>
              <th style={styles.th}>Outage Duration</th>
              <th style={styles.th}>Station A</th>
              {(isAdmin || isStationUser) && <><th style={styles.thCenter}>FIR</th><th style={styles.thCenter}>DR</th></>}
              <th style={styles.th}>Station B</th>
              {(isAdmin || isStationUser) && <><th style={styles.thCenter}>FIR</th><th style={styles.thCenter}>DR</th></>}
              <th style={styles.thRight}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.map((trip) => {
              const isStationA = currentUser?.username?.toLowerCase() === trip.fromSubstation?.name?.toLowerCase();
              const isStationB = currentUser?.username?.toLowerCase() === trip.toSubstation?.name?.toLowerCase();
              
              // Apply flash class if this is the new incident
              const flashClass = trip.id === newIncidentId ? 'row-flash' : '';

              return (
                <tr key={trip.id} style={styles.tableBodyRow} className={flashClass}>
                  <td style={styles.tdBold}>{trip.title}</td>
                  <td style={styles.tdSubtle}>{trip.createdBy}</td>
                  <td style={styles.tdSubtle}>{new Date(trip.trippingDateTime).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                  <td style={styles.tdSubtle}>
                    {trip.restorationDateTime 
                      ? new Date(trip.restorationDateTime).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                      : <span style={{color: '#ef4444', fontWeight: 'bold'}}>In Progress</span>}
                  </td>
                  <td style={styles.tdBold}>{calculateDuration(trip.trippingDateTime, trip.restorationDateTime)}</td>
                  <td>{trip.fromSubstation?.name}</td>
                  {(isAdmin || isStationUser) && (
                    <>
                      <td><StatusIcon fileName={trip.fromFIR} tripId={trip.id} fieldName="fromFIR" /></td>
                      <td><StatusIcon fileName={trip.fromDR} tripId={trip.id} fieldName="fromDR" /></td>
                    </>
                  )}
                  <td>{trip.toSubstation?.name}</td>
                  {(isAdmin || isStationUser) && (
                    <>
                      <td><StatusIcon fileName={trip.toFIR} tripId={trip.id} fieldName="toFIR" /></td>
                      <td><StatusIcon fileName={trip.toDR} tripId={trip.id} fieldName="toDR" /></td>
                    </>
                  )}
                  <td style={styles.tdRight}>
                    <div style={styles.actionFlex}>
                      {isAdmin ? (
                        <>
                          <button onClick={() => handleUpdateStatus(trip.id, trip.status === 'CLOSED' ? 'OPENED' : 'CLOSED')}
                            style={trip.status === 'CLOSED' ? styles.reopenBtn : styles.closeBtn}>
                            {trip.status === 'CLOSED' ? 'Reopen' : 'Close'}
                          </button>
                          <button onClick={async () => {
                            if (window.confirm("Delete incident?")) {
                              const res = await fetch(`http://localhost:3001/api/trips/${trip.id}`, {
                                method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ username: currentUser?.username })
                              });
                              if (res.ok) fetchTrips();
                            }
                          }} style={styles.dangerBtn}>Delete</button>
                        </>
                      ) : (
                        <span style={styles.badge}>{trip.status || 'OPENED'}</span>
                      )}
                      {(isStationA || isStationB) && <button onClick={() => setSelectedTrip({ trip, side: isStationA ? 'A' : 'B' })} style={styles.uploadBtn}>Upload</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedTrip && <UploadModal trip={selectedTrip.trip} userSide={selectedTrip.side} currentUser={currentUser} onClose={() => setSelectedTrip(null)} onRefresh={fetchTrips} />}
    </div>
  );
};

const styles = {
  mainContainer: { padding: '20px', fontFamily: 'Inter, sans-serif', backgroundColor: '#f8fafc' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' },
  statsRow: { display: 'flex', gap: '15px', flex: 1 },
  card: { backgroundColor: 'white', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardLabel: { fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' },
  cardValue: { fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 },
  primaryBtn: { backgroundColor: '#1e293b', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  filterSection: { display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' },
  inputField: { flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' },
  dateField: { padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' },
  ghostBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px' },
  tableShadowBox: { backgroundColor: 'white', borderRadius: '12px', overflowX: 'auto', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  mainTable: { width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1100px' },
  tableHeaderRow: { backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9' },
  th: { padding: '12px', textAlign: 'left', color: '#475569', fontWeight: '600' },
  thCenter: { padding: '12px', textAlign: 'center', color: '#475569', fontWeight: '600' },
  thRight: { padding: '12px', textAlign: 'right', color: '#475569', fontWeight: '600' },
  tableBodyRow: { borderBottom: '1px solid #f1f5f9' },
  tdBold: { padding: '12px', fontWeight: '700', color: '#1e293b' },
  tdSubtle: { padding: '12px', color: '#64748b' },
  tdRight: { padding: '12px', textAlign: 'right' },
  statusIconWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
  successText: { color: '#10b981', fontWeight: 'bold', textDecoration: 'none', fontSize: '16px' },
  errorText: { color: '#ef4444', fontSize: '16px' },
  trashBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' },
  actionFlex: { display: 'flex', justifyContent: 'flex-end', gap: '6px' },
  badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', backgroundColor: '#f1f5f9' },
  uploadBtn: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  closeBtn: { backgroundColor: '#dcfce7', color: '#166534', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  reopenBtn: { backgroundColor: '#fffbeb', color: '#92400e', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  dangerBtn: { backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }
};

export default TripLogs;