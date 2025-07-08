
// src/components/dialogs/DialogContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { DialogType, DialogProps } from './DialogRegistry';
import { trackEvent, EVENTS } from '@/utils/amplitude';

// Define the Dialog Manager context type
interface DialogManagerContextType {
  openDialogs: Record<DialogType, boolean>;
  dialogData: DialogProps;
  openDialog: <T extends DialogType>(type: T, data?: DialogProps[T]) => void;
  closeDialog: (type: DialogType) => void;
  isDialogOpen: (type: DialogType) => boolean;
  getDialogData: <T extends DialogType>(type: T) => DialogProps[T] | undefined;
}

// Create the context with default values
const DialogManagerContext = createContext<DialogManagerContextType | null>(null);

// Define the global window interface to expose dialogManager
declare global {
  interface Window {
    dialogManager?: {
      openDialog: <T extends DialogType>(type: T, data?: DialogProps[T]) => void;
      closeDialog: (type: DialogType) => void;
      isInitialized?: boolean;
    };
  }
}

/**
 * Create a fallback dialog manager for when the context isn't available
 */
const createFallbackDialogManager = (): DialogManagerContextType => {
  console.warn('Using fallback dialog manager. Some functionality may be limited.');
  
  return {
    openDialogs: {} as Record<DialogType, boolean>,
    dialogData: {} as DialogProps,
    openDialog: (type, data) => {
      console.warn(`Attempted to open dialog ${type} using fallback dialog manager`);
      if (typeof window !== 'undefined' && window.dialogManager) {
        window.dialogManager.openDialog(type, data);
      } else {
        console.error(`Cannot open dialog ${type}: dialog manager not available`);
      }
      trackEvent(EVENTS.DIALOG_OPENED, { dialog_type: type });
    },
    closeDialog: (type) => {
      console.warn(`Attempted to close dialog ${type} using fallback dialog manager`);
      if (typeof window !== 'undefined' && window.dialogManager) {
        window.dialogManager.closeDialog(type);
      } else {
        console.error(`Cannot close dialog ${type}: dialog manager not available`);
      }
      trackEvent(EVENTS.DIALOG_CLOSED, { dialog_type: type });
    },
    isDialogOpen: () => false,
    getDialogData: () => undefined,
  };
};

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
        openDialogs: {} as Record<DialogType, boolean>,
        dialogData: {} as DialogProps,
        openDialog: (type: DialogType, data?: DialogProps[DialogType]) => {
          window.dialogManager!.openDialog(type, data);
          trackEvent(EVENTS.DIALOG_OPENED, { dialog_type: type });
        },
        closeDialog: (type: DialogType) => {
          window.dialogManager!.closeDialog(type);
          trackEvent(EVENTS.DIALOG_CLOSED, { dialog_type: type });
        },
        isDialogOpen: () => false,
        getDialogData: () => undefined,
      };
    }
    
    // If no fallback is available, use our fallback implementation
    // instead of throwing an error
    return createFallbackDialogManager();
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
  const dialogProps = React.useMemo(() => ({
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

// Interface for DialogManager Provider Props
interface DialogManagerProviderProps {
  children: ReactNode;
}

/**
 * Dialog Manager Provider component
 */
export const DialogManagerProvider: React.FC<DialogManagerProviderProps> = ({ children }) => {
  // State for tracking open dialogs and their data
  const [openDialogs, setOpenDialogs] = useState<Record<DialogType, boolean>>({} as Record<DialogType, boolean>);
  const [dialogData, setDialogData] = useState<DialogProps>({} as DialogProps);
  const isInitializedRef = React.useRef(false);
  
  // Dialog management functions
  const openDialog = useCallback(<T extends DialogType>(type: T, data?: DialogProps[T]) => {
    setOpenDialogs((prev: Record<DialogType, boolean>) => ({ ...prev, [type]: true }));
    if (data !== undefined) {
      setDialogData(prev => ({ ...prev, [type]: data }));
    }
    trackEvent(EVENTS.DIALOG_OPENED, { dialog_type: type });
  }, []);
  
  const closeDialog = useCallback((type: DialogType) => {
    setOpenDialogs((prev: Record<DialogType, boolean>) => ({ ...prev, [type]: false }));
    trackEvent(EVENTS.DIALOG_CLOSED, { dialog_type: type });
  }, []);
  
  const isDialogOpen = useCallback((type: DialogType): boolean => {
    return !!openDialogs[type];
  }, [openDialogs]);
  
  const getDialogData = useCallback(<T extends DialogType>(type: T): DialogProps[T] | undefined => {
    return dialogData[type] as DialogProps[T];
  }, [dialogData]);
  
  // Create context value
  const contextValue = React.useMemo(() => ({
    openDialogs,
    dialogData,
    openDialog,
    closeDialog,
    isDialogOpen,
    getDialogData,
  }), [openDialogs, dialogData, openDialog, closeDialog, isDialogOpen, getDialogData]);
  
  // Assign window.dialogManager methods - using useEffect with an empty
  // dependency array ensures this only runs once on mount
  useEffect(() => {
    
    // Initialize dialogManager if it doesn't exist
    if (!window.dialogManager) {
      window.dialogManager = {
        openDialog,
        closeDialog,
        isInitialized: true
      };
      isInitializedRef.current = true;
    } else {
      // Update existing dialog manager
      window.dialogManager.openDialog = openDialog;
      window.dialogManager.closeDialog = closeDialog;
      window.dialogManager.isInitialized = true;
      isInitializedRef.current = true;
    }
    
    // Keep the useEffect for cleanup
    return () => {
      if (window.dialogManager && isInitializedRef.current) {
        // Check if our functions were assigned
        if (window.dialogManager.openDialog === openDialog) {
          // Just mark as uninitialized instead of deleting
          window.dialogManager.isInitialized = false;
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