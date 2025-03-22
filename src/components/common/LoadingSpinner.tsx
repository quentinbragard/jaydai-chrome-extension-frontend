import React from 'react';
import { cn } from '@/core/utils/classNames';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
  fullScreen?: boolean;
}

/**
 * Generic loading spinner component with optional message
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  message,
  fullScreen = false
}) => {
  // Size classes
  const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  };
  
  const spinnerClass = cn(
    'animate-spin rounded-full border-transparent border-t-primary inline-block',
    sizeMap[size],
    className
  );
  
  const containerClass = cn(
    'flex flex-col items-center justify-center gap-3',
    fullScreen ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm' : 'py-6'
  );
  
  return (
    <div className={containerClass}>
      <div className={spinnerClass} />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;