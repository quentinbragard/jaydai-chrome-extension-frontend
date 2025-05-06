// src/extension/welcome/onboarding/steps/ReferralStep.tsx
import React, { useState } from 'react';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { OnboardingData } from '../OnboardingFlow';

// Components
import { RadioGroup } from '@/components/ui/radio-group';
import { OnboardingOption } from '@/components/welcome/OnboardingOption';
import { OnboardingActions } from '@/components/welcome/OnboardingActions';
import { OtherOptionInput } from '@/components/welcome/OtherOptionInput';

// Referral sources
const REFERRAL_SOURCES = [
  { value: 'search', label: 'Search Engine (Google, Bing, etc.)' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'friend', label: 'Friend or Colleague' },
  { value: 'blog', label: 'Blog or Article' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'ad', label: 'Advertisement' },
  { value: 'store', label: 'Chrome Web Store' },
  { value: 'other', label: 'Other' }
];

interface ReferralStepProps {
  initialData: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const ReferralStep: React.FC<ReferralStepProps> = ({ 
  initialData, 
  onNext, 
  onBack,
  isSubmitting
}) => {
  // Local state for referral source
  const [referralSource, setReferralSource] = useState<string | null>(
    initialData.signup_source || null
  );
  
  // State for "Other" text input
  const [otherSource, setOtherSource] = useState<string>(
    initialData.other_source || ''
  );
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Handle next button click with validation
  const handleNext = () => {
    if (!referralSource) {
      setError(getMessage('selectReferralSource', undefined, 'Please select how you heard about us'));
      return;
    }
    
    // If "Other" is selected but no details are provided
    if (referralSource === 'other' && otherSource.trim() === '') {
      setError(getMessage('specifyOtherSource', undefined, 'Please specify how you heard about us'));
      return;
    }
    
    // Track step completion
    trackEvent(EVENTS.ONBOARDING_STEP_COMPLETED, {
      step: 'referral',
      signup_source: referralSource
    });
    
    // Pass the data up to the parent
    onNext({
      signup_source: referralSource,
      other_source: referralSource === 'other' ? otherSource : null
    });
  };
  
  return (
    <div className="jd-space-y-6">
      <div className="jd-text-center jd-mb-8">
        <h3 className="jd-text-xl jd-font-medium jd-text-white jd-mb-2">
          {getMessage('howDidYouHear', undefined, 'How did you hear about us?')}
        </h3>
        <p className="jd-text-gray-400 jd-text-sm">
          {getMessage('referralHelp', undefined, 'This helps us understand how people discover our extension')}
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="jd-bg-red-900/30 jd-border jd-border-red-700/50 jd-rounded-md jd-p-3 jd-mb-4">
          <p className="jd-text-red-300 jd-text-sm">{error}</p>
        </div>
      )}
      
      {/* Referral sources */}
      <RadioGroup
        value={referralSource || ''}
        onValueChange={(value) => {
          setReferralSource(value);
          if (error) setError(null);
        }}
        className="jd-space-y-3"
      >
        {REFERRAL_SOURCES.map((source) => (
          <OnboardingOption 
            key={source.value}
            value={source.value}
            label={source.label}
            groupValue={referralSource}
            onChange={(value) => {
              setReferralSource(value);
              if (error) setError(null);
            }}
          />
        ))}
      </RadioGroup>
      
      {/* Other source input */}
      {referralSource === 'other' && (
        <OtherOptionInput
          value={otherSource}
          onChange={setOtherSource}
          placeholder={getMessage('specifySource', undefined, 'Please tell us how you heard about us...')}
        />
      )}
      
      {/* Action Buttons */}
      <OnboardingActions 
        onNext={handleNext}
        onBack={onBack}
        isSubmitting={isSubmitting}
        isLastStep={true}
      />
    </div>
  );
};

export default ReferralStep;

