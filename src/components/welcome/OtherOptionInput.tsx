
// src/extension/welcome/onboarding/components/OtherOptionInput.tsx
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface OtherOptionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const OtherOptionInput: React.FC<OtherOptionInputProps> = ({
  value,
  onChange,
  placeholder = 'Please specify...'
}) => {
  return (
    <div className="jd-mt-2 jd-ml-6">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="jd-bg-gray-800 jd-border-gray-700 jd-text-white focus:jd-border-blue-500 jd-rounded-md jd-p-2 jd-text-sm jd-resize-none"
        rows={3}
      />
    </div>
  );
};