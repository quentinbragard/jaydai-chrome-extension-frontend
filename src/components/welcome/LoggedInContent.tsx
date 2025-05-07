// Logged in content for authenticated users
import { getMessage } from '@/core/utils/i18n';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { openAiTool } from '@/components/utils/openAiTool';
import { Sparkles } from 'lucide-react';
import { FeatureGrid } from '@/components/welcome/FeatureGrid';

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
    // Handler for ChatGPT
    const handleOpenChatGPT = () => openAiTool('https://chat.openai.com/');
    // Handler for Claude
    const handleOpenClaude = () => openAiTool('https://claude.ai/');
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
          
          <div className="jd-flex jd-flex-col sm:jd-flex-row jd-gap-4 jd-justify-center">
            {/* Show ChatGPT and Claude buttons if onboarding is not required */}
            {!onboardingRequired ? (
              <>
                <Button 
                  size="lg"
                  onClick={handleOpenChatGPT}
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
                <Button 
                  size="lg"
                  onClick={handleOpenClaude}
                  className="jd-gap-2 jd-bg-gradient-to-r jd-from-purple-600 jd-to-indigo-600 hover:jd-from-purple-500 hover:jd-to-indigo-500 jd-transition-all jd-duration-300 jd-py-6 jd-rounded-lg jd-relative jd-overflow-hidden jd-group jd-min-w-52 jd-font-heading"
                >
                  <div className="jd-absolute jd-inset-0 jd-w-full jd-h-full jd-bg-gradient-to-r jd-from-purple-600/0 jd-via-indigo-400/10 jd-to-indigo-600/0 jd-transform jd-skew-x-12 jd-translate-x-full group-hover:jd-translate-x-full jd-transition-transform jd-duration-1000 jd-ease-out"></div>
                  <span className="jd-flex jd-items-center jd-justify-center jd-text-lg">
                    <img 
                      src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//claude_logo.png" 
                      alt="Claude" 
                      className="jd-h-6 jd-w-6 jd-mr-2" 
                    />
                    <span>{getMessage('openClaude', undefined, 'Open Claude')}</span>
                    <ExternalLink className="jd-w-4 jd-h-4 jd-ml-2" />
                  </span>
                </Button>
              </>
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
      <FeatureGrid />
    </>
  );
};