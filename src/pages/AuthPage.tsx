import React, { useState } from 'react';
import { LoginForm } from '../components/Auth/LoginForm';
import { RegisterForm } from '../components/Auth/RegisterForm';
import { ForgotPasswordForm } from '../components/Auth/ForgotPasswordForm';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowForgotPassword(false);
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={handleBackToLogin} />;
  }

  return isLogin ? (
    <LoginForm onToggleMode={toggleMode} onForgotPassword={handleForgotPassword} />
  ) : (
    <RegisterForm onToggleMode={toggleMode} />
  );
};