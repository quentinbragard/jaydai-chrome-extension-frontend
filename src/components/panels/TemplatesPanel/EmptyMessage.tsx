// src/components/templates/EmptyMessage.tsx
import { ReactNode } from 'react';

interface EmptyMessageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Simple empty state message component
 */
export function EmptyMessage({
  children,
  className = ''
}: EmptyMessageProps) {
  return (
    <div className={`jd-text-center jd-py-2 jd-text-xs jd-text-muted-foreground jd-px-2 ${className}`}>
      {children}
    </div>
  );
}