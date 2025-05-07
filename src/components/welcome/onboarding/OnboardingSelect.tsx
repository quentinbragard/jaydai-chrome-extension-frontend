// src/components/welcome/OnboardingSelect.tsx
import React from 'react';
import { motion } from 'framer-motion';
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
    <motion.div 
      className="jd-space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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
          className={`jd-w-full jd-bg-gray-800/80 jd-border-gray-700 jd-text-white hover:jd-border-blue-500/50 jd-transition-colors jd-duration-200 ${error ? 'jd-border-red-400' : ''}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="!jd-bg-gray-700 jd-border-gray-700">
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value} 
              className="jd-text-white hover:jd-bg-gray-700 jd-cursor-pointer"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && errorMessage && (
        <motion.p 
          className="jd-text-red-400 jd-text-xs jd-mt-1"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {errorMessage}
        </motion.p>
      )}
    </motion.div>
  );
};

