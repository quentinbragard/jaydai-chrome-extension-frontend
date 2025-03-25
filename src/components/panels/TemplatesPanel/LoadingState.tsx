// src/components/templates/LoadingState.tsx
import { getMessage } from '@/core/utils/i18n';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * Loading state component for folders and templates
 */
export function LoadingState({
  message = 'Loading templates...',
  className = ''
}: LoadingStateProps) {
  return (
    <div className={`py-8 text-center ${className}`}>
      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
      <p className="text-sm text-muted-foreground mt-2">
        {getMessage('loadingTemplates', undefined, message)}
      </p>
    </div>
  );
}