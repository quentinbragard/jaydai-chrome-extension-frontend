// src/components/onboarding/StepIndicator.tsx
import React from 'react';

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
      {/* Progress bar */}
      <div className="jd-w-full jd-h-2 jd-bg-gray-800 jd-rounded-full jd-mb-4">
        <div 
          className="jd-h-2 jd-bg-blue-600 jd-rounded-full jd-transition-all jd-duration-300"
          style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
        />
      </div>
      
      {/* Step indicators */}
      <div className="jd-flex jd-justify-between jd-items-center jd-w-full">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div 
            key={index} 
            className="jd-flex jd-flex-col jd-items-center jd-relative"
          >
            <div 
              className={`
                jd-w-8 jd-h-8 jd-rounded-full jd-flex jd-items-center jd-justify-center
                jd-transition-all jd-duration-300 jd-font-medium
                ${index < currentStep 
                  ? 'jd-bg-blue-600 jd-text-white' 
                  : index === currentStep 
                    ? 'jd-bg-blue-600 jd-text-white jd-ring-2 jd-ring-blue-400 jd-ring-offset-2 jd-ring-offset-gray-900' 
                    : 'jd-bg-gray-800 jd-text-gray-400'}
              `}
            >
              {index < currentStep ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="jd-h-4 jd-w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            
            {/* Step title */}
            {stepTitles && (
              <span 
                className={`
                  jd-text-xs jd-mt-2 jd-absolute jd-top-full jd-font-medium
                  ${index === currentStep ? 'jd-text-blue-400' : 'jd-text-gray-400'}
                `}
              >
                {stepTitles[index]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;