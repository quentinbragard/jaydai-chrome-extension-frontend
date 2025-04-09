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
    sm: 'jd-h-4 jd-w-4 jd-border-2',
    md: 'jd-h-8 jd-w-8 jd-border-3',
    lg: 'jd-h-12 jd-w-12 jd-border-4'
  };
  
  const spinnerClass = cn(
    'jd-animate-spin jd-rounded-full jd-border-transparent jd-border-t-primary jd-inline-block',
    sizeMap[size],
    className
  );
  
  const containerClass = cn(
    'jd-flex jd-flex-col jd-items-center jd-justify-center jd-gap-3',
    fullScreen ? 'jd-fixed jd-inset-0 jd-z-50 jd-bg-background/80 jd-backdrop-blur-sm' : 'jd-py-6'
  );
  
  return (
    <div className={containerClass}>
      <div className={spinnerClass} />
      {message && (
        <p className="jd-text-sm jd-text-muted-foreground jd-animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;