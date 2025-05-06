// src/extension/welcome/onboarding/components/OnboardingCard.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StepIndicator } from './StepIndicator';
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
  title = 'Complete Your Profile',
  description = 'This helps us personalize your experience and provide relevant templates',
  currentStep,
  totalSteps,
  stepTitles,
  footer,
  error
}) => {
  return (
    <Card className="jd-w-full jd-max-w-3xl jd-mx-auto jd-bg-gray-900 jd-border-gray-800 jd-shadow-2xl">
      <CardHeader className="jd-space-y-2">
        <CardTitle className="jd-text-2xl jd-font-heading jd-text-white">
          {getMessage('onboardingTitle', undefined, title)}
        </CardTitle>
        <CardDescription className="jd-text-gray-300">
          {getMessage('onboardingDescription', undefined, description)}
        </CardDescription>
        
        {/* Progress indicator */}
        <StepIndicator 
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepTitles={stepTitles}
        />
      </CardHeader>
      
      <CardContent>
        {/* Error message */}
        {error && (
          <div className="jd-bg-red-900/30 jd-border jd-border-red-700/50 jd-rounded-md jd-p-3 jd-mb-4">
            <p className="jd-text-red-300 jd-text-sm">{error}</p>
          </div>
        )}
        
        {/* Current step content */}
        {children}
      </CardContent>
      
      {footer && (
        <CardFooter className="jd-flex jd-justify-between jd-border-t jd-border-gray-800 jd-pt-4">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};
