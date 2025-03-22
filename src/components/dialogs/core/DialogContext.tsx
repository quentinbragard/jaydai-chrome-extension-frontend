// src/core/dialogs/core/DialogContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { DialogType, DialogProps, DIALOG_TYPES } from '@/core/dialogs/registry';

// Define the Dialog Manager context type
interface DialogManagerContextType {
  openDialogs: Record<DialogType, boolean>;
  dialogData: Record<DialogType, any>;
  openDialog: <T extends DialogType>(type: T, data?: DialogProps[T]) => void;
  closeDialog: (type: DialogType) => void;
  isDialogOpen: (type: DialogType) => boolean;
  getDialogData: <T extends DialogType>(type: T) => DialogProps[T] | undefined;
}

// Create the context with default values
export const DialogManagerContext = createContext<DialogManagerContextType | null>(null);

// Define the global window interface to expose dialogManager
declare global {
  interface Window {
    dialogManager: {
      openDialog: <T extends DialogType>(type: T, data?: DialogProps[T]) => void;
      closeDialog: (type: DialogType) => void;
    };
  }
}

/**
 * Hook to use the dialog manager within components
 */
export function useDialogManager(): DialogManagerContextType {
  const context = useContext(DialogManagerContext);
  
  // Add a fallback when context is not available
  if (!context) {
    // First, check if window.dialogManager exists and use it if available
    if (typeof window !== 'undefined' && window.dialogManager) {
      // Return a minimal context that uses window.dialogManager
      return {
        openDialogs: {},
        dialogData: {},
        openDialog: window.dialogManager.openDialog,
        closeDialog: window.dialogManager.closeDialog,
        isDialogOpen: () => false,  // Fallback implementations
        getDialogData: () => undefined,
      };
    }
    
    // If no fallback is available, throw the error
    throw new Error('useDialogManager must be used within a DialogManagerProvider');
  }
  
  return context;
}

/**
 * Hook to use a specific dialog
 */
export function useDialog<T extends DialogType>(type: T) {
  const { isDialogOpen, getDialogData, openDialog, closeDialog } = useDialogManager();
  
  const isOpen = isDialogOpen(type);
  const data = getDialogData<T>(type);
  
  const open = useCallback((newData?: DialogProps[T]) => {
    openDialog(type, newData);
  }, [openDialog, type]);
  
  const close = useCallback(() => {
    closeDialog(type);
  }, [closeDialog, type]);
  
  // Helper for dialog props that can be directly passed to a Dialog component
  const dialogProps = useMemo(() => ({
    open: isOpen,
    onOpenChange: (open: boolean) => {
      if (!open) close();
    },
  }), [isOpen, close]);
  
  return {
    isOpen,
    data,
    open,
    close,
    dialogProps,
  };
}

/**
 * Hook for opening dialogs with type safety
 */
export function useOpenDialog() {
  const { openDialog } = useDialogManager();
  
  return {
    openSettings: () => openDialog(DIALOG_TYPES.SETTINGS, {}),
    
    openCreateTemplate: (props: DialogProps[typeof DIALOG_TYPES.CREATE_TEMPLATE]) => 
      openDialog(DIALOG_TYPES.CREATE_TEMPLATE, props),
    
    openEditTemplate: (props: DialogProps[typeof DIALOG_TYPES.EDIT_TEMPLATE]) => 
      openDialog(DIALOG_TYPES.EDIT_TEMPLATE, props),
    
    openCreateFolder: (props: DialogProps[typeof DIALOG_TYPES.CREATE_FOLDER]) => 
      openDialog(DIALOG_TYPES.CREATE_FOLDER, props),
    
    openAuth: (props: DialogProps[typeof DIALOG_TYPES.AUTH]) => 
      openDialog(DIALOG_TYPES.AUTH, props),
    
    openPlaceholderEditor: (props: DialogProps[typeof DIALOG_TYPES.PLACEHOLDER_EDITOR]) => 
      openDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR, props),
    
    openConfirmation: (props: DialogProps[typeof DIALOG_TYPES.CONFIRMATION]) => 
      openDialog(DIALOG_TYPES.CONFIRMATION, props),
  };
}

/**
 * Dialog Manager Provider component
 */
export const DialogManagerProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // State for tracking open dialogs and their data
  const [openDialogs, setOpenDialogs] = useState<Record<DialogType, boolean>>({} as any);
  const [dialogData, setDialogData] = useState<Record<DialogType, any>>({} as any);
  
  // Dialog management functions
  const openDialog = useCallback(<T extends DialogType>(type: T, data?: DialogProps[T]) => {
    console.log(`Opening dialog: ${type}`, data);
    setOpenDialogs(prev => ({ ...prev, [type]: true }));
    if (data !== undefined) {
      setDialogData(prev => ({ ...prev, [type]: data }));
    }
  }, []);
  
  const closeDialog = useCallback((type: DialogType) => {
    console.log(`Closing dialog: ${type}`);
    setOpenDialogs(prev => ({ ...prev, [type]: false }));
  }, []);
  
  const isDialogOpen = useCallback((type: DialogType): boolean => {
    return !!openDialogs[type];
  }, [openDialogs]);
  
  const getDialogData = useCallback(<T extends DialogType>(type: T): DialogProps[T] | undefined => {
    return dialogData[type] as DialogProps[T];
  }, [dialogData]);
  
  // Create context value
  const contextValue = useMemo(() => ({
    openDialogs,
    dialogData,
    openDialog,
    closeDialog,
    isDialogOpen,
    getDialogData,
  }), [openDialogs, dialogData, openDialog, closeDialog, isDialogOpen, getDialogData]);
  
  // Assign window.dialogManager methods
  useEffect(() => {
    console.log('Initializing window.dialogManager');
    
    // Make sure to define window.dialogManager if it doesn't exist
    if (!window.dialogManager) {
      window.dialogManager = {
        openDialog,
        closeDialog
      };
      console.log('window.dialogManager initialized successfully');
    } else {
      console.log('window.dialogManager already exists, updating methods');
      window.dialogManager.openDialog = openDialog;
      window.dialogManager.closeDialog = closeDialog;
    }
    
    // Keep the useEffect for cleanup
    return () => {
      console.log('Cleaning up window.dialogManager');
      if (window.dialogManager) {
        // Only delete if our functions were assigned
        if (window.dialogManager.openDialog === openDialog) {
          delete window.dialogManager;
          console.log('window.dialogManager cleaned up');
        } else {
          console.log('Not cleaning up window.dialogManager as it was overridden');
        }
      }
    };
  }, [openDialog, closeDialog]);
  
  return (
    <DialogManagerContext.Provider value={contextValue}>
      {children}
    </DialogManagerContext.Provider>
  );
};