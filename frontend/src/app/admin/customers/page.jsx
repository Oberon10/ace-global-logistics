'use client';

import React from 'react';
import UserManagementView from '../../../views/UserManagementView';
import LoginView from '../../../views/LoginView';
import { useApp } from '../../../context/AppContext';

export default function AdminCustomersPage() {
  const { navigate, activeRole, isHydrated, setActiveRole, handleLoginSuccess, theme, toggleTheme } = useApp();

  if (!isHydrated) {
    return null;
  }

  if (activeRole !== 'admin') {
    return (
      <LoginView 
        onLoginSuccess={(role, userObj) => handleLoginSuccess(role, userObj, '/admin/customers')} 
        setView={navigate}
        initialPortal="admin"
        authNotice="Please sign in with Executive Administrator credentials to access the Customers Directory."
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <UserManagementView 
      setView={navigate}
      activeRole={activeRole}
      setActiveRole={setActiveRole}
      initialFilter="Customer"
      currentView="admin-customers"
    />
  );
}
