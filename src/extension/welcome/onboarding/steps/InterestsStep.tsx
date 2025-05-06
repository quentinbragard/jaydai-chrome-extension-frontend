// src/components/onboarding/steps/InterestsStep.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';
import { OnboardingData } from '../OnboardingFlow';
import { trackEvent, EVENTS } from '@/utils/amplitude';

// Interests options
const INTERESTS = [
  { value: 'productivity', label: 'Productivity' },
  { value: 'writing', label: 'Writing & Content Creation' },
  { value: 'coding', label: 'Coding & Development' },
  { value: 'data_analysis', label: 'Data Analysis' },
  { value: 'research', label: 'Research' },
  { value: 'creativity', label: 'Creative Work' },
  { value: 'learning', label: 'Learning & Education' },
  { value: 'marketing', label: 'Marketing & SEO' },
  { value: 'email', label: 'Email Drafting' },
  { value: 'summarizing', label: 'Document Summarization' },
  { value: 'brainstorming', label: 'Brainstorming' },
  { value: 'critical_thinking', label: 'Critical Thinking & Analysis' },
  { value: 'customer_support', label: 'Customer Support' },
  { value: 'decision_making', label: 'Decision Making' },
  { value: 'language_learning', label: 'Language Learning' }
];

interface InterestsStepProps {
  initialData: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export const InterestsStep: React.FC<InterestsStepProps> = ({ 
  initialData, 
  onNext, 
  onBack 
}) => {
  // Local state for selected interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    initialData.interests || []
  );
  
  // Validation state
  const [error, setError] = useState<string | null>(null);
  
  // Minimum required interests
  const MIN_INTERESTS = 2;
  
  // Handle interest selection toggle
  const toggleInterest = (value: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(value)) {
        return prev.filter(i => i !== value);
      } else {
        return [...prev, value];
      }
    });
    
    // Clear error when user makes changes
    if (error) {
      setError(null);
    }
  };
  
  // Handle next button click with validation
  const handleNext = () => {
    if (selectedInterests.length < MIN_INTERESTS) {
      setError(getMessage(
        'minInterestsRequired',
        [MIN_INTERESTS.toString()],
        `Please select at least ${MIN_INTERESTS} interests`
      ));
      return;
    }
    
    // Track step completion
    trackEvent(EVENTS.ONBOARDING_STEP_COMPLETED, {
      step: 'interests',
      interests_count: selectedInterests.length,
      interests: selectedInterests.join(',')
    });
    
    // Pass the data up to the parent
    onNext({
      interests: selectedInterests
    });
  };
  
  // Handle back button click
  const handleBack = () => {
    onBack();
  };
  
  return (
    <div className="jd-space-y-6">
      <div className="jd-text-center jd-mb-8">
        <h3 className="jd-text-xl jd-font-medium jd-text-white jd-mb-2">
          {getMessage('selectInterests', undefined, 'Select your interests')}
        </h3>
        <p className="jd-text-gray-400 jd-text-sm">
          {getMessage('interestsHelp', undefined, 'Choose areas where you want AI to assist you')}
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="jd-bg-red-900/30 jd-border jd-border-red-700/50 jd-rounded-md jd-p-3 jd-mb-4">
          <p className="jd-text-red-300 jd-text-sm">{error}</p>
        </div>
      )}
      
      {/* Interests grid */}
      <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-4">
        {INTERESTS.map((interest) => (
          <div
            key={interest.value}
            className={`
              jd-flex jd-items-center jd-space-x-2 jd-rounded-md jd-p-3 jd-transition-colors jd-duration-200
              ${selectedInterests.includes(interest.value) 
                ? 'jd-bg-blue-900/30 jd-border jd-border-blue-700/50' 
                : 'jd-bg-gray-800 jd-border jd-border-gray-700 hover:jd-border-gray-600'}
            `}
          >
            <Checkbox
              id={`interest-${interest.value}`}
              checked={selectedInterests.includes(interest.value)}
              onCheckedChange={() => toggleInterest(interest.value)}
              className="jd-data-[state=checked]:jd-bg-blue-600 jd-data-[state=checked]:jd-text-white"
            />
            <Label
              htmlFor={`interest-${interest.value}`}
              className="jd-text-sm jd-font-medium jd-text-white jd-cursor-pointer jd-flex-grow"
            >
              {interest.label}
            </Label>
          </div>
        ))}
      </div>
      
      {/* Selected count */}
      <div className="jd-text-sm jd-text-gray-400 jd-mt-4">
        {getMessage(
          'selectedCount',
          [selectedInterests.length.toString(), MIN_INTERESTS.toString()],
          `Selected: ${selectedInterests.length} (minimum: ${MIN_INTERESTS})`
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="jd-flex jd-justify-between jd-pt-4">
        <Button 
          onClick={handleBack}
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
          {getMessage('nextStep', undefined, 'Next Step')}
          <ArrowRight className="jd-ml-2 jd-h-4 jd-w-4" />
        </Button>
      </div>
    </div>
  );
};

export default InterestsStep;