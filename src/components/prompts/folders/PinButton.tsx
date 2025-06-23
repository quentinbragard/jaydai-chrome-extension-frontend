// src/components/prompts/folders/PinButton.tsx - Enhanced with better visual feedback
import React from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';
import { cn } from "@/core/utils/classNames";

interface PinButtonProps {
  isPinned: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function PinButton({
  isPinned,
  onClick,
  className = '',
  disabled = false,
  size = 'sm'
}: PinButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      disabled={disabled}
      title={isPinned 
        ? getMessage('unpin_folder', undefined, 'Unpin folder') 
        : getMessage('pin_folder', undefined, 'Pin folder')
      }
      className={cn(
        'jd-transition-all jd-duration-200',
        isPinned 
          ? 'jd-text-yellow-500 hover:jd-text-yellow-600' 
          : 'jd-text-muted-foreground jd-opacity-70 hover:jd-opacity-100 hover:jd-text-yellow-500',
        className
      )}
    >
      <Bookmark 
        className={cn(
          'jd-h-4 jd-w-4 jd-transition-all jd-duration-200',
          isPinned 
            ? 'jd-fill-yellow-500 jd-text-yellow-500 jd-scale-110' 
            : 'jd-hover:jd-fill-yellow-200'
        )} 
      />
    </Button>
  );
}