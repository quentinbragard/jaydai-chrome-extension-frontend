// src/components/onboarding/steps/CompletionStep.tsx
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';

interface CompletionStepProps {
  onComplete: () => void;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({ onComplete }) => {
  // Track when component mounts
  useEffect(() => {
    trackEvent(EVENTS.ONBOARDING_COMPLETED);
  }, []);
  
  // Handle button click
  const handleGoToChatGPT = () => {
    trackEvent(EVENTS.ONBOARDING_GOTO_CHATGPT);
    
    // Open ChatGPT in a new tab
    window.open('https://chat.openai.com', '_blank');
    
    // Call the completion callback
    onComplete();
  };
  
  return (
    <div className="jd-space-y-6 jd-flex jd-flex-col jd-items-center jd-text-center">
      <div className="jd-p-4 jd-bg-green-900/20 jd-rounded-full jd-mb-4">
        <CheckCircle2 className="jd-h-12 jd-w-12 jd-text-green-500" />
      </div>
      
      <h3 className="jd-text-2xl jd-font-medium jd-text-white jd-mb-2">
        {getMessage('onboardingComplete', undefined, 'Setup Complete!')}
      </h3>
      
      <p className="jd-text-gray-300 jd-max-w-md jd-mx-auto">
        {getMessage(
          'onboardingCompleteDescription', 
          undefined, 
          'Thank you for completing your profile. Your personalized AI templates are now ready to use.'
        )}
      </p>
      
      <div className="jd-bg-blue-900/20 jd-border jd-border-blue-800/40 jd-rounded-lg jd-p-4 jd-mt-6 jd-max-w-md">
        <h4 className="jd-text-blue-400 jd-font-medium jd-mb-2">
          {getMessage('whatNext', undefined, 'What\'s next?')}
        </h4>
        <p className="jd-text-gray-300 jd-text-sm">
          {getMessage(
            'whatNextDescription', 
            undefined, 
            'Open ChatGPT or Claude to start using our extension. Look for our button in the bottom right corner of your screen to access your templates and track your AI usage.'
          )}
        </p>
      </div>
      
      <div className="jd-pt-6">
        <Button 
          onClick={handleGoToChatGPT} 
          className="jd-bg-green-600 hover:jd-bg-green-700 jd-text-white jd-font-heading jd-py-6 jd-px-8"
          size="lg"
        >
          {getMessage('goToChatGPT', undefined, 'Go to ChatGPT')}
        </Button>
      </div>
    </div>
  );
};

export default CompletionStep;