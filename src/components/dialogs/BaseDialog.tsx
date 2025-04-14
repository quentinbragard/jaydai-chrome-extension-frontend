import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getMessage } from '@/core/utils/i18n';
import { cn } from "@/core/utils/classNames";

export interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Base Dialog component that all dialogs should extend
 * Supports 90% height with proper scrolling of content
 */
export const BaseDialog: React.FC<BaseDialogProps> = ({ 
  open, 
  onOpenChange,
  title,
  description,
  className,
  children 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "jd-w-full jd-max-w-7xl jd-max-h-[90vh] jd-overflow-hidden jd-bg-background jd-text-primary", 
          className
        )}
        // Remove stopPropagation to allow proper event bubbling for inputs
        // while still preventing dialog closure on content click
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="jd-flex jd-flex-col jd-h-full">
          {title && <h2 className="jd-mb-2">{getMessage(title, undefined, title)}</h2>}
          {description && <p className="jd-mb-4">{getMessage(description, undefined, description)}</p>}
          <div className="jd-flex-1 jd-overflow-y-auto jd-pr-2">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};