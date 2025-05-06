// src/extension/welcome/WelcomePage.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
import { getMessage } from '@/core/utils/i18n';
import { initAmplitude, trackEvent, EVENTS } from '@/utils/amplitude';

// Components
import { WelcomeLayout } from './layout';
import { AnimatedTaskText } from '@/components/welcome/AnimatedTaskText';
import { FeatureGrid } from '@/components/welcome/FeatureGrid';
import { LoadingSpinner } from '@/components/welcome/LoadingSpinner';
import { ErrorDisplay } from '@/components/welcome/ErrorDisplay';
import AuthModal from './auth/AuthModal';
import OnboardingFlow from './onboarding/OnboardingFlow';

// Custom hooks
import { useInitializeServices } from '@/hooks/welcome/useInitializeServices';
import { useAuthState } from '@/hooks/welcome/useAuthState';
import { useOnboardingStatus } from '@/hooks/welcome/useOnboardingStatus';
import { useAuthModal } from '@/hooks/welcome/useAuthModal';

const WelcomePage: React.FC = () => {
  // Initialize amplitude tracking
  React.useEffect(() => {
    initAmplitude();
    trackEvent(EVENTS.EXTENSION_INSTALLED);
  }, []);

  // Initialize services
  const { isInitialized, isLoading, initError } = useInitializeServices();
  
  // Auth state
  const { authState, handleSignOut } = useAuthState();
  
  // Onboarding status
  const { 
    onboardingRequired, 
    showOnboarding, 
    setShowOnboarding,
    handleOnboardingComplete, 
    handleOnboardingSkip 
  } = useOnboardingStatus(
    authState.user, 
    authState.isAuthenticated
  );
  
  // Auth modal state
  const {
    authMode,
    isAuthOpen,
    setIsAuthOpen,
    handleGetStarted,
    handleSignIn
  } = useAuthModal();

  // Handle navigation to ChatGPT
  const openChatGPT = () => {
    trackEvent(EVENTS.ONBOARDING_GOTO_CHATGPT);
    chrome.tabs.create({ url: 'https://chat.openai.com' });
  };

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
  
  // Show onboarding flow if needed
  if (authState.isAuthenticated && showOnboarding) {
    return (
      <div className="jd-min-h-screen jd-bg-background jd-text-foreground jd-flex jd-items-center jd-justify-center jd-font-sans jd-p-6">
        <OnboardingFlow 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
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
          : getMessage('welcomeTitle', undefined, 'Welcome to Archimind')}
      </h1>
      
      {/* Logged in state: Display user info and CTA */}
      {authState.isAuthenticated && authState.user ? (
        <LoggedInContent 
          user={authState.user}
          onboardingRequired={onboardingRequired}
          showOnboarding={showOnboarding}
          onOpenChatGPT={openChatGPT}
          onShowOnboarding={() => setShowOnboarding(true)}
          onSignOut={handleSignOut}
        />
      ) : (
        <AnonymousContent />
      )}
      
      {/* Feature Cards - Shown to all users */}
      <FeatureGrid />
      
      {/* Call-to-Action Buttons - Only for non-logged in users */}
      {!authState.isAuthenticated && (
        <div className="jd-flex jd-flex-row jd-gap-4 jd-mb-8">
          <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
            <div className="jd-flex jd-gap-4">
              <Button 
                size="lg" 
                className="jd-gap-2 jd-bg-blue-600 hover:jd-bg-blue-700 jd-min-w-32 jd-font-heading"
                onClick={handleGetStarted}
              >
                {getMessage('getStarted', undefined, 'Get Started')}
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="jd-gap-2 jd-min-w-32 jd-text-white jd-border-gray-700 hover:jd-bg-gray-800 jd-font-heading"
                onClick={handleSignIn}
              >
                {getMessage('signIn', undefined, 'Sign In')}
              </Button>
            </div>
            <DialogContent className="sm:jd-max-w-md jd-bg-gray-950 jd-border-gray-800">
              <AuthModal 
                onClose={() => setIsAuthOpen(false)} 
                initialMode={authMode}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </WelcomeLayout>
  );
};

// Anonymous content shown to non-logged in users
const AnonymousContent: React.FC = () => {
  return (
    <>
      {/* Animation Section with Single Line - Only for non-logged in users */}
      <AnimatedTaskText />

      <p className="jd-text-lg jd-text-gray-300 jd-max-w-2xl jd-text-center jd-mb-12 jd-font-sans">
        {getMessage('welcomeDescription', undefined, 'Your Intelligent AI Usage Companion. Our goal is to help you harness the power of AI while maintaining your unique human expertise.')}
      </p>
    </>
  );
};

// Logged in content for authenticated users
interface LoggedInContentProps {
  user: any;
  onboardingRequired: boolean;
  showOnboarding: boolean;
  onOpenChatGPT: () => void;
  onShowOnboarding: () => void;
  onSignOut: () => void;
}

const LoggedInContent: React.FC<LoggedInContentProps> = ({ 
  user, 
  onboardingRequired, 
  showOnboarding,
  onOpenChatGPT,
  onShowOnboarding,
  onSignOut
}) => {
  return (
    <div className="jd-text-center jd-mb-12">
      <div className="jd-bg-blue-600/20 jd-backdrop-blur-sm jd-rounded-lg jd-p-6 jd-border jd-border-blue-500/20 jd-max-w-2xl jd-mx-auto jd-mb-8">
        <Sparkles className="jd-w-8 jd-h-8 jd-text-blue-400 jd-mx-auto jd-mb-4" />
        <h2 className="jd-text-2xl jd-font-medium jd-text-white jd-mb-2 jd-font-heading">
          {getMessage('accountReady', undefined, 'Your AI companion is ready!')}
        </h2>
        <p className="jd-text-lg jd-text-gray-300 jd-mb-6 jd-font-sans">
          {getMessage('loggedInAs', [user.email || user.name || ''], 
            'You\'re logged in as {0}. You can now launch AI tools with enhanced capabilities.')}
        </p>
        
        <div className="jd-flex jd-flex-col sm:jd-flex-row jd-gap-4 jd-justify-center">
          {/* Only show ChatGPT button if onboarding is not required */}
          {!onboardingRequired ? (
            <Button 
              size="lg"
              onClick={onOpenChatGPT}
              className="jd-gap-2 jd-bg-gradient-to-r jd-from-green-600 jd-to-emerald-600 hover:jd-from-green-500 hover:jd-to-emerald-500 jd-transition-all jd-duration-300 jd-py-6 jd-rounded-lg jd-relative jd-overflow-hidden jd-group jd-min-w-52 jd-font-heading"
            >
              <div className="jd-absolute jd-inset-0 jd-w-full jd-h-full jd-bg-gradient-to-r jd-from-green-600/0 jd-via-green-400/10 jd-to-green-600/0 jd-transform jd-skew-x-12 jd-translate-x-full group-hover:jd-translate-x-full jd-transition-transform jd-duration-1000 jd-ease-out"></div>
              <span className="jd-flex jd-items-center jd-justify-center jd-text-lg">
                <img 
                  src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//chatgpt_logo.png" 
                  alt="ChatGPT" 
                  className="jd-h-6 jd-w-6 jd-mr-2" 
                />
                <span>{getMessage('openChatGPT', undefined, 'Open ChatGPT')}</span>
                <ExternalLink className="jd-w-4 jd-h-4 jd-ml-2" />
              </span>
            </Button>
          ) : (
            // Always show Complete Setup button if onboarding is required
            <Button 
              size="lg"
              onClick={onShowOnboarding}
              className="jd-gap-2 jd-bg-blue-600 hover:jd-bg-blue-700 jd-transition-all jd-duration-300 jd-py-6 jd-rounded-lg jd-min-w-52 jd-font-heading"
            >
              <span className="jd-flex jd-items-center jd-justify-center jd-text-lg">
                {getMessage('completeSetup', undefined, 'Complete Setup')}
              </span>
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={onSignOut}
            className="jd-border-gray-700 jd-text-white hover:jd-bg-gray-800 jd-min-w-32 jd-font-heading"
          >
            {getMessage('signOut', undefined, 'Sign Out')}
          </Button>
        </div>
      </div>
    </div>
  );
};
// Fix missing import
const Sparkles = ({ className }: { className: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3v5m9 6h-5m-9 0H2m19-4-4.8 4.8M12 16v5M7.8 7.8 3 3m13.2 0L12 7.8M3 16l4.8-4.8" />
  </svg>
);

export default WelcomePage;