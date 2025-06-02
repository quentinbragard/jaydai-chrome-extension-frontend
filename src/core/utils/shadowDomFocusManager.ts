// src/core/utils/shadowDomFocusManager.ts
import React from 'react';

/**
 * COMPLETELY DIFFERENT APPROACH - Focus Management by Prevention, Not Interception
 * Instead of intercepting events, we prevent focus from ever leaving dialogs
 */

/**
 * Focus Guard - prevents focus from escaping dialog
 */
export class DialogFocusGuard {
  private dialogElement: HTMLElement | null = null;
  private isActive: boolean = false;
  private lastFocusedElement: HTMLElement | null = null;
  private focusGuardInterval: number | null = null;

  constructor(dialogElement: HTMLElement) {
    this.dialogElement = dialogElement;
  }

  /**
   * Activate focus guarding - call when dialog opens
   */
  public activate() {
    if (!this.dialogElement || this.isActive) return;

    this.isActive = true;
    
    // Store currently focused element
    this.lastFocusedElement = document.activeElement as HTMLElement;

    // Focus first focusable element in dialog
    setTimeout(() => {
      const focusableElements = this.getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }, 100);

    // Set up focus monitoring (much less aggressive than event interception)
    this.startFocusMonitoring();
  }

  /**
   * Deactivate focus guarding - call when dialog closes
   */
  public deactivate() {
    if (!this.isActive) return;

    this.isActive = false;

    // Stop focus monitoring
    if (this.focusGuardInterval) {
      clearInterval(this.focusGuardInterval);
      this.focusGuardInterval = null;
    }

    // Restore focus to previously focused element
    if (this.lastFocusedElement && this.lastFocusedElement.focus) {
      try {
        this.lastFocusedElement.focus();
      } catch (e) {
        // Focus restoration failed, ignore
      }
    }
  }

  /**
   * Monitor focus and redirect if it escapes the dialog
   */
  private startFocusMonitoring() {
    // Check focus every 100ms - much gentler than event interception
    this.focusGuardInterval = window.setInterval(() => {
      if (!this.isActive || !this.dialogElement) return;

      const activeElement = document.activeElement;
      
      // If focus has escaped the dialog, bring it back
      if (activeElement && !this.dialogElement.contains(activeElement)) {
        const focusableElements = this.getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    }, 100);
  }

  private getFocusableElements(): HTMLElement[] {
    if (!this.dialogElement) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = this.dialogElement.querySelectorAll(focusableSelectors) as NodeListOf<HTMLElement>;
    return Array.from(elements).filter(el => {
      return el.offsetWidth > 0 && el.offsetHeight > 0 && !el.hidden;
    });
  }
}

/**
 * React hook for dialog focus guarding
 */
export function useDialogFocusGuard(dialogElement: HTMLElement | null, isActive: boolean) {
  const [focusGuard, setFocusGuard] = React.useState<DialogFocusGuard | null>(null);

  React.useEffect(() => {
    if (dialogElement) {
      const guard = new DialogFocusGuard(dialogElement);
      setFocusGuard(guard);
      return () => guard.deactivate();
    }
  }, [dialogElement]);

  React.useEffect(() => {
    if (focusGuard) {
      if (isActive) {
        focusGuard.activate();
      } else {
        focusGuard.deactivate();
      }
    }
  }, [focusGuard, isActive]);

  return focusGuard;
}

/**
 * MINIMAL focus protection - only prevents typing in parent page input fields
 */
export function setupMinimalFocusProtection(shadowRoot: ShadowRoot) {
  // This approach: monitor for focus changes and redirect problematic focus
  const monitorFocus = () => {
    const activeElement = document.activeElement;
    
    // Check if focus is on a parent page input that could receive typing
    const isParentPageInput = activeElement && 
      !shadowRoot.contains(activeElement) &&
      (activeElement.matches('input, textarea, [contenteditable="true"]') ||
       activeElement.id?.includes('prompt') ||
       activeElement.className?.includes('prompt'));
    
    if (isParentPageInput) {
      // Focus is on parent page input, check if we have open dialogs
      const openDialogs = shadowRoot.querySelectorAll('[role="dialog"]');
      
      if (openDialogs.length > 0) {
        // We have open dialogs and focus is on parent input - redirect back to dialog
        const firstDialog = openDialogs[0] as HTMLElement;
        const focusableInDialog = firstDialog.querySelector('input, textarea, button') as HTMLElement;
        
        if (focusableInDialog) {
          focusableInDialog.focus();
        }
      }
    }
  };

  // Monitor focus changes with minimal frequency
  const focusMonitorInterval = setInterval(monitorFocus, 200);

  return () => {
    clearInterval(focusMonitorInterval);
  };
}