import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { LoginForm } from '../components/Auth/LoginForm';
import { RegisterForm } from '../components/Auth/RegisterForm';
import { EmailVerification } from '../components/Auth/EmailVerification';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { pendingVerification, verificationEmail, logout } = useAuthStore();

  // Clean up invalid states
  useEffect(() => {
    if (pendingVerification && !verificationEmail) {
      console.log('Invalid verification state detected, resetting...');
      logout();
    }
  }, [pendingVerification, verificationEmail, logout]);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  const handleBackToLogin = () => {
    setIsLogin(true);
    // Clear pending verification state when going back to login
    logout();
  };

  // Only show verification if we have both pendingVerification AND verificationEmail
  if (pendingVerification && verificationEmail) {
    return <EmailVerification onBack={handleBackToLogin} />;
  }

  return isLogin ? (
    <LoginForm onToggleMode={toggleMode} />
  ) : (
    <RegisterForm onToggleMode={toggleMode} />
  );
};