// src/extension/welcome/components/Footer.tsx
import React from 'react';
import { getMessage } from '@/core/utils/i18n';

export const Footer: React.FC = () => {
  return (
    <div className="jd-text-center jd-text-sm jd-text-gray-500 jd-font-sans">
      &copy; {new Date().getFullYear()} Archimind. {getMessage('allRightsReserved', undefined, 'All rights reserved')}
    </div>
  );
};
