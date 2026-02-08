import React, { useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const { handleRedirectCallback } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await handleRedirectCallback({ 
          afterSignInUrl: '/home',
          afterSignUpUrl: '/home' 
        });
        navigate('/home', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [handleRedirectCallback, navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Authenticating...</p>
        <p className="mt-2 text-sm text-gray-400">Please wait while we sign you in</p>
      </div>
    </div>
  );
}