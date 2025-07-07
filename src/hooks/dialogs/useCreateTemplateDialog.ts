
// src/hooks/dialogs/useCreateTemplateDialog.ts - Simplified Version
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { useTemplateDialogBase } from './useTemplateDialogBase';
import { useTemplateCreation } from '@/hooks/prompts/useTemplateCreation';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';
import { PromptMetadata } from '@/types/prompts/metadata';
import { metadataToBlockMapping } from '@/utils/prompts/metadataUtils';

export function useCreateTemplateDialog() {
  const createDialog = useDialog(DIALOG_TYPES.CREATE_TEMPLATE);
  const editDialog = useDialog(DIALOG_TYPES.EDIT_TEMPLATE);
  const { saveTemplate } = useTemplateCreation();
  
  const isOpen = createDialog.isOpen || editDialog.isOpen;
  const isEditMode = editDialog.isOpen;
  const data = createDialog.isOpen ? createDialog.data : editDialog.data;
  
  const handleComplete = async (
    content: string, 
    metadata: PromptMetadata
  ): Promise<boolean> => {
    try {
      // Simplified: just save content + metadata
      const formData = {
        name: baseHook.name.trim(),
        content: content, // Use the base content directly
        description: baseHook.description?.trim(),
        folder_id: baseHook.selectedFolderId ? parseInt(baseHook.selectedFolderId, 10) : undefined,
        metadata: metadataToBlockMapping(metadata)
      };
            
      const currentTemplate = data?.template;
      const success = await saveTemplate(formData, currentTemplate?.id, 'CreateTemplateDialog');
      
      if (success) {
        if (currentTemplate) {
          // Refresh page for edit
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(getMessage('errorSavingTemplate', undefined, 'Error saving template'));
      return false;
    }
  };
  
  const handleClose = () => {
    if (createDialog.isOpen) {
      createDialog.close();
    } else {
      editDialog.close();
    }
  };
  
  const baseHook = useTemplateDialogBase({
    dialogType: isEditMode ? 'create' : 'create',
    initialData: data,
    onComplete: handleComplete,
    onClose: handleClose
  });
  
  return {
    ...baseHook,
    isOpen,
    isEditMode,
    dialogTitle: isEditMode 
      ? getMessage('editTemplate', undefined, 'Edit Template') 
      : getMessage('createTemplate', undefined, 'Create Template')
  };
}