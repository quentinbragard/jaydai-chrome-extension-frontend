// src/components/panels/PanelHeader.tsx

import React, { ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/core/utils/classNames";
import { useTheme } from 'next-themes';

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
  const darkLogo = chrome.runtime.getURL('images/full-logo-white.png');
  const lightLogo = chrome.runtime.getURL('images/full-logo-dark.png');
  
  return (
    <div className={cn(
      "jd-flex jd-items-center jd-justify-between jd-p-2 jd-border-b",
      "jd-dark:jd-bg-gray-800 jd-dark:jd-text-white jd-bg-gray-100 jd-text-gray-900 jd-rounded-t-md",
      className
    )}>
      <div className="jd-flex jd-items-center jd-gap-2">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="jd-h-8 jd-w-8 jd-p-0 jd-mr-2 jd-dark:jd-text-white jd-dark:jd-hover:jd-bg-gray-700 jd-text-gray-900 jd-hover:jd-bg-gray-200"
          >
            <ArrowLeft className="jd-h-4 jd-w-4" />
          </Button>
        )}
        
        <span className="jd-font-semibold jd-text-sm jd-flex jd-items-center">
          {Icon && <Icon className="jd-h-4 jd-w-4 jd-mr-2" />}
          {title ? (
            title
          ) : (
            <>
              <img 
                src={darkLogo} 
                alt="Jaydai Logo" 
                className="jd-h-6 jd-hidden jd-dark:jd-block"
              />
              <img 
                src={lightLogo} 
                alt="Jaydai Logo" 
                className="jd-h-6 jd-block jd-dark:jd-hidden"
              />
            </>
          )}
        </span>
        {leftExtra}
      </div>
      
      <div className="jd-flex jd-items-center jd-gap-2">
        {extra}
        {onClose && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="jd-h-8 jd-w-8 jd-p-0 jd-dark:jd-text-white jd-dark:jd-hover:jd-bg-gray-700 jd-text-gray-900 jd-hover:jd-bg-gray-200"
          >
            <X className="jd-h-4 jd-w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PanelHeader;