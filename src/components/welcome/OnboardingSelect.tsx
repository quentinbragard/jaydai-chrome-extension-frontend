// src/extension/welcome/onboarding/components/OnboardingSelect.tsx
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SelectOption {
  value: string;
  label: string;
}

interface OnboardingSelectProps {
  id: string;
  label: string;
  placeholder: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
}

export const OnboardingSelect: React.FC<OnboardingSelectProps> = ({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  required = false,
  error = false,
  errorMessage
}) => {
  return (
    <div className="jd-space-y-2">
      <Label 
        htmlFor={id} 
        className={`jd-text-sm jd-font-medium ${error ? 'jd-text-red-400' : 'jd-text-gray-200'}`}
      >
        {label} {required && '*'}
      </Label>
      <Select
        value={value || ''}
        onValueChange={onChange}
      >
        <SelectTrigger 
          id={id}
          className={`jd-w-full jd-bg-gray-800 jd-border-gray-700 jd-text-white ${error ? 'jd-border-red-400' : ''}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="jd-bg-gray-800 jd-border-gray-700">
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value} 
              className="jd-text-white hover:jd-bg-gray-700"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && errorMessage && (
        <p className="jd-text-red-400 jd-text-xs jd-mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

