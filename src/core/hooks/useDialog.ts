import { useState, useEffect } from 'react';
import { dialogManager } from '../managers/DialogManager';
import { DialogType, DialogOptions } from '@/types/dialog';

/**
 * Hook for managing dialogs
 */
export function useDialog(type: DialogType) {
  const [isOpen, setIsOpen] = useState(dialogManager.isDialogOpen(type));
  const [options, setOptions] = useState<DialogOptions | undefined>(
    dialogManager.getDialogOptions(type)
  );
  
  useEffect(() => {
    // Subscribe to dialog changes
    const unsubscribe = dialogManager.subscribe(type, (open, dialogOptions) => {
      setIsOpen(open);
      if (dialogOptions) {
        setOptions(dialogOptions);
      }
    });
    
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
    // Helper for dialogs to pass to UI components
    dialogProps: {
      open: isOpen,
      onOpenChange: (open: boolean) => {
        if (!open) closeDialog();
      }
    }
  };
}