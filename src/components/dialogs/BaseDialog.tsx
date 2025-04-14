import React from 'react';
import { Dialog } from "@/components/ui/dialog";
import { getMessage } from '@/core/utils/i18n';
import { cn } from "@/core/utils/classNames";
import { X } from "lucide-react";

export interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * A simplified BaseDialog that works better with Shadow DOM
 * Uses native scrolling behavior instead of complex custom scrollbars
 */
export const BaseDialog: React.FC<BaseDialogProps> = ({ 
  open, 
  onOpenChange,
  title,
  description,
  className,
  children,
  footer
}) => {
  if (!open) return null;
  
  return (
    <div className="jd-fixed jd-inset-0 jd-z-50 jd-bg-black/50 jd-flex jd-items-center jd-justify-center"
         onClick={(e) => {
           // Close when clicking the backdrop, but not content
           if (e.target === e.currentTarget) {
             onOpenChange(false);
           }
         }}>
      <div 
        className={cn(
          "jd-bg-background jd-rounded-lg jd-shadow-xl jd-w-full jd-max-w-6xl jd-max-h-[90vh] jd-flex jd-flex-col jd-relative",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={() => onOpenChange(false)}
          className="jd-absolute jd-right-4 jd-top-4 jd-rounded-full jd-p-1 jd-bg-muted jd-text-muted-foreground hover:jd-bg-muted/80 focus:jd-outline-none jd-transition-colors jd-z-10"
        >
          <X className="jd-h-4 jd-w-4" />
          <span className="jd-sr-only">Close</span>
        </button>
        
        {/* Header section - fixed */}
        {(title || description) && (
          <div className="jd-border-b jd-px-6 jd-py-4">
            {title && <h2 className="jd-text-xl jd-font-semibold jd-mb-1">{getMessage(title, undefined, title)}</h2>}
            {description && <p className="jd-text-muted-foreground">{getMessage(description, undefined, description)}</p>}
          </div>
        )}
        
        {/* Content section - scrollable */}
        <div className="jd-flex-1 jd-overflow-auto jd-p-6" onMouseDown={(e) => e.stopPropagation()}>
          {children}
        </div>
        
        {/* Footer section - fixed */}
        {footer && (
          <div className="jd-border-t jd-p-4 jd-bg-background jd-mt-auto">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};