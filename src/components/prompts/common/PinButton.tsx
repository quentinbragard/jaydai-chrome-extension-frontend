import React from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/classNames';
import { getMessage } from '@/core/utils/i18n';

interface PinButtonProps {
  type?: 'folder' | 'template';
  isPinned: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg' | 'xs';
}

export function PinButton({
  type = 'folder',
  isPinned,
  onClick,
  className = '',
  disabled = false,
  size = 'xs'
}: PinButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  const title = isPinned
    ? getMessage(
        type === 'folder' ? 'unpin_folder' : 'unpin_template',
        undefined,
        type === 'folder' ? 'Unpin folder' : 'Unpin template'
      )
    : getMessage(
        type === 'folder' ? 'pin_folder' : 'pin_template',
        undefined,
        type === 'folder' ? 'Pin folder' : 'Pin template'
      );

  const Icon = Bookmark;

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      disabled={disabled}
      title={title}
      className={cn(
        'jd-transition-all jd-duration-200',
        isPinned
          ? 'jd-text-yellow-500 hover:jd-text-yellow-600'
          : 'jd-text-muted-foreground jd-opacity-70 hover:jd-opacity-100 hover:jd-text-yellow-500',
        className
      )}
    >
      <Icon
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

