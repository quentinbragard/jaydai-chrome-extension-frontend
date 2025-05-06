// src/components/onboarding/OnboardingFlow.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StepIndicator } from './StepIndicator';
import { JobInfoStep } from './steps/JobInfoStep';
import { InterestsStep } from './steps/InterestsStep';
import { ReferralStep } from './steps/ReferralStep';
import { CompletionStep } from './steps/CompletionStep';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { userApi } from '@/services/api/UserApi';
import { User } from '@/types';
export interface OnboardingData {
  job_type: string | null;
  job_industry: string | null;
  job_seniority: string | null;
  interests: string[];
  signup_source: string | null;
}

export interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
  user: User | null;
}

// Multi-step onboarding flow component
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip, user }) => {
  // Track the current step
  const [currentStep, setCurrentStep] = useState(0);
  
 
  
  // Combined form data from all steps
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    job_type: null,
    job_industry: null,
    job_seniority: null,
    interests: [],
    signup_source: null
  });
  
  // Loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Total number of steps
  const totalSteps = 4; // 3 input steps + completion step
  
  // Step titles for the progress indicator
  const stepTitles = [
    getMessage('onboardingStepJob', undefined, 'Your Job'),
    getMessage('onboardingStepInterests', undefined, 'Interests'),
    getMessage('onboardingStepReferral', undefined, 'How You Found Us'),
    getMessage('onboardingStepComplete', undefined, 'Complete')
  ];
  
  // Handle advancing to the next step
  const handleNextStep = async (stepData: Partial<OnboardingData>) => {
    // Merge the new data with existing data
    const updatedData = { ...onboardingData, ...stepData };
    setOnboardingData(updatedData);
    
    // If it's the last input step, submit the data
    if (currentStep === totalSteps - 2) {
      await handleSubmit(updatedData);
    } else {
      // Otherwise, move to the next step
      setCurrentStep(prev => prev + 1);
    }
  };
  
  // Handle going back to the previous step
  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };
  
  // Submit final data to the backend
  const handleSubmit = async (data: OnboardingData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Submit onboarding data to the backend
      const result = await userApi.saveUserMetadata(data);
      
      if (result.success) {
        // Track completion event with Amplitude
        trackEvent(EVENTS.ONBOARDING_COMPLETED, {
          user_id: user?.id,
          job_type: data.job_type,
          job_industry: data.job_industry,
          interests_count: data.interests.length
        });
        
        // Move to completion step
        setCurrentStep(totalSteps - 1);
      } else {
        throw new Error(result.message || 'Failed to save onboarding data');
      }
    } catch (err) {
      console.error('Onboarding submission error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during onboarding');
      
      // Track error event
      trackEvent(EVENTS.ONBOARDING_ERROR, {
        user_id: user?.id,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle skipping the onboarding
  const handleSkip = () => {
    trackEvent(EVENTS.ONBOARDING_SKIPPED, {
      user_id: user?.id,
      step: currentStep
    });
    
    if (onSkip) {
      onSkip();
    }
  };
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <JobInfoStep 
            initialData={onboardingData}
            onNext={handleNextStep}
          />
        );
      case 1:
        return (
          <InterestsStep
            initialData={onboardingData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
          />
        );
      case 2:
        return (
          <ReferralStep
            initialData={onboardingData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
          />
        );
      case 3:
        return (
          <CompletionStep
            onComplete={onComplete}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <Card className="jd-w-full jd-max-w-3xl jd-mx-auto jd-bg-gray-900 jd-border-gray-800">
      <CardHeader>
        <CardTitle className="jd-text-2xl jd-font-heading jd-text-white">
          {getMessage('onboardingTitle', undefined, 'Complete Your Profile')}
        </CardTitle>
        <CardDescription className="jd-text-gray-300">
          {getMessage('onboardingDescription', undefined, 'This helps us personalize your experience and provide relevant templates')}
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
        {renderStep()}
      </CardContent>
      
      {/* Only show skip option in the first three steps */}
      {currentStep < totalSteps - 1 && (
        <CardFooter className="jd-flex jd-justify-between jd-border-t jd-border-gray-800 jd-pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="jd-text-gray-400 hover:jd-text-white"
            disabled={isSubmitting}
          >
            {getMessage('skipForNow', undefined, 'Skip for now')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default OnboardingFlow;