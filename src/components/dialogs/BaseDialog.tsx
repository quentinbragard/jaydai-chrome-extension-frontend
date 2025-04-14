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
        className={cn("jd-w-full jd-max-w-4xl jd-overflow-y-auto jd-bg-background jd-text-primary", className)} 
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2>{getMessage(title, undefined, title)}</h2>}
        {description && <p>{getMessage(description, undefined, description)}</p>}
        {children}
      </DialogContent>
    </Dialog>
  );
};