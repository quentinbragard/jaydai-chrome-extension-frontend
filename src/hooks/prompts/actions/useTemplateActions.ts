// src/hooks/prompts/actions/useTemplateActions.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Template } from '@/types/prompts/templates';
import { DIALOG_TYPES } from '@/core/dialogs/registry';
import { useTemplateMutations } from './useTemplateMutations';
import { useFolderMutations } from './useFolderMutations';
import { useQueryClient } from 'react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useDialogManager } from '@/components/dialogs/core/DialogContext';

/**
 * Helper function to safely access dialog manager
 */
const safelyOpenDialog = <T extends string>(type: T, data?: any): void => {
  // Check if dialog manager is ready
  if (window.dialogManager && window.dialogManager.isInitialized) {
    window.dialogManager.openDialog(type, data);
    return;
  }
  
  // Otherwise use a timeout to retry after dialog manager is initialized
  console.log(`Dialog manager not fully initialized. Will retry opening ${type} dialog...`);
  setTimeout(() => {
    if (window.dialogManager) {
      window.dialogManager.openDialog(type, data);
      console.log(`Successfully opened ${type} dialog after delay`);
    } else {
      console.error(`Failed to open ${type} dialog: dialog manager still not available`);
      toast.error('System not initialized properly. Please refresh the page.');
    }
  }, 100);
};

/**
 * Insert content into a ProseMirror-based contenteditable div
 * Handles multi-paragraph content and preserves ProseMirror-specific structure
 */
export const insertTemplateContent = (finalContent: string) => {
  if (!finalContent) {
    return;
  }

  try {
    // Find the textarea/contenteditable area
    const textarea = document.querySelector('#prompt-textarea');
    if (!textarea || !textarea.classList.contains('ProseMirror')) {
      toast.error('Could not find input area');
      return;
    }

    // Clean up the content
    const normalizedContent = finalContent.replace(/\r\n/g, '\n').trim();

    // Split content into paragraphs
    const paragraphs = normalizedContent.split('\n').filter(p => p.trim() !== '');

    // Generate ProseMirror-compatible HTML
    const paragraphsHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
    
    // Prepare full HTML with trailing break
    const fullHTML = paragraphsHTML 
      ? paragraphsHTML + '<p><br class="ProseMirror-trailingBreak"></p>' 
      : '<p><br class="ProseMirror-trailingBreak"></p>';

    // Create a mutation observer to wait for DOM update
    const observer = new MutationObserver((mutations, obs) => {
      const proseMirrorInstance = (textarea as any).__prosemirror;
      
      if (proseMirrorInstance) {
        // Use ProseMirror's setContent method if available
        proseMirrorInstance.setContent(fullHTML, { parseOptions: { preserveWhitespace: true } });
        
        // Focus the editor
        textarea.dispatchEvent(new Event('focus'));
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Disconnect the observer
        obs.disconnect();
      }
    });

    // Observe changes to the textarea
    observer.observe(textarea, { 
      childList: true, 
      subtree: true 
    });

    // Fallback direct innerHTML method
    textarea.innerHTML = fullHTML;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    toast.success('Template applied successfully');
  } catch (error) {
    console.error('Error applying template:', error);
    toast.error('Failed to apply template');
  }
};


/**
 * Hook that provides high-level template actions such as using, editing, creating templates
 */
export function useTemplateActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { trackTemplateUsage, createTemplate: createTemplateMutation } = useTemplateMutations();
  const { createFolder: createFolderMutation } = useFolderMutations();
  const queryClient = useQueryClient();
  const dialogManager = useDialogManager();

  /**
   * Use a template by opening the placeholder editor
   */
  const useTemplate = useCallback((template: Template) => {
    // Validation
    if (!template) {
      toast.error('Invalid template data');
      return;
    }

    if (!template.content) {
      toast.error('Template has no content');
      return;
    }

    setIsProcessing(true);

    try {
      // Use dialog manager from context first
      if (dialogManager) {
        dialogManager.openDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR, {
          content: template.content,
          title: template.title || 'Untitled Template',
          onComplete: handleTemplateFinalized
        });
      } else {
        // Fall back to window.dialogManager
        safelyOpenDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR, {
          content: template.content,
          title: template.title || 'Untitled Template',
          onComplete: handleTemplateFinalized
        });
      }

      // Track template usage in background (don't await)
      if (template.id) {
        trackTemplateUsage.mutate(template.id);
      }
    } catch (error) {
      console.error('Error using template:', error);
      toast.error('Failed to use template');
    } finally {
      setIsProcessing(false);
    }
  }, [trackTemplateUsage, dialogManager]);

  /**
 * Insert template content into a ProseMirror-style contenteditable div
 * @param finalContent The finalized template content to insert
 */
