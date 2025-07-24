// src/extension/welcome/WelcomePage.tsx
import React from 'react';
import { getMessage } from '@/core/utils/i18n';
import { initAmplitude, trackEvent, EVENTS } from '@/utils/amplitude'
import { LoggedInContent } from '@/components/welcome/LoggedInContent';
import { AnonymousContent } from '@/components/welcome/AnonymousContent';
import { WelcomeLayout } from './layout';
import { LoadingSpinner } from '@/components/welcome/LoadingSpinner';
import { ErrorDisplay } from '@/components/welcome/ErrorDisplay';
import OnboardingFlow from '@/components/welcome/onboarding/OnboardingFlow';
import { useInitializeServices } from '@/hooks/welcome/useInitializeServices';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { useOnboardingStatus } from '@/hooks/welcome/useOnboardingStatus';

const WelcomePage: React.FC = () => {
  // Initialize amplitude tracking
  React.useEffect(() => {
    initAmplitude();
    trackEvent(EVENTS.EXTENSION_INSTALLED);
  }, []);

  // Initialize services
  const { isLoading, initError } = useInitializeServices();
  
  // Auth state
  const { authState, handleSignOut } = useAuthState();
  
  // Onboarding status
  const {
    onboardingRequired,
    showOnboarding,
    setShowOnboarding,
    handleOnboardingComplete,
    isChecking,
  } = useOnboardingStatus(
    authState.user,
    authState.isAuthenticated
  );


  // Show loading spinner while initializing
  if (isLoading) {
    return <LoadingSpinner devInfo="Initializing services..." />;
  }
  
  // Show initialization error if any
  if (initError) {
    return (
      <ErrorDisplay
        message={initError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Show spinner while checking onboarding status to avoid flicker
  if (authState.isAuthenticated && isChecking) {
    return <LoadingSpinner devInfo="Checking onboarding status..." />;
  }
  
  // Show onboarding flow if needed
  if (authState.isAuthenticated && showOnboarding) {
    return (
      <div className="jd-min-h-screen jd-bg-background jd-text-foreground jd-flex jd-items-center jd-justify-center jd-font-sans jd-p-6">
        <OnboardingFlow 
          onComplete={handleOnboardingComplete}
          user={authState.user}
        />
      </div>
    );
  }

  return (
    <WelcomeLayout>
      {/* Main Title - Different for logged in users */}
      <h1 className="jd-text-5xl md:jd-text-6xl jd-font-medium jd-text-white jd-text-center jd-mb-6 jd-font-heading">
        {authState.isAuthenticated
          ? getMessage('welcomeBack', undefined, 'Welcome Back!')
          : getMessage('welcomeTitle', undefined, 'Welcome to Jaydai')}
      </h1>
      
      {/* Logged in state: Display user info and CTA */}
      {authState.isAuthenticated && authState.user ? (
        <LoggedInContent 
          user={authState.user}
          onboardingRequired={onboardingRequired}
          onShowOnboarding={() => setShowOnboarding(true)}
          onSignOut={handleSignOut}
        />
      ) : (
        <AnonymousContent />
      )}
    </WelcomeLayout>
  );
};





export default WelcomePage;