// src/components/panels/TemplatesPanel/components/LoadingState.tsx

import React from 'react';

interface LoadingStateProps {
  message?: string;
}

/**
 * Reusable loading state component
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading templates...'
}) => {
  return (
    <div className="py-8 text-center">
      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
      <p className="text-sm text-muted-foreground mt-2">
        {chrome.i18n.getMessage('loadingTemplates') || message}
      </p>
    </div>
  );
};

export default LoadingState;