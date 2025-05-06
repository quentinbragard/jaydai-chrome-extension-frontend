
// src/extension/welcome/components/ErrorDisplay.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { getMessage } from '@/core/utils/i18n';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  title = 'Initialization Error',
  message,
  onRetry
}) => {
  return (
    <div className="jd-min-h-screen jd-bg-background jd-text-foreground jd-flex jd-items-center jd-justify-center jd-font-sans">
      <div className="jd-text-center jd-max-w-md jd-mx-auto jd-p-6">
        <div className="jd-text-red-500 jd-mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="jd-h-12 jd-w-12 jd-mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="jd-text-2xl jd-font-bold jd-text-white jd-mb-4">
          {getMessage('initializationError', undefined, title)}
        </h1>
        <p className="jd-text-gray-300 jd-mb-6">
          {message}
        </p>
        {onRetry && (
          <Button 
            onClick={onRetry}
            className="jd-bg-blue-600 hover:jd-bg-blue-700"
          >
            {getMessage('tryAgain', undefined, 'Try Again')}
          </Button>
        )}
      </div>
    </div>
  );
};