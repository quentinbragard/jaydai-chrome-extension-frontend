// src/hooks/welcome/useOnboardingStatus.ts
import { useState, useEffect } from 'react';
import { userApi } from '@/services/api/UserApi';
import { User } from '@/types';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { debug } from '@/core/config';

export function useOnboardingStatus(user: User | null, isAuthenticated: boolean) {
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // This effect should run whenever auth state changes
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Only proceed if user is authenticated and we're not already checking
      if (!user || !isAuthenticated || isChecking) {
        return;
      }
      
      setIsChecking(true);
      
      try {
        debug('Checking onboarding status...');
        const status = await userApi.getUserOnboardingStatus();
        debug('Onboarding status:', status);
        
        const needsOnboarding = !status.hasCompleted;
        setOnboardingRequired(needsOnboarding);
        
        // Immediately show onboarding if needed
        if (needsOnboarding) {
          setShowOnboarding(true);
          trackEvent(EVENTS.ONBOARDING_STARTED, {
            user_id: user.id
          });
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to not requiring onboarding on error
        setOnboardingRequired(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    // Run the check whenever authentication state changes
    checkOnboardingStatus();
  }, [user, isAuthenticated, isChecking]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setOnboardingRequired(false);
    trackEvent(EVENTS.ONBOARDING_COMPLETED, {
      user_id: user?.id
    });
  };
  
  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    // We still mark it as required, but allow the user to access the app
    trackEvent(EVENTS.ONBOARDING_SKIPPED, {
      user_id: user?.id
    });
  };

  return { 
    onboardingRequired, 
    showOnboarding, 
    setShowOnboarding,
    handleOnboardingComplete,
    handleOnboardingSkip
  };
}