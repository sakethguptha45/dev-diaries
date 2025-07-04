import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useCardStore } from './store/cardStore';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { EmailVerificationPage } from './pages/EmailVerificationPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { LoadingSpinner } from './components/UI/LoadingSpinner';
import { ROUTES } from './constants';

function App() {
  const { isAuthenticated, loading, user, initialize } = useAuthStore();
  const { loadUserCards } = useCardStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserCards(user.id);
    }
  }, [isAuthenticated, user, loadUserCards]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" color="white" text="Loading..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Protected routes */}
          {isAuthenticated ? (
            <>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/editor" element={<EditorPage />} />
              <Route path="/editor/:id" element={<EditorPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;