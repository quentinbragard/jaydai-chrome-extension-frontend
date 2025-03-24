// src/components/panels/PanelHeader.tsx

import React, { ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/core/utils/classNames";
import { getMessage } from '@/core/utils/i18n';

interface PanelHeaderProps {
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
  extra?: ReactNode;
  leftExtra?: ReactNode;
}

/**
 * Standardized header component for all panels
 * Includes title, icon, back button and close button
 */
const PanelHeader: React.FC<PanelHeaderProps> = ({ 
  title,
  icon: Icon,
  showBackButton = false,
  onBack,
  onClose,
  className,
  extra,
  leftExtra
}) => {
  // Use getMessage helper for better i18n handling
  const displayTitle = getMessage(title || '', undefined, '');
  
  return (
    <div className={cn(
      "flex items-center justify-between p-2 border-b",
      "dark:bg-gray-800 dark:text-white bg-gray-100 text-gray-900 rounded-t-md",
      className
    )}>
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-8 w-8 p-0 mr-2 dark:text-white dark:hover:bg-gray-700 text-gray-900 hover:bg-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <span className="font-semibold text-sm flex items-center">
          {Icon && <Icon className="h-4 w-4 mr-2" />}
          {displayTitle}
        </span>
        {leftExtra}
      </div>
      
      <div className="flex items-center gap-2">
        {extra}
        {onClose && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0 dark:text-white dark:hover:bg-gray-700 text-gray-900 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PanelHeader;