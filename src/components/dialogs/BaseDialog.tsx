// src/components/dialogs/BaseDialog.tsx
import React, { useRef, useEffect, useState } from 'react';
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
 * Uses improved event capturing to prevent events from leaking
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
  // IMPORTANT: All hooks must be called before any conditional returns
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  // Setup effect for mounting state
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Handle escape key press
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
        // Stop propagation to prevent the escape key from doing anything else
        e.stopPropagation();
      }
    };

    // Attach the event listener
    window.addEventListener('keydown', handleKeyDown, true); // true for capture phase
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onOpenChange, open]);
  
  // Set up input event isolation
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    
    // This is the critical part that fixes the Claude input issue
    const handleEvents = (e: Event) => {
      // Stop the event from propagating through the shadow DOM boundary
      e.stopPropagation();
    };

    // Get all input elements inside the dialog
    const inputElements = dialogRef.current.querySelectorAll(
      'input, textarea, [contenteditable="true"]'
    );
    
    // Add event listeners for all input-related events
    const events = ['keydown', 'keyup', 'keypress', 'input', 'change', 'focus', 'blur', 'click'];
    
    inputElements.forEach(element => {
      events.forEach(eventName => {
        element.addEventListener(eventName, handleEvents, true);
      });
    });
    
    // Cleanup function
    return () => {
      if (!dialogRef.current) return;
      
      const updatedInputElements = dialogRef.current.querySelectorAll(
        'input, textarea, [contenteditable="true"]'
      );
      
      updatedInputElements.forEach(element => {
        events.forEach(eventName => {
          element.removeEventListener(eventName, handleEvents, true);
        });
      });
    };
  }, [open, children]); // Re-run when open state or children change
  
  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop (not on its children)
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };
  
  // After all hooks have been called, we can use a conditional return
  if (!open || !mounted) return null;
  
  return (
    <div 
      className="jd-fixed jd-inset-0 jd-z-[10001] jd-bg-black/50 jd-flex jd-items-center jd-justify-center jd-overflow-hidden"
      onClick={handleBackdropClick}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div 
        ref={dialogRef}
        className={cn(
          "jd-bg-background jd-rounded-lg jd-shadow-xl jd-w-full jd-max-h-[90vh] jd-flex jd-flex-col jd-relative",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
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
          <div className="jd-border-b jd-px-6 jd-py-4 jd-flex-shrink-0">
            {title && <h2 className="jd-text-xl jd-font-semibold jd-mb-1">{getMessage(title, undefined, title)}</h2>}
            {description && <p className="jd-text-muted-foreground">{getMessage(description, undefined, description)}</p>}
          </div>
        )}
        
        {/* Content section - scrollable */}
        <div 
          className="jd-flex-1 jd-overflow-y-auto jd-p-6" 
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children}
        </div>
        
        {/* Footer section - fixed */}
        {footer && (
          <div className="jd-border-t jd-p-4 jd-bg-background jd-flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};