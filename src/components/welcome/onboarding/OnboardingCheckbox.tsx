import React from 'react';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface OnboardingCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const OnboardingCheckbox: React.FC<OnboardingCheckboxProps> = ({
  id,
  label,
  checked,
  onChange
}) => {
  return (
    <motion.div
      className={`
        jd-flex jd-items-center jd-space-x-2 jd-rounded-lg jd-p-3 jd-transition-colors jd-duration-200
        ${checked 
          ? 'jd-bg-blue-900/30 jd-border jd-border-blue-700/50 jd-shadow-lg jd-shadow-blue-500/10' 
          : 'jd-bg-gray-800 jd-border jd-border-gray-700 hover:jd-border-gray-600'}
      `}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="jd-data-[state=checked]:jd-bg-blue-600 jd-data-[state=checked]:jd-text-white jd-border-gray-600"
      />
      <Label
        htmlFor={id}
        className="jd-text-sm jd-font-medium jd-text-white jd-cursor-pointer jd-flex-grow"
      >
        {label}
      </Label>
    </motion.div>
  );
};