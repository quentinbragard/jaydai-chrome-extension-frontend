// src/extension/welcome/onboarding/OnboardingFlow.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { userApi } from '@/services/api/UserApi';
import { User } from '@/types';

// Onboarding steps
import { JobInfoStep } from './steps/JobInfoStep';
import { InterestsStep } from './steps/InterestsStep';
import { ReferralStep } from './steps/ReferralStep';
import { CompletionStep } from './steps/CompletionStep';

// Components
import { OnboardingCard } from '@/components/welcome/OnboardingCard';

export interface OnboardingData {
  job_type: string | null;
  job_industry: string | null;
  job_seniority: string | null;
  job_other_details?: string | null;
  interests: string[];
  other_interests?: string | null;
  signup_source: string | null;
  other_source?: string | null;
}

export interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
  user: User | null;
}

// Multi-step onboarding flow component
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ 
  onComplete, 
  onSkip, 
  user 
}) => {
  // Track the current step
  const [currentStep, setCurrentStep] = useState(0);
  
  // Combined form data from all steps
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    job_type: null,
    job_industry: null,
    job_seniority: null,
    job_other_details: null,
    interests: [],
    other_interests: null,
    signup_source: null,
    other_source: null
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
      // Prepare data for submission
      const submissionData = {
        ...data,
        // If job_type is 'other', include the other_details
        job_type: data.job_type === 'other' && data.job_other_details 
          ? `other:${data.job_other_details}` 
          : data.job_type,
        
        // If signup_source is 'other', include the other_source
        signup_source: data.signup_source === 'other' && data.other_source 
          ? `other:${data.other_source}` 
          : data.signup_source,
        
        // Add any other interests from the text input
        interests: data.other_interests 
          ? [...data.interests, `other:${data.other_interests}`] 
          : data.interests
      };
      
      // Submit onboarding data to the backend
      console.log('Submitting onboarding data:', submissionData);
      const result = await userApi.saveUserMetadata(submissionData);
      
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
            isSubmitting={isSubmitting}
          />
        );
      case 1:
        return (
          <InterestsStep
            initialData={onboardingData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
            isSubmitting={isSubmitting}
          />
        );
      case 2:
        return (
          <ReferralStep
            initialData={onboardingData}
            onNext={handleNextStep}
            onBack={handlePreviousStep}
            isSubmitting={isSubmitting}
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
  
  // Skip option footer - only for non-completion steps
  const renderFooter = () => {
    if (currentStep < totalSteps - 1) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="jd-text-gray-400 hover:jd-text-white jd-transition-colors"
          disabled={isSubmitting}
        >
          {getMessage('skipForNow', undefined, 'Skip for now')}
        </Button>
      );
    }
    return null;
  };
  
  return (
    <OnboardingCard
      currentStep={currentStep}
      totalSteps={totalSteps}
      stepTitles={stepTitles}
      error={error}
      footer={renderFooter()}
    >
      {renderStep()}
    </OnboardingCard>
  );
};

export default OnboardingFlow;