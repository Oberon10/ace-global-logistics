'use client';

import React from 'react';
import AdminDashboardView from '../../../views/AdminDashboardView';
import LoginView from '../../../views/LoginView';
import { useApp } from '../../../context/AppContext';

export default function AdminShipmentsPage() {
  const { 
    activeRole,
    isHydrated,
    handleLoginSuccess,
    shipments, 
    handleSelectShipment, 
    handleOpenReceipt, 
    navigate, 
    setActiveRole,
    theme,
    toggleTheme 
  } = useApp();

  if (!isHydrated) {
    return null;
  }

  if (activeRole !== 'admin') {

    return (
      <LoginView 
        onLoginSuccess={(role, userObj) => handleLoginSuccess(role, userObj, '/admin/shipments')} 
        setView={navigate}
        initialPortal="admin"
        authNotice="Please sign in with Executive Administrator credentials to access Shipment Management."
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <AdminDashboardView 
      shipments={shipments}
      onSelectShipment={handleSelectShipment}
      onViewReceipt={handleOpenReceipt}
      setView={navigate}
      setActiveRole={setActiveRole}
      currentView="admin-shipments"
    />
  );
}
