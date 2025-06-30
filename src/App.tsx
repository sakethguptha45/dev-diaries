import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';

function App() {
  const { isAuthenticated, pendingVerification, logout } = useAuthStore();

  // Clean up any invalid states on app load
  useEffect(() => {
    const state = useAuthStore.getState();
    
    // If we have pendingVerification but no verificationEmail, reset the state
    if (state.pendingVerification && !state.verificationEmail) {
      console.log('Cleaning up invalid verification state');
      logout();
    }
    
    // If we're authenticated but have pendingVerification, clear it
    if (state.isAuthenticated && state.pendingVerification) {
      console.log('Cleaning up conflicting auth state');
      useAuthStore.setState({ pendingVerification: false, verificationEmail: '' });
    }
  }, [logout]);

  // Show auth page if not authenticated or if pending verification
  if (!isAuthenticated || pendingVerification) {
    return <AuthPage />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;