// src/components/common/PinButton.tsx
import React, { memo } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/classNames';

interface PinButtonProps {
  isPinned: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
  title?: string;
}

/**
 * Reusable pin/unpin button component used for folders and templates
 */
export const PinButton = memo(function PinButton({
  isPinned,
  onClick,
  className = '',
  disabled = false,
  title
}: PinButtonProps) {
  // Handle click with stop propagation to prevent expanding/collapsing folder
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'h-6 w-6 p-0 flex-shrink-0',
        isPinned 
          ? 'text-yellow-500' 
          : 'text-muted-foreground opacity-70 hover:opacity-100',
        className
      )}
      onClick={handleClick}
      title={title || (isPinned ? 'Unpin' : 'Pin')}
      disabled={disabled}
    >
      <Star className={`h-4 w-4 ${isPinned ? 'fill-yellow-500' : ''}`} />
    </Button>
  );
});

export default PinButton;