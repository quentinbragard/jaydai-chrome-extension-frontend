// src/ui/components/EmptyState/EmptyState.tsx

import React from 'react';
import { cn } from '@/core/utils/classNames';

export interface EmptyStateProps {
  /**
   * Icon to display in the empty state
   */
  icon?: React.ReactNode;
  
  /**
   * Main title text
   */
  title: string;
  
  /**
   * Optional description text
   */
  description?: string;
  
  /**
   * Optional action component (usually a button)
   */
  action?: React.ReactNode;
  
  /**
   * Optional additional content
   */
  children?: React.ReactNode;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
  
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * EmptyState component for displaying when there's no content
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  children,
  className,
  size = 'md',
}) => {
  // Sizing classes
  const sizeClasses = {
    sm: 'jd-py-4 jd-px-3',
    md: 'jd-py-8 jd-px-4',
    lg: 'jd-py-12 jd-px-6',
  };
  
  // Icon size classes
  const iconSizeClasses = {
    sm: 'jd-h-8 jd-w-8',
    md: 'jd-h-12 jd-w-12',
    lg: 'jd-h-16 jd-w-16',
  };
  
  // Text size classes
  const titleSizeClasses = {
    sm: 'jd-text-sm',
    md: 'jd-text-base',
    lg: 'jd-text-lg',
  };
  
  const descriptionSizeClasses = {
    sm: 'jd-text-xs',
    md: 'jd-text-sm',
    lg: 'jd-text-base',
  };
  
  return (
    <div className={cn(
      'jd-flex jd-flex-col jd-items-center jd-justify-center jd-text-center',
      sizeClasses[size],
      className
    )}>
      {icon && (
        <div className="jd-mb-4">
          {React.isValidElement(icon) ? 
            React.cloneElement(icon as React.ReactElement, { 
              className: cn(iconSizeClasses[size], 'jd-text-muted-foreground/40', (icon as React.ReactElement).props.className)
            }) : 
            icon
          }
        </div>
      )}
      
      <h3 className={cn('jd-font-medium', titleSizeClasses[size])}>
        {title}
      </h3>
      
      {description && (
        <p className={cn('jd-text-muted-foreground jd-mt-1', descriptionSizeClasses[size])}>
          {description}
        </p>
      )}
      
      {action && (
        <div className="jd-mt-4">
          {action}
        </div>
      )}
      
      {children && (
        <div className="jd-mt-4 jd-w-full">
          {children}
        </div>
      )}
    </div>
  );
};

export default EmptyState;