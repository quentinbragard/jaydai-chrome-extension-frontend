// src/components/welcome/onboarding/OnboardingFlow.tsx - Updated

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS, setUserProperties } from '@/utils/amplitude';
import { apiClient } from '@/services/api/ApiClient';
import { User } from '@/types';
import { useSubscriptionStatus } from '@/hooks/subscription/useSubscriptionStatus';

// Onboarding steps
import { JobInfoStep } from './steps/JobInfoStep';
import { InterestsStep } from './steps/InterestsStep';
import { ReferralStep } from './steps/ReferralStep';
import { CompletionStep } from './steps/CompletionStep';
import { PaymentStep } from './steps/PaymentStep';

// Components
import { OnboardingCard } from '@/components/welcome/onboarding/OnboardingCard';

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
  user: User | null;
}

interface FolderRecommendationResult {
  success: boolean;
  new_folders: number[];
  total_recommended: number[];
  total_pinned: number[];
  explanation: {
    starter_pack: number[];
    professional_role: number[];
    industry: number[];
    seniority: number[];
    interests: number[];
  };
  message: string;
}

// Multi-step onboarding flow component with smart folder assignment
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ 
  onComplete, 
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
  
  // Success state for folder recommendations
  const [folderRecommendations, setFolderRecommendations] = useState<FolderRecommendationResult | null>(null);
  
  // Subscription status to determine if payment step is needed
  const { isActive: hasActiveSubscription } = useSubscriptionStatus();

  // Total number of steps depends on subscription
  const totalSteps = hasActiveSubscription ? 4 : 5; // 3 input steps + completion step + optional payment step
  
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
      window.scrollTo(0, 0); // Scroll to the top of the page
    }
  };
  
  // Handle going back to the previous step
  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
    window.scrollTo(0, 0); // Scroll to the top of the page
  };
  
  // Submit final data to the backend with new onboarding completion endpoint
  const handleSubmit = async (data: OnboardingData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare data for submission
      const submissionData = {
        job_type: data.job_type,
        job_industry: data.job_industry,
        job_seniority: data.job_seniority,
        job_other_details: data.job_other_details,
        interests: data.interests,
        other_interests: data.other_interests,
        signup_source: data.signup_source,
        other_source: data.other_source
      };
      
      // Submit onboarding data to the new completion endpoint
      const result = await apiClient.request('/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify(submissionData)
      });
      
      if (result.success) {
        // Store folder recommendations for display
        setFolderRecommendations(result.folder_recommendations);
        
        // Set Amplitude user properties
        setUserProperties({
          onboarding_date: new Date().toISOString(),
          job_type: data.job_type,
          job_industry: data.job_industry,
          job_seniority: data.job_seniority,
          job_other_details: data.job_other_details,
          interests: data.interests,
          other_interests: data.other_interests,
          signup_source: data.signup_source,
          total_pinned_folders: result.folder_recommendations?.total_pinned?.length || 0,
          new_folders_from_onboarding: result.total_new_folders || 0
        });
        
        // Track completion event with Amplitude
        trackEvent(EVENTS.ONBOARDING_COMPLETED, {
          user_id: user?.id,
          job_type: data.job_type,
          job_industry: data.job_industry,
          interests_count: data.interests.length,
          new_folders_assigned: result.total_new_folders || 0,
          total_folders_pinned: result.folder_recommendations?.total_pinned?.length || 0
        });
        
        
        // Move to completion step
        setCurrentStep(totalSteps - 1);
      } else {
        throw new Error(
          result.message ||
            getMessage('failedToSaveOnboardingData', undefined, 'Failed to save onboarding data')
        );
      }
    } catch (err) {
      console.error('Onboarding submission error:', err);
      setError(
        err instanceof Error
          ? err.message
          : getMessage('onboardingError', undefined, 'An error occurred during onboarding')
      );
      
      // Track error event
      trackEvent(EVENTS.ONBOARDING_ERROR, {
        user_id: user?.id,
        error: err instanceof Error
          ? err.message
          : getMessage('unknownError')
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle skipping the onboarding
  const handleSkip = () => {
    // Track the skip event
    trackEvent(EVENTS.ONBOARDING_SKIPPED, {
      user_id: user?.id,
      step: currentStep
    });
    
    // If we're on the last input step, we need special handling
    if (currentStep === totalSteps - 2) {
      // For the last step before completion, we need to submit with empty data
      // Pass empty data for the current step
      const emptyStepData = getEmptyDataForStep(currentStep);
      handleNextStep(emptyStepData);
    } else {
      // For any other step, just advance to the next step
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0); // Scroll to the top of the page
    }
  };
  
  // Helper function to get empty data structure for each step
  const getEmptyDataForStep = (step: number): Partial<OnboardingData> => {
    switch (step) {
      case 0: // Job info step
        return {
          job_type: null,
          job_industry: null,
          job_seniority: null,
          job_other_details: null
        };
      case 1: // Interests step
        return {
          interests: [],
          other_interests: null
        };
      case 2: // Referral step
        return {
          signup_source: null,
          other_source: null
        };
      default:
        return {};
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
        return hasActiveSubscription ? (
          <CompletionStep
            onComplete={onComplete}
            folderRecommendations={folderRecommendations}
          />
        ) : (
          <PaymentStep
            user={user}
            onComplete={onComplete}
            onBack={handlePreviousStep}
          />
        );
      case 4:
        return (
          <CompletionStep
            onComplete={onComplete}
            folderRecommendations={folderRecommendations}
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