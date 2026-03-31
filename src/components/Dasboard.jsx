import React, { useState } from 'react';
import Navigation from './Navigation';
import TripLogs from './TripLogs';
import AdminTrippingForm from './TrippingForm';
import AuditLogTable from './AuditLogTable';

const Dashboard = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('logs');

  return (
    <div style={{ display: 'flex' }}>
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
      />
      
      <main style={{ marginLeft: '260px', width: 'calc(100% - 260px)', minHeight: '100vh' }}>
        {activeTab === 'logs' && <TripLogs currentUser={currentUser} />}
        {activeTab === 'form' && <AdminTrippingForm currentUser={currentUser} />}
        {activeTab === 'audit' && <AuditLogTable />}
      </main>
    </div>
  );
};

export default Dashboard;