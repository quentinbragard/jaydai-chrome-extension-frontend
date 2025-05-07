// src/extension/welcome/onboarding/steps/InterestsStep.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { OnboardingData } from '../OnboardingFlow';

// Components
import { OnboardingCheckbox } from '@/components/welcome/OnboardingCheckbox';
import { OnboardingActions } from '@/components/welcome/OnboardingActions';
import { OtherOptionInput } from '@/components/welcome/OtherOptionInput';

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
  { value: 'language_learning', label: 'Language Learning' },
  { value: 'other', label: 'Other' }
];

interface InterestsStepProps {
  initialData: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const InterestsStep: React.FC<InterestsStepProps> = ({ 
  initialData, 
  onNext, 
  onBack,
  isSubmitting
}) => {
  // Local state for selected interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    initialData.interests || []
  );
  
  // State for "Other" text input
  const [otherInterests, setOtherInterests] = useState<string>(
    initialData.other_interests || ''
  );
  
  // State to track if "Other" is selected
  const isOtherSelected = selectedInterests.includes('other');
  
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
    // If "Other" is selected but no details are provided
    if (isOtherSelected && otherInterests.trim() === '') {
      setError(getMessage(
        'otherInterestsRequired',
        undefined,
        'Please specify your other interests'
      ));
      return;
    }
    
    // Check minimum interests (including "other" if it has value)
    const effectiveCount = selectedInterests.length;
    
    if (effectiveCount < MIN_INTERESTS) {
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
      interests: selectedInterests,
      other_interests: isOtherSelected ? otherInterests : null
    });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="jd-space-y-6"
    >
      <div className="jd-text-center jd-mb-8">
        <motion.div 
          className="jd-inline-flex jd-items-center jd-justify-center jd-w-16 jd-h-16 jd-rounded-full jd-bg-indigo-500/10 jd-mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.1 
          }}
        >
          <Heart className="jd-h-8 jd-w-8 jd-text-indigo-400" />
        </motion.div>
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
      <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-4">        {INTERESTS.map((interest) => (
          <OnboardingCheckbox
            key={interest.value}
            id={`interest-${interest.value}`}
            label={interest.label}
            checked={selectedInterests.includes(interest.value)}
            onChange={() => toggleInterest(interest.value)}
          />
        ))}
      </div>
      
      {/* Other interests input */}
      {isOtherSelected && (
        <OtherOptionInput
          value={otherInterests}
          onChange={setOtherInterests}
          placeholder={getMessage('specifyOtherInterests', undefined, 'Please tell us about your other interests...')}
        />
      )}
      
      {/* Selected count */}
      <div className="jd-text-sm jd-text-gray-400 jd-mt-4">
        {getMessage(
          'selectedCount',
          [selectedInterests.length.toString(), MIN_INTERESTS.toString()],
          `Selected: ${selectedInterests.length} (minimum: ${MIN_INTERESTS})`
        )}
      </div>
      
      {/* Action Buttons */}
      <OnboardingActions 
        onNext={handleNext}
        onBack={onBack}
        isSubmitting={isSubmitting}
      />
    </motion.div>
  );
};

export default InterestsStep;

