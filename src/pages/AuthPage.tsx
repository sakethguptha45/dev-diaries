import React, { useState } from 'react';
import { LoginForm } from '../components/Auth/LoginForm';
import { RegisterForm } from '../components/Auth/RegisterForm';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return isLogin ? (
    <LoginForm onToggleMode={toggleMode} />
  ) : (
    <RegisterForm onToggleMode={toggleMode} />
  );
};