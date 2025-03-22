// src/components/panels/TemplatesPanel/components/PinButton.tsx

import React from 'react';
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PinButtonProps {
  isPinned: boolean;
  onClick: () => Promise<void> | void;
  className?: string;
}

/**
 * Reusable pin button component with tooltip
 */
const PinButton: React.FC<PinButtonProps> = ({
  isPinned,
  onClick,
  className = ''
}) => {
  // Handle click with stop propagation to prevent expanding/collapsing folder
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 flex-shrink-0 ${isPinned ? 'text-yellow-500' : 'text-muted-foreground opacity-70 hover:opacity-100'} ${className}`}
            onClick={handleClick}
          >
            <Star className={`h-4 w-4 ${isPinned ? 'fill-yellow-500' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isPinned ? 'Unpin folder' : 'Pin folder'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PinButton;