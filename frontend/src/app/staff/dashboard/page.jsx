'use client';

import React from 'react';
import StaffDashboardView from '../../../views/StaffDashboardView';
import LoginView from '../../../views/LoginView';
import { useApp } from '../../../context/AppContext';

export default function StaffDashboardPage() {
  const { 
    activeRole, 
    isHydrated,
    handleLoginSuccess, 
    navigate, 
    shipments, 
    handleUpdateShipmentStatus, 
    handleSelectShipment, 
    setActiveRole,
    theme,
    toggleTheme 
  } = useApp();

  if (!isHydrated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading Dispatch Console...</p>
      </div>
    );
  }

  if (activeRole !== 'staff' && activeRole !== 'admin') {

    return (
      <LoginView 
        onLoginSuccess={(role, userObj) => handleLoginSuccess(role, userObj, '/staff/dashboard')} 
        setView={navigate}
        initialPortal="staff"
        authNotice="Please sign in with authorized dispatch credentials."
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <StaffDashboardView 
      shipments={shipments} 
      onUpdateShipmentStatus={handleUpdateShipmentStatus} 
      onSelectShipment={handleSelectShipment} 
      setView={navigate} 
      activeRole={activeRole} 
      setActiveRole={setActiveRole} 
    />
  );
}
