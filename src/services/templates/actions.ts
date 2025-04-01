import { useQueryClient } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { DIALOG_TYPES } from '@/core/dialogs/registry';
import { QUERY_KEYS } from './queryKeys';
import { Template, TemplateFolder } from '@/types/prompts/templates';
import { TemplateFormData } from './types';

export function useTemplateActions() {
  const queryClient = useQueryClient();

  // Helper to handle opening the placeholder editor dialog
  const openPlaceholderEditor = (template: Template) => {
    if (!window.dialogManager) {
      toast.error('Dialog manager not available');
      return;
    }

    window.dialogManager.openDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR, {
      content: template.content,
      title: template.title,
      onComplete: handleFinalizeTemplate
    });

    // Track template usage if it has an ID
    if (template.id) {
      promptApi.trackTemplateUsage(template.id).catch(err => {
        console.error('Failed to track template usage:', err);
      });
    }
  };

  // Helper to handle template finalization
  const handleFinalizeTemplate = (finalContent: string) => {
    const textarea = document.querySelector('#prompt-textarea');
    if (!textarea) {
      console.error('Could not find input area');
      return;
    }

    try {
      // Normalize line breaks and trim excess whitespace
      const formattedContent = finalContent
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (textarea instanceof HTMLTextAreaElement) {
        textarea.value = formattedContent;
        textarea.focus();
      } else {
        textarea.textContent = formattedContent;
      }
      
      // Trigger input event to notify React of the change
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Close dialog
      if (window.dialogManager) {
        window.dialogManager.closeDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR);
      }
      
      toast.success('Template applied successfully');
      
      // Refresh usage information after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
        queryClient.invalidateQueries(QUERY_KEYS.UNORGANIZED_TEMPLATES);
      }, 500);
    } catch (error) {
      console.error('Template application error:', error);
      toast.error('Error applying template');
    }
  };

  // Helper to handle template creation
  const createTemplate = (selectedFolder?: TemplateFolder) => {
    if (!window.dialogManager) {
      toast.error('Dialog manager not available');
      return;
    }

    // Create form data with selected folder if provided
    const formData: TemplateFormData = {
      name: '',
      content: '',
      description: '',
      folder: selectedFolder?.name || '',
      folder_id: selectedFolder?.id || null,
      based_on_official_id: null
    };

    // Load user folders for the dialog
    promptApi.getUserFolders().then(foldersResult => {
      if (window.dialogManager) {
        window.dialogManager.openDialog(DIALOG_TYPES.CREATE_TEMPLATE, {
          formData,
          selectedFolder,
          userFolders: foldersResult.folders || []
        });
      }
    }).catch(error => {
      console.error('Error loading user folders:', error);
      
      // Still open the dialog even if folders couldn't be loaded
      if (window.dialogManager) {
        window.dialogManager.openDialog(DIALOG_TYPES.CREATE_TEMPLATE, {
          formData,
          selectedFolder,
          userFolders: []
        });
      }
    });
  };

  // Helper to handle editing a template
  const editTemplate = (template: Template) => {
    if (!window.dialogManager) {
      toast.error('Dialog manager not available');
      return;
    }

    // Create form data from template
    const formData: TemplateFormData = {
      name: template.title || '',
      content: template.content || '',
      description: template.description || '',
      folder: template.folder || '',
      folder_id: template.folder_id,
      based_on_official_id: null
    };

    // Load user folders for the dialog
    promptApi.getUserFolders().then(foldersResult => {
      if (window.dialogManager) {
        window.dialogManager.openDialog(DIALOG_TYPES.EDIT_TEMPLATE, {
          template,
          formData,
          userFolders: foldersResult.folders || []
        });
      }
    }).catch(error => {
      console.error('Error loading user folders:', error);
      
      // Still open the dialog even if folders couldn't be loaded
      if (window.dialogManager) {
        window.dialogManager.openDialog(DIALOG_TYPES.EDIT_TEMPLATE, {
          template,
          formData,
          userFolders: []
        });
      }
    });
  };

  return {
    useTemplate: openPlaceholderEditor,
    editTemplate,
    createTemplate,
    finalizeTemplate: handleFinalizeTemplate
  };
} 