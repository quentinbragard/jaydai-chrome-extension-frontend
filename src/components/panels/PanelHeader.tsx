// src/components/panels/PanelHeader.tsx
import React, { ReactNode } from 'react';
import { Button } from "@/components/ui/button"; 
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/core/utils/classNames";
import { useThemeDetection } from "@/hooks/useThemeDetection";

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
  const isDarkMode = useThemeDetection();
  
  return (
    <div className={cn(
      "jd-flex jd-items-center jd-justify-between jd-p-2 jd-border-b jd-rounded-t-md",
      "jd-bg-header", 
      className
    )}>
      {/* Left Section */}
      <div className="jd-flex jd-items-center jd-gap-2">
        {/* Back Button */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
          >
            <ArrowLeft className="jd-h-4 jd-w-4" />
          </Button>
        )}

        {/* Icon and Title/Logo */}
        <span className="jd-font-semibold jd-text-sm jd-flex jd-items-center">
          {Icon && <Icon className="jd-h-5 jd-w-5 jd-mr-2" />}
          {title ? (
            title
          ) : (
            <img 
              src={isDarkMode ? darkLogo : lightLogo}
              alt={isDarkMode ? "Jaydai Logo Dark" : "Jaydai Logo Light"}
              className="jd-h-6 jd-pl-2"
            />
          )}
        </span>
        {leftExtra}
      </div>

      {/* Right Section */}
      <div className="jd-flex jd-items-center jd-gap-2">
        {extra}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="jd-h-4 jd-w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PanelHeader;