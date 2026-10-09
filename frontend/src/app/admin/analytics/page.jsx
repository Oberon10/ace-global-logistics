'use client';

import React from 'react';
import AnalyticsView from '../../../views/AnalyticsView';
import LoginView from '../../../views/LoginView';
import { useApp } from '../../../context/AppContext';

export default function AdminAnalyticsPage() {
  const { navigate, activeRole, isHydrated, setActiveRole, handleLoginSuccess, theme, toggleTheme } = useApp();

  if (!isHydrated) {
    return null;
  }

  if (activeRole !== 'admin') {
    return (
      <LoginView 
        onLoginSuccess={(role, userObj) => handleLoginSuccess(role, userObj, '/admin/analytics')} 
        setView={navigate}
        initialPortal="admin"
        authNotice="Please sign in with Executive Administrator credentials to access Enterprise Analytics."
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <AnalyticsView 
      setView={navigate} 
      setActiveRole={setActiveRole} 
    />
  );
}
