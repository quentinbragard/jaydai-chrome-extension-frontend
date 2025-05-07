// src/extension/welcome/hooks/useAuthModal.ts
import { useState } from 'react';
import { trackEvent, EVENTS } from '@/utils/amplitude';

export function useAuthModal() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleGetStarted = () => {
    setAuthMode('signup');
    setIsAuthOpen(true);
    trackEvent(EVENTS.SIGNUP_STARTED);
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setIsAuthOpen(true);
    trackEvent(EVENTS.SIGNIN_STARTED);
  };

  return {
    authMode,
    isAuthOpen,
    setIsAuthOpen,
    handleGetStarted,
    handleSignIn
  };
}