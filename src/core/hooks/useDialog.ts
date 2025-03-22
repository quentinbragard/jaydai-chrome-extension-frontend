import { useState, useEffect } from 'react';
import { dialogManager } from '../managers/DialogManager';
import { DialogType, DialogOptions } from '@/types/dialog';

/**
 * Hook for managing dialogs
 * Provides state and methods for opening/closing a specific dialog type
 */
export function useDialog(type: DialogType) {
  const [isOpen, setIsOpen] = useState<boolean>(dialogManager.isDialogOpen(type));
  const [options, setOptions] = useState<DialogOptions | undefined>(
    dialogManager.getDialogOptions(type)
  );
  
  useEffect(() => {
    // Subscribe to dialog changes
    const unsubscribe = dialogManager.subscribe(type, (open, dialogOptions) => {
      setIsOpen(open);
      setOptions(dialogOptions || {});
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [type]);
  
  const openDialog = (newOptions?: DialogOptions) => {
    dialogManager.openDialog(type, newOptions);
  };
  
  const closeDialog = () => {
    dialogManager.closeDialog(type);
  };
  
  return { 
    isOpen, 
    options, 
    openDialog, 
    closeDialog,
    // Helper for passing directly to UI components
    dialogProps: {
      open: isOpen,
      onOpenChange: (open: boolean) => {
        if (!open) closeDialog();
      }
    }
  };
}