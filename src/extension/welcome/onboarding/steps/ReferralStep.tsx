// src/components/onboarding/steps/ReferralStep.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';
import { OnboardingData } from '../OnboardingFlow';
import { trackEvent, EVENTS } from '@/utils/amplitude';

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
}

export const ReferralStep: React.FC<ReferralStepProps> = ({ 
  initialData, 
  onNext, 
  onBack 
}) => {
  // Local state for referral source
  const [referralSource, setReferralSource] = useState<string | null>(
    initialData.signup_source || null
  );
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Handle next button click with validation
  const handleNext = () => {
    if (!referralSource) {
      setError(getMessage('selectReferralSource', undefined, 'Please select how you heard about us'));
      return;
    }
    
    // Track step completion
    trackEvent(EVENTS.ONBOARDING_STEP_COMPLETED, {
      step: 'referral',
      signup_source: referralSource
    });
    
    // Pass the data up to the parent
    onNext({
      signup_source: referralSource
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
          <div
            key={source.value}
            className={`
              jd-flex jd-items-center jd-space-x-2 jd-rounded-md jd-p-3 jd-transition-colors jd-duration-200
              ${referralSource === source.value 
                ? 'jd-bg-blue-900/30 jd-border jd-border-blue-700/50' 
                : 'jd-bg-gray-800 jd-border jd-border-gray-700 hover:jd-border-gray-600'}
            `}
          >
            <RadioGroupItem
              id={`source-${source.value}`}
              value={source.value}
              className="jd-text-blue-600"
            />
            <Label
              htmlFor={`source-${source.value}`}
              className="jd-text-sm jd-font-medium jd-text-white jd-cursor-pointer jd-flex-grow"
            >
              {source.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      
      {/* Action Buttons */}
      <div className="jd-flex jd-justify-between jd-pt-4">
        <Button 
          onClick={onBack}
          variant="outline"
          className="jd-border-gray-700 jd-text-white hover:jd-bg-gray-800"
        >
          <ArrowLeft className="jd-mr-2 jd-h-4 jd-w-4" />
          {getMessage('back', undefined, 'Back')}
        </Button>
        
        <Button 
          onClick={handleNext} 
          className="jd-bg-blue-600 hover:jd-bg-blue-700 jd-text-white jd-font-heading"
        >
          {getMessage('complete', undefined, 'Complete')}
          <ArrowRight className="jd-ml-2 jd-h-4 jd-w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ReferralStep;