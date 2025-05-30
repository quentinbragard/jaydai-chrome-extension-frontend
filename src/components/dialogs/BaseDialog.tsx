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
        e.preventDefault();
      }
    };

    // Use capture phase to ensure we get the event first
    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onOpenChange, open]);
  
  // Enhanced event isolation with better z-index management
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    
    const dialogElement = dialogRef.current;
    
    // Prevent all events from bubbling out of the dialog
    const stopEventPropagation = (e: Event) => {
      e.stopPropagation();
    };
    
    // Events to capture and stop
    const events = [
      'click', 'mousedown', 'mouseup', 'mousemove',
      'keydown', 'keyup', 'keypress',
      'focus', 'blur', 'input', 'change',
      'scroll', 'wheel'
    ];
    
    // Attach listeners in the bubbling phase so child elements still
    // receive the event, but stop it from leaving the dialog
    events.forEach(eventName => {
      dialogElement.addEventListener(eventName, stopEventPropagation, {
        capture: false,
        passive: false
      });
    });
    
    return () => {
      events.forEach(eventName => {
        dialogElement.removeEventListener(eventName, stopEventPropagation, false);
      });
    };
  }, [open]);

  // Handle backdrop click with improved event handling
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      onOpenChange(false);
    }
  };
  
  // Conditional return after all hooks
  if (!open || !mounted) return null;
  
  return (
    <div
      className="jd-fixed jd-inset-0 jd-z-[10001] jd-bg-black/50 jd-flex jd-items-center jd-justify-center jd-overflow-hidden"
      onClick={handleBackdropClick}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ isolation: 'isolate' }} // Create new stacking context
    >
      <div 
        ref={dialogRef}
        className={cn(
          "jd-bg-background jd-rounded-lg jd-shadow-xl jd-w-full jd-max-h-[90vh] jd-flex jd-flex-col jd-relative jd-z-[10002]",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ isolation: 'isolate' }} // Create new stacking context for dialog content
      >
        {/* Close button with higher z-index */}
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onOpenChange(false);
          }}
          className="jd-absolute jd-right-4 jd-top-4 jd-rounded-full jd-p-1 jd-bg-muted jd-text-muted-foreground hover:jd-bg-muted/80 focus:jd-outline-none jd-transition-colors jd-z-[10003]"
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
        
        {/* Content section with proper z-index */}
        <div className="jd-flex-1 jd-overflow-y-auto jd-p-6 jd-relative jd-z-[1]">
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