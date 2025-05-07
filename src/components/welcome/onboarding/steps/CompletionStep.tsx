// src/extension/welcome/onboarding/steps/CompletionStep.tsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, ExternalLink, Sparkles, Star } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';

interface CompletionStepProps {
  onComplete: () => void;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({ onComplete }) => {
  // Track when component mounts - keep your existing tracking
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

  const handleGoToClaude = () => {
    trackEvent(EVENTS.ONBOARDING_COMPLETED);
    
    // Open Claude in a new tab
    window.open('https://claude.ai', '_blank');
    
    // Call the completion callback
    onComplete();
  };
  
  return (
    <motion.div 
      className="jd-space-y-6 jd-flex jd-flex-col jd-items-center jd-text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Success animation */}
      <div className="jd-relative jd-p-4 jd-mb-4">
        <motion.div 
          className="jd-absolute jd-inset-0 jd-rounded-full jd-bg-gradient-to-r jd-from-green-500/20 jd-to-teal-500/20 jd-blur-xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
        
        <motion.div
          className="jd-relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 20
          }}
        >
          <div className="jd-bg-gradient-to-r jd-from-green-500 jd-to-teal-500 jd-w-24 jd-h-24 jd-rounded-full jd-flex jd-items-center jd-justify-center">
            <CheckCircle2 className="jd-h-12 jd-w-12 jd-text-white" />
          </div>
          
          {/* Celebration stars */}
          <CelebrationStars />
        </motion.div>
      </div>
      
      <motion.h3 
        className="jd-text-2xl jd-font-bold jd-text-white jd-font-heading"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {getMessage('onboardingComplete', undefined, 'Setup Complete!')}
      </motion.h3>
      
      <motion.p 
        className="jd-text-gray-300 jd-max-w-md jd-mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {getMessage(
          'onboardingCompleteDescription', 
          undefined, 
          'Thank you for completing your profile. Your personalized AI templates are now ready to use.'
        )}
      </motion.p>
      
      <motion.div 
        className="jd-bg-blue-900/20 jd-border jd-border-blue-800/40 jd-rounded-lg jd-p-4 jd-mt-6 jd-max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h4 className="jd-text-blue-400 jd-font-medium jd-mb-2 jd-flex jd-items-center jd-justify-center jd-gap-2">
          <Sparkles className="jd-h-4 jd-w-4" />
          {getMessage('whatNext', undefined, 'What\'s next?')}
        </h4>
        <p className="jd-text-gray-300 jd-text-sm">
          {getMessage(
            'whatNextDescription', 
            undefined, 
            'Open ChatGPT or Claude to start using our extension. Look for our button in the bottom right corner of your screen to access your templates and track your AI usage.'
          )}
        </p>
      </motion.div>
      
      <motion.div 
        className="jd-pt-6 jd-flex jd-flex-col sm:jd-flex-row jd-gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button 
          onClick={handleGoToChatGPT} 
          className="jd-bg-gradient-to-r jd-from-green-600 jd-to-emerald-600 hover:jd-from-green-500 hover:jd-to-emerald-500 jd-text-white jd-font-heading jd-py-6 jd-px-8 jd-gap-2 jd-shadow-lg hover:jd-shadow-green-500/25 jd-transition-all jd-duration-200"
          size="lg"
        >
          <svg className="jd-h-5 jd-w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="white"/>
          </svg>
          {getMessage('goToChatGPT', undefined, 'Go to ChatGPT')}
          <ExternalLink className="jd-h-5 jd-w-5" />
        </Button>

        <Button 
          onClick={handleGoToClaude} 
          className="jd-bg-gradient-to-r jd-from-green-600 jd-to-emerald-600 hover:jd-from-green-500 hover:jd-to-emerald-500 jd-text-white jd-font-heading jd-py-6 jd-px-8 jd-gap-2 jd-shadow-lg hover:jd-shadow-green-500/25 jd-transition-all jd-duration-200"
          size="lg"
        >
          <svg className="jd-h-5 jd-w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="white"/>
          </svg>
          {getMessage('goToClaude', undefined, 'Go to Claude')}
          <ExternalLink className="jd-h-5 jd-w-5" />
        </Button>
        
        <Button 
          onClick={onComplete} 
          variant="outline"
          className="jd-border-gray-700 jd-text-white hover:jd-bg-gray-800 jd-font-heading jd-transition-all jd-duration-200"
          size="lg"
        >
          {getMessage('returnToHome', undefined, 'Return to Home')}
        </Button>
      </motion.div>
    </motion.div>
  );
};

// Celebration animation component
const CelebrationStars = () => {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="jd-absolute"
          style={{
            top: '50%',
            left: '50%',
            x: `-50%`,
            y: `-50%`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
            x: [0, (i % 2 ? 60 : -60) * Math.sin(i * 45 * Math.PI / 180)],
            y: [0, (i % 2 ? 60 : -60) * Math.cos(i * 45 * Math.PI / 180)], 
          }}
          transition={{ 
            duration: 1,
            delay: 0.3 + (i * 0.05),
            ease: "easeOut" 
          }}
        >
          <Star className="jd-h-4 jd-w-4 jd-text-yellow-300" />
        </motion.div>
      ))}
    </>
  );
};