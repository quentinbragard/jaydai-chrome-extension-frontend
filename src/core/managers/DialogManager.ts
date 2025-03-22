import { DialogType, DialogOptions } from "@/types/dialog";

/**
 * Manages dialog visibility and communication
 */
class DialogManager {
  private activeDialogs: Map<DialogType, DialogOptions> = new Map();
  private listeners: Map<DialogType, Set<(isOpen: boolean, options?: DialogOptions) => void>> = new Map();
  
  /**
   * Open a dialog with options
   */
  public openDialog(type: DialogType, options?: DialogOptions): void {
    this.activeDialogs.set(type, options || {});
    this.notifyListeners(type, true, options);
  }
  
  /**
   * Close a dialog
   */
  public closeDialog(type: DialogType): void {
    const options = this.activeDialogs.get(type);
    this.activeDialogs.delete(type);
    
    // Call onClose callback if provided
    if (options?.onClose) {
      options.onClose();
    }
    
    this.notifyListeners(type, false);
  }
  
  /**
   * Check if a dialog is open
   */
  public isDialogOpen(type: DialogType): boolean {
    return this.activeDialogs.has(type);
  }
  
  /**
   * Get options for a dialog
   */
  public getDialogOptions(type: DialogType): DialogOptions | undefined {
    return this.activeDialogs.get(type);
  }
  
  /**
   * Subscribe to dialog open/close events
   * @returns Unsubscribe function
   */
  public subscribe(type: DialogType, callback: (isOpen: boolean, options?: DialogOptions) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)!.add(callback);
    
    // If dialog is already open, notify immediately
    if (this.isDialogOpen(type)) {
      callback(true, this.getDialogOptions(type));
    }
    
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }
  
  /**
   * Notify all listeners for a dialog type
   */
  private notifyListeners(type: DialogType, isOpen: boolean, options?: DialogOptions): void {
    this.listeners.get(type)?.forEach(callback => {
      try {
        callback(isOpen, options);
      } catch (error) {
        console.error(`Error in dialog listener for ${type}:`, error);
      }
    });
  }
}

// Export a singleton instance
export const dialogManager = new DialogManager();