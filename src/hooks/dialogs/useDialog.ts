// src/hooks/dialogs/useDialog.ts
import { useDialog as useDialogContext } from '@/components/dialogs/DialogContext';
import { DialogType } from '@/components/dialogs/DialogRegistry';

/**
 * Hook to use dialogs from any component
 */
export function useDialog<T extends DialogType>(type: T) {
  return useDialogContext<T>(type);
}

/**
 * Hook for opening dialogs with type safety
 */
export function useOpenDialog() {
  const { openDialog } = useDialogContext('settings'); // The type doesn't matter here
  
  return {
    openSettings: () => openDialog('settings', {}),
    
    openCreateTemplate: (props: any) => openDialog('createTemplate', props),
    
    openEditTemplate: (props: any) => openDialog('editTemplate', props),
    
    openCreateFolder: (props: any) => openDialog('createFolder', props),
    
    openAuth: (props: any) => openDialog('auth', props),
    
    opentemplateDialog: (props: any) => openDialog('templateDialog', props),
    
    openConfirmation: (props: any) => openDialog('confirmation', props),
    
    openEnhancedStats: () => openDialog('enhancedStats', {})
  };
}