// src/components/dialogs/BaseDialog.tsx
import React, { useRef, useEffect, useState } from 'react';
import { useDialogFocusGuard } from '@/core/utils/shadowDomFocusManager';
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
  /**
   * Base z-index for the dialog. The backdrop will use this value,
   * while the dialog content and close button will use higher values
   * to ensure proper stacking when multiple dialogs are open.
   * Defaults to 10001 which matches the previous behaviour.
   */
  baseZIndex?: number;
}

/**
 * A simplified BaseDialog that works better with Shadow DOM
 * Uses improved event capturing to prevent events from leaking while allowing internal functionality
 */
export const BaseDialog: React.FC<BaseDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  className,
  children,
  footer,
  baseZIndex = 10001
}) => {
  // All hooks must be called unconditionally at the top
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // Keep focus trapped inside the dialog when open
  //useDialogFocusGuard(dialogRef.current, open);
  
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
  
  // FIXED: More selective event isolation that doesn't break internal functionality
  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const dialogElement = dialogRef.current;

    // Only prevent events that originate outside of ANY dialog
    const handleEvent = (e: Event) => {
      const path = e.composedPath() as EventTarget[];

      // Allow events originating from this dialog
      if (path.includes(dialogElement)) {
        return;
      }

      // Allow events from any other open dialog
      for (const el of path) {
        if (el instanceof HTMLElement && el.closest('[data-dialog-root]')) {
          return;
        }
      }

      // Prevent events coming from the underlying page
      e.stopPropagation();
      e.preventDefault();
    };
    
    // Only capture events that could interfere with the parent page
    const eventsToCapture = [
      'mousedown', 'mouseup', 'click', // Mouse events from outside
      'scroll', 'wheel', // Scrolling events
      'focus', 'blur', // Focus events from outside
      'keydown', 'keypress', 'keyup' // Keyboard events that could leak to page
    ];
    
    eventsToCapture.forEach(eventName => {
      document.addEventListener(eventName, handleEvent, {
        capture: true, // Capture phase to intercept before they reach targets
        passive: false
      });
    });
    
    return () => {
      eventsToCapture.forEach(eventName => {
        document.removeEventListener(eventName, handleEvent, true);
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
      data-dialog-root
      className="jd-fixed jd-inset-0 jd-bg-black/50 jd-flex jd-items-center jd-justify-center jd-overflow-hidden"
      onClick={handleBackdropClick}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ isolation: 'isolate', zIndex: baseZIndex }} // Create new stacking context
    >
      <div
        ref={dialogRef}
        className={cn(
          "jd-bg-background jd-rounded-lg jd-shadow-xl jd-w-full jd-max-h-[90vh] jd-flex jd-flex-col jd-relative",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ isolation: 'isolate', zIndex: baseZIndex + 1 }} // Create new stacking context for dialog content
      >
        {/* Close button with higher z-index */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onOpenChange(false);
          }}
          className="jd-absolute jd-right-4 jd-top-4 jd-rounded-full jd-p-1 jd-bg-muted jd-text-muted-foreground hover:jd-bg-muted/80 focus:jd-outline-none jd-transition-colors"
          style={{ zIndex: baseZIndex + 2 }}
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