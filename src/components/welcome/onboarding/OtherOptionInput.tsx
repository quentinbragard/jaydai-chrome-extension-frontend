// src/components/welcome/OtherOptionInput.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';

interface OtherOptionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const OtherOptionInput: React.FC<OtherOptionInputProps> = ({
  value,
  onChange,
  placeholder = getMessage('pleaseSpecify', undefined, 'Please specify...')
}) => {
  return (
    <motion.div 
      className="jd-mt-2 jd-ml-6"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.3 }}
    >
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="jd-bg-gray-800 jd-border-gray-700 jd-text-white focus:jd-border-blue-500 jd-rounded-md jd-p-2 jd-text-sm jd-resize-none jd-transition-colors jd-duration-200"
        rows={3}
      />
    </motion.div>
  );
};

