// src/hooks/prompts/actions/useTemplateActions.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Template } from '@/types/prompts/templates';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { useTemplateMutations } from './useTemplateMutations';
import { useFolderMutations } from './useFolderMutations';
import { useQueryClient } from 'react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { useTemplateDialogs } from '@/hooks/dialogs/useTemplateDialog';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';


/**
 * A redesigned template action hook with cross-platform support
 * for both ChatGPT and Claude
 */
export function useTemplateActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { trackTemplateUsage, deleteTemplate } = useTemplateMutations();
  const { createFolder: createFolderMutation } = useFolderMutations();
  const queryClient = useQueryClient();
  const dialogManager = useDialogManager();
  const { openCreateDialog, openCustomizeDialog, openEditDialog } = useTemplateDialogs();
  
  /**
   * Safely open a dialog with fallback mechanisms
   */
  const openDialog = useCallback((dialogType, dialogData = {}) => {
    try {
      // Try dialog manager from context first
      if (dialogManager && typeof dialogManager.openDialog === 'function') {
        console.log(`Opening ${dialogType} dialog via context`);
        dialogManager.openDialog(dialogType, dialogData);
        return true;
      }
      
      // Fall back to window.dialogManager
      if (window.dialogManager && typeof window.dialogManager.openDialog === 'function') {
        console.log(`Opening ${dialogType} dialog via window`);
        window.dialogManager.openDialog(dialogType, dialogData);
        return true;
      }
      
      // If both approaches fail, try with a delay
      console.log(`Dialog manager not fully initialized, retrying ${dialogType} dialog...`);
      setTimeout(() => {
        if (window.dialogManager && typeof window.dialogManager.openDialog === 'function') {
          window.dialogManager.openDialog(dialogType, dialogData);
          console.log(`Successfully opened ${dialogType} dialog after delay`);
        } else {
          console.error(`Failed to open ${dialogType} dialog: dialog manager not available`);
          toast.error('System not initialized properly. Please refresh the page.');
        }
      }, 150);
      
      return true;
    } catch (error) {
      console.error(`Error opening ${dialogType} dialog:`, error);
      toast.error('Failed to open dialog');
      return false;
    }
  }, [dialogManager]);

// Use template by opening the unified customization dialog
const useTemplate = useCallback(async (template: Template) => {
  if (!template) {
    toast.error('Invalid template data');
    return;
  }

  try {
    openCustomizeDialog(template);

    if (template.id) {
      trackTemplateUsage.mutate(template.id);
    }

    // Close panels so the dialog is visible
    document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
  } catch (error) {
    console.error('Error using template:', error);
    toast.error('Failed to open template dialog');
  }
}, [openCustomizeDialog, trackTemplateUsage]);
  
  /**
   * Open template editor to create a new template
   */
  const createTemplate = useCallback(() => {
    openCreateDialog();
  }, [openCreateDialog]);
  
  /**
   * Create a folder and then open template creation
   */
  const createFolderAndTemplate = useCallback(() => {
    try {
      const folderDialogData = {
        onSaveFolder: async (folderData: { name: string; path: string; description: string }) => {
          try {
            const result = await createFolderMutation.mutateAsync(folderData);
            return { success: true, folder: result };
          } catch (error) {
            console.error('Error creating folder:', error);
            return { success: false, error: 'Failed to create folder' };
          }
        },
        onFolderCreated: (newFolder: any) => {
          // Force refresh folders query
          queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
          trackEvent(EVENTS.TEMPLATE_FOLDER_CREATED, {
            folder_id: newFolder.id,
            folder_name: newFolder.name
          });
          
          // Open create template dialog with the new folder selected
          setTimeout(() => {
            createTemplate(newFolder);
          }, 100);
        }
      };
      
      openDialog(DIALOG_TYPES.CREATE_FOLDER, folderDialogData);
    } catch (error) {
      console.error('Error in folder/template creation flow:', error);
      toast.error('Failed to create folder');
    }
  }, [createTemplate, createFolderMutation, queryClient, openDialog]);
  
  /**
   * Open template editor to edit an existing template
   */
  const editTemplate = useCallback((template: Template) => {
    if (!template) {
      toast.error('Invalid template');
      return;
    }

    openEditDialog(template);
  }, [openEditDialog]);

  const deleteTemplateWithConfirm = useCallback((id: number) => {
    openDialog(DIALOG_TYPES.CONFIRMATION, {
      title: getMessage('deleteTemplate', undefined, 'Delete Template'),
      description: getMessage(
        'deleteTemplateConfirmation',
        undefined,
        'Are you sure you want to delete this template? This action cannot be undone.'
      ),
      onConfirm: async () => {
        try {
          await deleteTemplate.mutateAsync(id);
          await Promise.all([
            queryClient.invalidateQueries(QUERY_KEYS.USER_TEMPLATES),
            queryClient.invalidateQueries(QUERY_KEYS.UNORGANIZED_TEMPLATES),
          ]);
          return true;
        } catch (error) {
          console.error('Error deleting template:', error);
          return false;
        }
      },
    });
  }, [openDialog, deleteTemplate, queryClient]);
  
  return {
    isProcessing,
    useTemplate,
    createTemplate,
    createFolderAndTemplate,
    editTemplate,
    deleteTemplateWithConfirm
  };
}
