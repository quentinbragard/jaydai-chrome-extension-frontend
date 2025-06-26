import { debug } from '@/core/config';
// src/utils/DialogManagerHelper.ts
import { toast } from 'sonner';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';

/**
 * Helper service to work with the dialog manager more reliably
 */
export class DialogManagerHelper {
  private static instance: DialogManagerHelper;
  private isDialogManagerAvailable: boolean = false;
  private checkInterval: number | null = null;
  private maxRetries: number = 10;
  private retryDelay: number = 300; // ms
  
  private constructor() {
    // Initialize on instantiation
    this.checkDialogManagerAvailability();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): DialogManagerHelper {
    if (!DialogManagerHelper.instance) {
      DialogManagerHelper.instance = new DialogManagerHelper();
    }
    return DialogManagerHelper.instance;
  }
  
  /**
   * Check if the dialog manager is available
   * This also initiates a polling mechanism if not available
   */
  public checkDialogManagerAvailability(): boolean {
    this.isDialogManagerAvailable = 
      typeof window !== 'undefined' && 
      !!window.dialogManager &&
      typeof window.dialogManager.openDialog === 'function';
    
    // If not available, start polling
    if (!this.isDialogManagerAvailable && !this.checkInterval) {
      let retries = 0;
      this.checkInterval = window.setInterval(() => {
        const available = 
          typeof window !== 'undefined' && 
          !!window.dialogManager &&
          typeof window.dialogManager.openDialog === 'function';
        
        if (available) {
          this.isDialogManagerAvailable = true;
          if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
          }
          debug('✅ Dialog manager is now available');
        } else {
          retries++;
          if (retries >= this.maxRetries) {
            if (this.checkInterval) {
              clearInterval(this.checkInterval);
              this.checkInterval = null;
            }
            console.error('❌ Dialog manager not available after max retries');
          }
        }
      }, this.retryDelay);
    }
    
    return this.isDialogManagerAvailable;
  }
  
  /**
   * Get the dialog manager with proper error handling
   */
  public getDialogManager(): typeof window.dialogManager | null {
    if (!this.checkDialogManagerAvailability()) {
      console.error('❌ Dialog manager not available');
      return null;
    }
    return window.dialogManager;
  }
  
  /**
   * Safely open a dialog with proper error handling and retries
   */
  public async openDialog<T extends keyof typeof DIALOG_TYPES>(
    type: T, 
    data?: any, 
    maxRetries: number = 3
  ): Promise<boolean> {
    let retries = 0;
    
    while (retries < maxRetries) {
      // Check for dialog manager
      const dialogManager = this.getDialogManager();
      if (dialogManager) {
        try {
          debug(`🔔 Opening dialog: ${type}`, data);
          dialogManager.openDialog(type, data);
          return true;
        } catch (error) {
          console.error(`❌ Error opening dialog ${type}:`, error);
          retries++;
          
          if (retries >= maxRetries) {
            toast.error('Failed to open dialog. Please try again.');
            return false;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 200 * retries));
        }
      } else {
        console.error(`❌ Dialog manager not available (attempt ${retries + 1}/${maxRetries})`);
        retries++;
        
        if (retries >= maxRetries) {
          toast.error('System not ready. Please try again later.');
          return false;
        }
        
        // Wait longer before retrying
        await new Promise(resolve => setTimeout(resolve, 500 * retries));
      }
    }
    
    return false;
  }
  
  /**
   * Open the placeholder editor dialog for a template
   */
  public openPlaceholderEditor(
    templateContent: string, 
    templateTitle: string = 'Template', 
    onComplete?: (finalContent: string) => void
  ): Promise<boolean> {
    return this.openDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR, {
      content: templateContent,
      title: templateTitle,
      onComplete: onComplete || (() => {})
    });
  }
  
  /**
   * Close a specific dialog
   */
  public closeDialog(type: keyof typeof DIALOG_TYPES): boolean {
    const dialogManager = this.getDialogManager();
    if (!dialogManager) {
      return false;
    }
    
    try {
      dialogManager.closeDialog(type);
      return true;
    } catch (error) {
      console.error(`❌ Error closing dialog ${type}:`, error);
      return false;
    }
  }
  
  /**
   * Close all dialogs (best effort)
   */
  public closeAllDialogs(): void {
    const dialogManager = this.getDialogManager();
    if (!dialogManager) {
      return;
    }
    
    // Try to close common dialogs
    const DIALOG_TYPES = Object.values(DIALOG_TYPES);
    for (const type of DIALOG_TYPES) {
      try {
        dialogManager.closeDialog(type);
      } catch (error) {
        // Ignore errors when bulk closing
      }
    }
  }
}

// Export a singleton instance
export const dialogHelper = DialogManagerHelper.getInstance();