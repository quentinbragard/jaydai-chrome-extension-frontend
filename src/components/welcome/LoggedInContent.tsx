// Logged in content for authenticated users
import { getMessage } from '@/core/utils/i18n';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { AIToolGrid } from '@/components/welcome/AIToolGrid';

interface LoggedInContentProps {
    user: any;
    onboardingRequired: boolean;
    onShowOnboarding: () => void;
    onSignOut: () => void;
  }
  
export const LoggedInContent: React.FC<LoggedInContentProps> = ({ 
    user, 
    onboardingRequired, 
    onShowOnboarding,
    onSignOut
  }) => {
    return (
        <>
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
          
          <div className="jd-flex jd-flex-col jd-items-center jd-gap-4">
            {!onboardingRequired ? (
              <AIToolGrid />
            ) : (
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
    </>
  );
};