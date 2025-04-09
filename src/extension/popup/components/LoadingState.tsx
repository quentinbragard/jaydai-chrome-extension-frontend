// src/extension/popup/components/LoadingState.tsx
import React from 'react';
import { getMessage } from '@/core/utils/i18n';

export const LoadingState: React.FC = () => {
  return (
    <div className="jd-w-80 jd-bg-gradient-to-b jd-from-background jd-to-background/90 jd-text-foreground jd-flex jd-flex-col jd-items-center jd-justify-center jd-h-64 jd-p-4 jd-space-y-4">
      <div className="jd-relative">
        <div className="jd-spinner">
          <div className="jd-double-bounce1"></div>
          <div className="jd-double-bounce2"></div>
        </div>
        <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-blue-500/20 jd-to-indigo-500/20 jd-blur-xl jd-rounded-full"></div>
      </div>
      <div className="jd-flex jd-flex-col jd-items-center jd-space-y-2">
        <p className="jd-text-sm jd-animate-pulse">{getMessage('loadingTools', undefined, 'Loading your AI tools')}</p>
        <div className="jd-w-16 jd-h-1 jd-bg-muted jd-rounded-full jd-overflow-hidden">
          <div className="jd-h-full jd-bg-gradient-to-r jd-from-blue-500 jd-to-indigo-500 jd-w-1/2 jd-animate-[gradient-shift_1s_ease_infinite]"></div>
        </div>
      </div>
    </div>
  );
};