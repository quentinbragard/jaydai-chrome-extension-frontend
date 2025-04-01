// src/hooks/prompts/actions/useTemplateActions.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Template } from '@/types/prompts/templates';
import { DIALOG_TYPES } from '@/core/dialogs/registry'; // Updated import path
import { useTemplateMutations } from './useTemplateMutations';

/**
 * Hook that provides high-level template actions such as using, editing, creating templates
 */
export function useTemplateActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { trackTemplateUsage } = useTemplateMutations();

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
      // Check if dialog manager is available
      if (!window.dialogManager) {
        toast.error('System not initialized');
        setIsProcessing(false);
        return;
      }

      // Open placeholder editor dialog
      window.dialogManager.openDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR, {
        content: template.content,
        title: template.title || 'Untitled Template',
        onComplete: handleTemplateFinalized
      });

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
  }, [trackTemplateUsage]);

  /**
   * Apply finalized template content to prompt input area
   */
  const handleTemplateFinalized = useCallback((finalContent: string) => {
    if (!finalContent) {
      return;
    }

    try {
      // Find the textarea to insert content into
      const textarea = document.querySelector('#prompt-textarea');
      if (!textarea) {
        toast.error('Could not find input area');
        return;
      }

      // Clean up the content
      const normalizedContent = finalContent.replace(/\r\n/g, '\n');
      
      // Insert content based on element type
      if (textarea instanceof HTMLTextAreaElement) {
        // Standard textarea
        textarea.value = normalizedContent;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (textarea.isContentEditable) {
        // ContentEditable div (like ChatGPT)
        textarea.textContent = normalizedContent;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // Fallback for other element types
        textarea.textContent = normalizedContent;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Focus the textarea and set cursor at the end
      textarea.focus();
      if ('setSelectionRange' in textarea) {
        (textarea as HTMLTextAreaElement).setSelectionRange(
          normalizedContent.length,
          normalizedContent.length
        );
      }

      // Close the dialog
      if (window.dialogManager) {
        window.dialogManager.closeDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR);
      }

      toast.success('Template applied successfully');
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to apply template');
    }
  }, []);

  /**
   * Open template editor to create a new template
   */
  const createTemplate = useCallback((initialFolder?: any) => {
    if (!window.dialogManager) {
      toast.error('System not initialized');
      return;
    }

    window.dialogManager.openDialog(DIALOG_TYPES.CREATE_TEMPLATE, {
      formData: {
        name: '',
        content: '',
        description: '',
        folder: initialFolder?.name || '',
        folder_id: initialFolder?.id || undefined
      },
      onSave: (templateData: any) => {
        // The actual saving will be handled by the dialog's internal logic
        // This is just for any additional actions after save
      }
    });
  }, []);

  /**
   * Create a folder then immediately open template creation dialog
   */
  const createFolderAndTemplate = useCallback(() => {
    try {
      // Open create folder dialog
      if (window.dialogManager) {
        window.dialogManager.openDialog(DIALOG_TYPES.CREATE_FOLDER, {
          onSaveFolder: async (folderData: { name: string; path: string; description: string }) => {
            return folderData;
          },
          onFolderCreated: (newFolder: any) => {
            // Open create template dialog with the new folder selected
            setTimeout(() => {
              createTemplate(newFolder);
            }, 100);
          }
        });
      }
    } catch (error) {
      console.error('Error in folder/template creation flow:', error);
      toast.error('Failed to create folder');
    }
  }, [createTemplate]);

  /**
   * Open template editor to edit an existing template
   */
  const editTemplate = useCallback((template: Template) => {
    if (!window.dialogManager) {
      toast.error('System not initialized');
      return;
    }

    if (!template || !template.id) {
      toast.error('Invalid template');
      return;
    }

    window.dialogManager.openDialog(DIALOG_TYPES.EDIT_TEMPLATE, {
      template,
      formData: {
        name: template.title || '',
        content: template.content || '',
        description: template.description || '',
        folder: template.folder || '',
        folder_id: template.folder_id
      },
      onSave: (templateData: any) => {
        // The actual saving will be handled by the dialog's internal logic
      }
    });
  }, []);

  return {
    isProcessing,
    useTemplate,
    createTemplate,
    createFolderAndTemplate,
    editTemplate
  };
}