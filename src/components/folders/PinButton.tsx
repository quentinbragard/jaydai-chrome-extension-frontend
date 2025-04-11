// src/components/folders/PinButton.tsx
import React from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';

interface PinButtonProps {
  isPinned: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Pin/unpin button component with direct styling to avoid CSS specificity issues
 */
export function PinButton({
  isPinned,
  onClick,
  className = '',
  disabled = false
}: PinButtonProps) {
  // Handle click with stop propagation to prevent expanding/collapsing folder
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  // Create a unique CSS class for this component to avoid specificity issues
  const pinnedStarClass = "pin-button-star-pinned";

  // Add the class to the document if it doesn't exist
  React.useEffect(() => {
    // Only run in the browser
    if (typeof document === "undefined") return;

    // Check if the style already exists
    if (!document.getElementById("pin-button-style")) {
      const style = document.createElement("style");
      style.id = "pin-button-style";
      style.innerHTML = `
        .${pinnedStarClass} {
          fill: #f59e0b !important;
          color: #f59e0b !important;
        }
        button:has(.${pinnedStarClass}) {
          color: #f59e0b !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`jd-h-6 jd-w-6 jd-p-0 jd-flex-shrink-0 ${
        isPinned ? 'jd-text-yellow-500' : 'jd-text-muted-foreground jd-opacity-70 hover:jd-opacity-100'
      } ${className}`}
      onClick={handleClick}
      title={isPinned ? getMessage('unpin_folder', undefined, 'Unpin folder') : getMessage('pin_folder', undefined, 'Pin folder')}
      disabled={disabled}
      style={isPinned ? { color: '#f59e0b' } : undefined}
    >
      <Star 
        className={`jd-h-4 jd-w-4 ${isPinned ? pinnedStarClass : ''}`}
        style={isPinned ? { fill: '#f59e0b', color: '#f59e0b' } : undefined}
      />
    </Button>
  );
}