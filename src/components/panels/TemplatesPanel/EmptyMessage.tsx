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
    <div className={`text-center py-2 text-xs text-muted-foreground px-2 ${className}`}>
      {children}
    </div>
  );
}