/**
 * Insert template content into a ProseMirror-style contenteditable div
 * @param finalContent The finalized template content to insert
 */

const handleTemplateFinalized = useCallback((finalContent: string) => {
  insertTemplateContent(finalContent);
  
  // Close the dialog
  if (dialogManager) {
    dialogManager.closeDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR);
  } else if (window.dialogManager) {
    window.dialogManager.closeDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR);
  }
}, [dialogManager]);

  

  /**
   * Open template editor to create a new template
   */
  const createTemplate = useCallback((initialFolder?: any) => {
    const dialogData = {
      formData: {
        name: '',
        content: '',
        description: '',
        folder: initialFolder?.name || '',
        folder_id: initialFolder?.id || undefined
      },
      userFolders: queryClient.getQueryData(QUERY_KEYS.USER_FOLDERS) || [], // Pass the current folder data
      onSave: async (templateData: any) => {
        try {
          // Use the mutation instead of calling API directly
          const result = await createTemplateMutation.mutateAsync({
            title: templateData.name,
            content: templateData.content,
            description: templateData.description,
            folder_id: templateData.folder_id
          });
  
          if (result) {
            // Force refresh templates
            queryClient.invalidateQueries(QUERY_KEYS.USER_TEMPLATES);
            queryClient.invalidateQueries(QUERY_KEYS.UNORGANIZED_TEMPLATES);
            queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
            
            return true; // This will close the dialog
          } else {
            toast.error('Failed to create template');
            return false; // Keep the dialog open
          }
        } catch (error) {
          console.error('Error creating template:', error);
          toast.error('An unexpected error occurred');
          return false;
        }
      }
    };
  
    // Use dialog manager from context first, then fall back to window
    if (dialogManager) {
      dialogManager.openDialog(DIALOG_TYPES.CREATE_TEMPLATE, dialogData);
    } else {
      safelyOpenDialog(DIALOG_TYPES.CREATE_TEMPLATE, dialogData);
    }
  }, [createTemplateMutation, queryClient, dialogManager]);

  /**
   * Create a folder then immediately open template creation dialog
   */
  const createFolderAndTemplate = useCallback(() => {
    try {
      const folderDialogData = {
        onSaveFolder: async (folderData: { name: string; path: string; description: string }) => {
          try {
            // Use the mutation instead of calling API directly
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
          
          // Open create template dialog with the new folder selected
          setTimeout(() => {
            createTemplate(newFolder);
          }, 100);
        }
      };
      
      // Use dialog manager from context first, then fall back to window
      if (dialogManager) {
        dialogManager.openDialog(DIALOG_TYPES.CREATE_FOLDER, folderDialogData);
      } else {
        safelyOpenDialog(DIALOG_TYPES.CREATE_FOLDER, folderDialogData);
      }
    } catch (error) {
      console.error('Error in folder/template creation flow:', error);
      toast.error('Failed to create folder');
    }
  }, [createTemplate, createFolderMutation, queryClient, dialogManager]);

  /**
   * Open template editor to edit an existing template
   */
  const editTemplate = useCallback((template: Template) => {
    if (!template || !template.id) {
      toast.error('Invalid template');
      return;
    }

    const dialogData = {
      template,
      formData: {
        name: template.title || '',
        content: template.content || '',
        description: template.description || '',
        folder: template.folder || '',
        folder_id: template.folder_id
      },
      userFolders: queryClient.getQueryData(QUERY_KEYS.USER_FOLDERS) || [], // Pass current folder data
      onSave: (templateData: any) => {
        // The actual saving will be handled by the dialog's internal logic
      }
    };

    // Use dialog manager from context first, then fall back to window
    if (dialogManager) {
      dialogManager.openDialog(DIALOG_TYPES.EDIT_TEMPLATE, dialogData);
    } else {
      safelyOpenDialog(DIALOG_TYPES.EDIT_TEMPLATE, dialogData);
    }
  }, [queryClient, dialogManager]);

  return {
    isProcessing,
    useTemplate,
    createTemplate,
    createFolderAndTemplate,
    editTemplate
  };
}