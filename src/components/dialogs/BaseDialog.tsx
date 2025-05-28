// src/components/dialogs/BaseDialog.tsx
import React, { useRef, useEffect, useState } from 'react';
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
  // All hooks must be called unconditionally at the top
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
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onOpenChange, open]);
  
  // Modified event isolation - CRITICAL FIX:
  // Only isolate text input events, not button clicks or form submissions
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    
    const handleTextInputEvents = (e: Event) => {
      // Only stop propagation for keyboard events on text inputs
      // This allows button clicks and form submissions to work normally
      if (e.type.startsWith('key')) {
        e.stopPropagation();
      }
    };

    // Only target text input fields
    const textInputElements = dialogRef.current.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="password"], textarea, [contenteditable="true"]'
    );
    
    // Limited set of events to intercept
    const inputEvents = ['keydown', 'keyup', 'keypress'];
    
    textInputElements.forEach(element => {
      inputEvents.forEach(eventName => {
        element.addEventListener(eventName, handleTextInputEvents, true);
      });
    });
    
    return () => {
      if (!dialogRef.current) return;
      
      const updatedTextInputElements = dialogRef.current.querySelectorAll(
        'input[type="text"], input[type="email"], input[type="password"], textarea, [contenteditable="true"]'
      );
      
      updatedTextInputElements.forEach(element => {
        inputEvents.forEach(eventName => {
          element.removeEventListener(eventName, handleTextInputEvents, true);
        });
      });
    };
  }, [open, children]);

  // Stop keyboard events from leaking to the page
  useEffect(() => {
    if (!open) return;

    const stopPropagation = (e: KeyboardEvent) => {
      e.stopPropagation();
    };

    const events: (keyof DocumentEventMap)[] = ['keydown', 'keypress', 'keyup'];
    events.forEach(evt => window.addEventListener(evt, stopPropagation, true));
    return () => {
      events.forEach(evt => window.removeEventListener(evt, stopPropagation, true));
    };
  }, [open]);
  
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };
  
  // Conditional return after all hooks
  if (!open || !mounted) return null;
  
  return (
    <div
      className="jd-fixed jd-inset-0 jd-z-[10001] jd-bg-black/50 jd-flex jd-items-center jd-justify-center jd-overflow-hidden"
      onClick={handleBackdropClick}
      onWheel={(e) => e.stopPropagation()}
    >
      <div 
        ref={dialogRef}
        className={cn(
          "jd-bg-background jd-rounded-lg jd-shadow-xl jd-w-full jd-max-h-[90vh] jd-flex jd-flex-col jd-relative",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          type="button"
          onClick={() => onOpenChange(false)}
          className="jd-absolute jd-right-4 jd-top-4 jd-rounded-full jd-p-1 jd-bg-muted jd-text-muted-foreground hover:jd-bg-muted/80 focus:jd-outline-none jd-transition-colors jd-z-10"
        >
          <X className="jd-h-4 jd-w-4" />
          <span className="jd-sr-only">Close</span>
        </button>
        
        {/* Header section */}
        {(title || description) && (
          <div className="jd-border-b jd-px-6 jd-py-4 jd-flex-shrink-0">
            {title && <h2 className="jd-text-xl jd-font-semibold jd-mb-1">{getMessage(title, undefined, title)}</h2>}
            {description && <p className="jd-text-muted-foreground">{getMessage(description, undefined, description)}</p>}
          </div>
        )}
        
        {/* Content section */}
        <div className="jd-flex-1 jd-overflow-y-auto jd-p-6">
          {children}
        </div>
        
        {/* Footer section */}
        {footer && (
          <div className="jd-border-t jd-p-4 jd-bg-background jd-flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};