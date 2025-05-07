// src/components/welcome/onboarding/OnboardingCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { StepIndicator } from '@/components/welcome/onboarding/StepIndicator';
import { getMessage } from '@/core/utils/i18n';

interface OnboardingCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  footer?: React.ReactNode;
  error?: string | null;
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({
  children,
  title = getMessage('onboardingTitle'),
  description = getMessage('onboardingDescription'),
  currentStep,
  totalSteps,
  stepTitles,
  footer,
  error
}) => {
  return (
    <motion.div 
      className="jd-w-full jd-max-w-3xl jd-mx-auto jd-bg-gradient-to-br jd-from-gray-800 jd-to-gray-900 jd-border-gray-800 jd-shadow-2xl jd-rounded-xl jd-overflow-hidden jd-relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Decorative elements */}
      <motion.div 
        className="jd-absolute jd-top-0 jd-right-0 jd-w-64 jd-h-64 jd-bg-blue-500/5 jd-rounded-full jd-blur-3xl jd-z-0"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      />
      <motion.div 
        className="jd-absolute jd-bottom-0 jd-left-0 jd-w-64 jd-h-64 jd-bg-indigo-500/5 jd-rounded-full jd-blur-3xl jd-z-0"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ 
          duration: 7, 
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1
        }}
      />
      
      <div className="jd-relative jd-z-10">
        <div className="jd-space-y-2 jd-p-8">
          <motion.h2 
            className="jd-text-2xl jd-font-heading jd-text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {currentStep === totalSteps - 1
              ? getMessage('onboardingAllSet')
              : title}
          </motion.h2>
          
          <motion.p 
            className="jd-text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {description}
          </motion.p>
          
          {/* Progress indicator */}
          <StepIndicator 
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepTitles={stepTitles}
          />
        </div>
        
        <div className="jd-px-8 jd-pb-8">
          {/* Error message with animation */}
          {error && (
            <motion.div 
              className="jd-bg-red-900/30 jd-border jd-border-red-700/50 jd-rounded-md jd-p-3 jd-mb-4 jd-flex jd-items-start jd-gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="jd-h-5 jd-w-5 jd-text-red-400 jd-shrink-0 jd-mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="jd-text-red-300 jd-text-sm">{error}</p>
            </motion.div>
          )}
          
          {/* Current step content with animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
        
        {footer && (
          <div className="jd-flex jd-justify-between jd-border-t jd-border-gray-800 jd-pt-4 jd-px-8 jd-pb-8">
            {footer}
          </div>
        )}
      </div>
    </motion.div>
  );
};

