// src/pages/RegisterPage.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import RegisterLeftPanel from '../components/login/RegisterLeftPanel';
import LoginRightPanel from '../components/login/LoginRightPanel';
import AnimatedBackgroundEffects from '../components/custom/AnimatedBackgroundEffects';
import { useAuth } from '../hooks/useAuth';


export default function RegisterPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="h-screen grid grid-cols-[2fr_3fr]" data-test="page-register">
      <div className="flex flex-col items-center justify-center bg-white h-screen" data-test="register-left-panel">
        <RegisterLeftPanel />
      </div>
      <div className="blink-gradient relative overflow-hidden h-screen flex flex-col" data-test="register-right-panel">
        <AnimatedBackgroundEffects />
        <div className="flex items-center justify-center flex-1 relative z-10" data-test="register-right-content">
          <LoginRightPanel />
        </div>
      </div>
    </div>
  );
}
