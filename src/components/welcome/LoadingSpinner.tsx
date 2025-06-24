// src/extension/welcome/components/LoadingSpinner.tsx
import React from 'react';
import { getMessage } from '@/core/utils/i18n';

interface LoadingSpinnerProps {
  message?: string;
  devInfo?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = getMessage('loading'),
  devInfo
}) => {
  return (
    <div className="jd-min-h-screen jd-bg-background jd-text-foreground jd-flex jd-items-center jd-justify-center jd-font-sans">
      <div className="jd-text-center">
        <div className="jd-spinner-welcome">
          <div className="jd-double-bounce1"></div>
          <div className="jd-double-bounce2"></div>
        </div>
        <p className="jd-text-gray-300 jd-mt-4 jd-animate-pulse">
          {getMessage('loading', undefined, message)}
        </p>
        {/* Add more detailed status for development */}
        {process.env.NODE_ENV === 'development' && devInfo && 
          <p className="jd-text-xs jd-text-gray-500 jd-mt-2">{devInfo}</p>
        }
      </div>
    </div>
  );
};
