// src/extension/welcome/components/Logo.tsx
import React from 'react';
import { getMessage } from '@/core/utils/i18n';

export const Logo: React.FC = () => {
  return (
    <div className="jd-logo-container jd-bg-gray-900 jd-border jd-border-gray-800 jd-mb-8">
      <img 
        src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//jaydai-extension-logo.png" 
        alt={getMessage('appName', undefined, 'Jaydai Logo')} 
        className="jd-w-16 jd-h-16 jd-object-contain"
      />
    </div>
  );
};