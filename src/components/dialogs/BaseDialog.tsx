import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
        className={className} 
      >
        {title && <h2 className="dialog-title">{title}</h2>}
        {description && <p className="dialog-description">{description}</p>}
        {children}
      </DialogContent>
    </Dialog>
  );
};