// src/components/welcome/OnboardingActions.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';

interface OnboardingActionsProps {
  onNext?: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
}

export const OnboardingActions: React.FC<OnboardingActionsProps> = ({
  onNext,
  onBack,
  isLastStep = false,
  isSubmitting = false,
  nextLabel
}) => {
  return (
    <div className="jd-flex jd-justify-between jd-pt-6">
      {onBack ? (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button 
            onClick={onBack}
            variant="outline"
            className="jd-border-gray-700 jd-text-white hover:jd-bg-gray-800 jd-transition-all jd-duration-200 jd-font-heading"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="jd-mr-2 jd-h-4 jd-w-4" />
            {getMessage('back', undefined, 'Back')}
          </Button>
        </motion.div>
      ) : (
        <div></div> // Empty div for flex spacing
      )}
      
      {onNext && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={onNext} 
            className="jd-bg-gradient-to-r jd-from-blue-600 jd-to-indigo-600 hover:jd-from-blue-500 hover:jd-to-indigo-500 jd-text-white jd-font-heading jd-shadow-lg hover:jd-shadow-blue-500/25 jd-transition-all jd-duration-200"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <span className="jd-flex jd-items-center">
                <svg className="jd-animate-spin jd-ml-1 jd-mr-3 jd-h-4 jd-w-4 jd-text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="jd-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="jd-opacity-75 jd-fill-current jd-text-white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {getMessage('processing', undefined, 'Processing...')}
              </span>
            ) : (
              <>
                {nextLabel || (isLastStep 
                  ? getMessage('complete', undefined, 'Complete') 
                  : getMessage('nextStep', undefined, 'Continue')
                )}
                <ArrowRight className="jd-ml-2 jd-h-4 jd-w-4" />
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

