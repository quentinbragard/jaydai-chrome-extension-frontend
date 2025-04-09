// src/components/panels/PanelHeader.tsx

import React, { ReactNode } from 'react';
import { Button } from "@/components/ui/button"; // Assuming this component adapts or you override styles
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/core/utils/classNames";
// import { useTheme } from 'next-themes'; // <-- REMOVE THIS LINE

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
 * Standardized header component for panels using Tailwind CSS with 'jd-' prefix
 * and class-based dark mode ('jd-dark:').
 * Assumes a parent element within the Shadow DOM has the 'dark' class applied when dark mode is active.
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
  // Fetching logos dynamically - this is fine
  const darkLogo = chrome.runtime.getURL('images/full-logo-white.png');
  const lightLogo = chrome.runtime.getURL('images/full-logo-dark.png');

  return (
    <div className={cn(
      "jd-flex jd-items-center jd-justify-between jd-p-2 jd-border-b",
      // Base (light mode) styles
      "jd-bg-gray-100 jd-text-gray-900",
      // Dark mode styles
      "jd-dark:jd-bg-gray-800 jd-dark:jd-text-white",
      "jd-rounded-t-md", // Applied in both modes
      className // Allow overriding via props
    )}>
      {/* Left Section */}
      <div className="jd-flex jd-items-center jd-gap-2">
        {/* Back Button */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className={cn(
                "jd-h-8 jd-w-8 jd-p-0 jd-mr-2",
                // Base (light) styles
                "jd-text-gray-900 jd-hover:jd-bg-gray-200",
                // Dark mode styles
                "jd-dark:jd-text-white jd-dark:jd-hover:jd-bg-gray-700"
            )}
          >
            <ArrowLeft className="jd-h-4 jd-w-4" />
          </Button>
        )}

        {/* Icon and Title/Logo */}
        <span className="jd-font-semibold jd-text-sm jd-flex jd-items-center">
          {Icon && <Icon className="jd-h-4 jd-w-4 jd-mr-2" />}
          {title ? (
            title // Display title if provided
          ) : (
            // Display logos if no title
            <>
              {/* Dark Logo: Hidden by default, shown only in dark mode */}
              <img
                src={darkLogo}
                alt="Jaydai Logo Dark" // More specific alt text
                className="jd-h-6 jd-hidden jd-dark:jd-block" // jd-hidden hides it, jd-dark:jd-block shows it in dark mode
              />
              {/* Light Logo: Shown by default, hidden in dark mode */}
              <img
                src={lightLogo}
                alt="Jaydai Logo Light" // More specific alt text
                className="jd-h-6 jd-block jd-dark:jd-hidden" // jd-block shows it, jd-dark:jd-hidden hides it in dark mode
              />
            </>
          )}
        </span>
        {/* Optional content injected to the left */}
        {leftExtra}
      </div>

      {/* Right Section */}
      <div className="jd-flex jd-items-center jd-gap-2">
        {/* Optional extra content injected to the right */}
        {extra}
        {/* Close Button */}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
             className={cn(
                "jd-h-8 jd-w-8 jd-p-0",
                // Base (light) styles
                "jd-text-gray-900 jd-hover:jd-bg-gray-200",
                // Dark mode styles
                "jd-dark:jd-text-white jd-dark:jd-hover:jd-bg-gray-700"
            )}
          >
            <X className="jd-h-4 jd-w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PanelHeader;