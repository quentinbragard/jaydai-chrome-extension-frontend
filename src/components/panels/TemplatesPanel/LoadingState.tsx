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
    <div className={`jd-py-8 jd-text-center ${className}`}>
      <div className="jd-animate-spin jd-h-5 jd-w-5 jd-border-2 jd-border-primary jd-border-t-transparent jd-rounded-full jd-mx-auto"></div>
      <p className="jd-text-sm jd-text-muted-foreground jd-mt-2">
        {getMessage('loadingTemplates', undefined, message)}
      </p>
    </div>
  );
}