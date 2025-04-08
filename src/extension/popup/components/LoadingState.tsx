// src/extension/popup/components/LoadingState.tsx
import React from 'react';
import { getMessage } from '@/core/utils/i18n';

export const LoadingState: React.FC = () => {
  return (
    <div className="w-80 bg-gradient-to-b from-background to-background/90 text-foreground flex flex-col items-center justify-center h-64 p-4 space-y-4">
      <div className="relative">
        <div className="spinner">
          <div className="double-bounce1"></div>
          <div className="double-bounce2"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-xl rounded-full"></div>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <p className="text-sm animate-pulse">{getMessage('loadingTools', undefined, 'Loading your AI tools')}</p>
        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-1/2 animate-[gradient-shift_1s_ease_infinite]"></div>
        </div>
      </div>
    </div>
  );
};