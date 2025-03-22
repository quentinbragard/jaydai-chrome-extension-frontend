// src/core/hooks/useDialog.ts

import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { DialogType } from '@/types/dialog';

// Define the dialog store state
interface DialogState {
  activeDialogs: Record<string, boolean>;
  dialogData: Record<string, any>;
  listeners: Record<string, ((isOpen: boolean, data?: any) => void)[]>;
  openDialog: (dialogType: DialogType, data?: any) => void;
  closeDialog: (dialogType: DialogType) => void;
  isDialogOpen: (dialogType: DialogType) => boolean;
  getDialogData: (dialogType: DialogType) => any;
  subscribe: (dialogType: DialogType, listener: (isOpen: boolean, data?: any) => void) => () => void;
  unsubscribe: (dialogType: DialogType, listener: (isOpen: boolean, data?: any) => void) => void;
}

// Create the dialog store
const useDialogStore = create<DialogState>((set, get) => ({
  activeDialogs: {},
  dialogData: {},
  listeners: {},
  
  openDialog: (dialogType, data) => {
    console.log(`Opening dialog: ${dialogType}`, data);
    set((state) => ({
      activeDialogs: {
        ...state.activeDialogs,
        [dialogType]: true,
      },
      dialogData: {
        ...state.dialogData,
        [dialogType]: data,
      },
    }));
    
    // Notify listeners
    const listeners = get().listeners[dialogType] || [];
    listeners.forEach(listener => listener(true, data));
  },
  
  closeDialog: (dialogType) => {
    console.log(`Closing dialog: ${dialogType}`);
    set((state) => ({
      activeDialogs: {
        ...state.activeDialogs,
        [dialogType]: false,
      },
    }));
    
    // Notify listeners
    const listeners = get().listeners[dialogType] || [];
    listeners.forEach(listener => listener(false, get().dialogData[dialogType]));
  },
  
  isDialogOpen: (dialogType) => {
    return get().activeDialogs[dialogType] || false;
  },
  
  getDialogData: (dialogType) => {
    return get().dialogData[dialogType];
  },
  
  subscribe: (dialogType, listener) => {
    set((state) => {
      const dialogListeners = state.listeners[dialogType] || [];
      return {
        listeners: {
          ...state.listeners,
          [dialogType]: [...dialogListeners, listener],
        },
      };
    });
    
    // Return unsubscribe function
    return () => get().unsubscribe(dialogType, listener);
  },
  
  unsubscribe: (dialogType, listener) => {
    set((state) => {
      const dialogListeners = state.listeners[dialogType] || [];
      return {
        listeners: {
          ...state.listeners,
          [dialogType]: dialogListeners.filter(l => l !== listener),
        },
      };
    });
  },
}));

// Singleton instance for imperative usage
export class DialogManagerClass {
  openDialog(dialogType: DialogType, data?: any) {
    useDialogStore.getState().openDialog(dialogType, data);
  }

  closeDialog(dialogType: DialogType) {
    useDialogStore.getState().closeDialog(dialogType);
  }

  isDialogOpen(dialogType: DialogType): boolean {
    return useDialogStore.getState().isDialogOpen(dialogType);
  }

  getDialogData(dialogType: DialogType): any {
    return useDialogStore.getState().getDialogData(dialogType);
  }
  
  subscribe(dialogType: DialogType, listener: (isOpen: boolean, data?: any) => void) {
    return useDialogStore.getState().subscribe(dialogType, listener);
  }
}

// Export the singleton instance
export const dialogManager = new DialogManagerClass();

/**
 * Hook for managing dialogs
 * Provides state and methods for opening/closing a specific dialog type
 */
export function useDialog(dialogType: DialogType) {
  const [isOpen, setIsOpen] = useState<boolean>(dialogManager.isDialogOpen(dialogType));
  const [data, setData] = useState<any>(dialogManager.getDialogData(dialogType));

  useEffect(() => {
    // Subscribe to dialog changes
    const unsubscribe = dialogManager.subscribe(dialogType, (open, newData) => {
      console.log(`Dialog ${dialogType} state changed:`, {open, newData});
      setIsOpen(open);
      setData(newData);
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [dialogType]);

  const openDialog = (newData?: any) => {
    dialogManager.openDialog(dialogType, newData);
  };

  const closeDialog = () => {
    dialogManager.closeDialog(dialogType);
  };

  return {
    isOpen,
    data,
    openDialog,
    closeDialog,
    // Helper for passing directly to UI components
    dialogProps: {
      open: isOpen,
      onOpenChange: (open: boolean) => {
        if (!open) closeDialog();
      },
    },
  };
}