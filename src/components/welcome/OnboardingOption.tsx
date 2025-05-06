// src/extension/welcome/onboarding/components/OnboardingOption.tsx
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface OnboardingOptionProps {
  value: string;
  label: string;
  groupValue: string | null;
  onChange: (value: string) => void;
  className?: string;
}

export const OnboardingOption: React.FC<OnboardingOptionProps> = ({
  value,
  label,
  groupValue,
  onChange,
  className = ''
}) => {
  const isSelected = groupValue === value;
  
  return (
    <div
      className={`
        jd-flex jd-items-center jd-space-x-2 jd-rounded-md jd-p-3 jd-transition-colors jd-duration-200 jd-cursor-pointer
        ${isSelected 
          ? 'jd-bg-blue-900/30 jd-border jd-border-blue-700/50 jd-shadow-md' 
          : 'jd-bg-gray-800 jd-border jd-border-gray-700 hover:jd-border-gray-600 hover:jd-bg-gray-800/80'}
        ${className}
      `}
      onClick={() => onChange(value)}
    >
      <RadioGroupItem
        id={`option-${value}`}
        value={value}
        checked={isSelected}
        className="jd-text-blue-600"
      />
      <Label
        htmlFor={`option-${value}`}
        className="jd-text-sm jd-font-medium jd-text-white jd-cursor-pointer jd-flex-grow"
      >
        {label}
      </Label>
    </div>
  );
};

