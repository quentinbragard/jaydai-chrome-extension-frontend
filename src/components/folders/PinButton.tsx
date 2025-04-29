// src/components/templates/PinButton.tsx
import React from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Keep using the Button
import { getMessage } from '@/core/utils/i18n';
import { cn } from "@/core/utils/classNames"; // Import cn

interface PinButtonProps {
  isPinned: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
}

export function PinButton({
  isPinned,
  onClick,
  className = '',
  disabled = false
}: PinButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  return (
    <button // Keep using the Button component
      onClick={handleClick}
      title={isPinned ? getMessage('unpin_folder', undefined, 'Unpin folder') : getMessage('pin_folder', undefined, 'Pin folder')}
      disabled={disabled}
    >
      {/* Star icon - CSS rule will now handle the fill color */}
      <Bookmark className={`jd-h-4 jd-w-4 ${isPinned ? 'jd-fill-yellow-500 jd-text-yellow-500' : ''}`} />
    </button>
  );
}