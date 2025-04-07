// src/extension/popup/components/LoadingState.tsx
import React from 'react';
import { getMessage } from '@/core/utils/i18n';

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">
        {getMessage('loadingTools')}
      </p>
    </div>
  );
}