'use client';

import React from 'react';
import UserManagementView from '../../../views/UserManagementView';
import LoginView from '../../../views/LoginView';
import { useApp } from '../../../context/AppContext';

export default function AdminUsersPage() {
  const { navigate, activeRole, setActiveRole, handleLoginSuccess, theme, toggleTheme } = useApp();

  if (activeRole !== 'admin') {
    return (
      <LoginView 
        onLoginSuccess={(role, userObj) => handleLoginSuccess(role, userObj, '/admin/users')} 
        setView={navigate}
        initialPortal="admin"
        authNotice="Please sign in with Executive Administrator credentials to access User Management."
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
      initialFilter="ALL"
      currentView="users"
    />
  );
}
