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
    sm: 'py-4 px-3',
    md: 'py-8 px-4',
    lg: 'py-12 px-6',
  };
  
  // Icon size classes
  const iconSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };
  
  // Text size classes
  const titleSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  const descriptionSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      sizeClasses[size],
      className
    )}>
      {icon && (
        <div className="mb-4">
          {React.isValidElement(icon) ? 
            React.cloneElement(icon as React.ReactElement, { 
              className: cn(iconSizeClasses[size], 'text-muted-foreground/40', (icon as React.ReactElement).props.className)
            }) : 
            icon
          }
        </div>
      )}
      
      <h3 className={cn('font-medium', titleSizeClasses[size])}>
        {title}
      </h3>
      
      {description && (
        <p className={cn('text-muted-foreground mt-1', descriptionSizeClasses[size])}>
          {description}
        </p>
      )}
      
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
      
      {children && (
        <div className="mt-4 w-full">
          {children}
        </div>
      )}
    </div>
  );
};

export default EmptyState;