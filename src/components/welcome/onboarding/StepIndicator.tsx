// src/components/welcome/StepIndicator.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepTitles
}) => {
  return (
    <div className="jd-my-6">
      {/* Enhanced progress bar with animation */}
      <div className="jd-w-full jd-h-2 jd-bg-gray-800 jd-rounded-full jd-mb-4 jd-relative jd-overflow-hidden">
        <motion.div 
          className="jd-h-2 jd-bg-gradient-to-r jd-from-blue-600 jd-to-indigo-600 jd-rounded-full jd-absolute jd-top-0 jd-left-0"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
      
      {/* Step indicators with animations */}
      <div className="jd-flex jd-justify-between jd-items-center jd-w-full">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div 
              key={index} 
              className="jd-flex jd-flex-col jd-items-center jd-relative"
            >
              <motion.div 
                className={`
                  jd-w-10 jd-h-10 jd-rounded-full jd-flex jd-items-center jd-justify-center
                  jd-transition-all jd-duration-300 jd-font-medium
                  ${isCompleted 
                    ? 'jd-bg-gradient-to-r jd-from-blue-600 jd-to-indigo-600 jd-text-white' 
                    : isCurrent 
                      ? 'jd-bg-gradient-to-r jd-from-blue-500 jd-to-indigo-500 jd-text-white jd-ring-2 jd-ring-blue-400/50 jd-ring-offset-2 jd-ring-offset-gray-900' 
                      : 'jd-bg-gray-800 jd-text-gray-400'}`}
                initial={false}
                animate={{ 
                  scale: isCurrent ? 1.1 : 1,
                  boxShadow: isCurrent ? '0 0 20px rgba(59, 130, 246, 0.5)' : '0 0 0px rgba(59, 130, 246, 0)'
                }}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <CheckCircle className="jd-h-5 jd-w-5" />
                ) : (
                  <span className="jd-text-sm jd-font-medium">{index + 1}</span>
                )}
              </motion.div>
              
              {/* Step title with animation */}
              {stepTitles && stepTitles[index] && (
                <motion.span 
                  className={`
                    jd-text-xs jd-mt-2 jd-absolute jd-top-full jd-whitespace-nowrap jd-font-medium
                    ${isCurrent ? 'jd-text-blue-400' : isCompleted ? 'jd-text-gray-400' : 'jd-text-gray-500'}`}
                  initial={false}
                  animate={{ 
                    opacity: isCurrent ? 1 : (isCompleted ? 0.8 : 0.5)
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {stepTitles[index]}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

