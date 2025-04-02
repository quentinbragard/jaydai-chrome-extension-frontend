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
 * A completely redesigned template action hook with improved reliability
 * and cleaner content flow
 */
export function useTemplateActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { trackTemplateUsage, createTemplate: createTemplateMutation } = useTemplateMutations();
  const { createFolder: createFolderMutation } = useFolderMutations();
  const queryClient = useQueryClient();
  const dialogManager = useDialogManager();
  
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
  
  /**
   * Insert template content directly into the ChatGPT textarea
   */
  const insertContentIntoChat = useCallback((content: string) => {
    if (!content) {
      console.error('No content to insert');
      return false;
    }
    
    console.log(`Attempting to insert content (${content.length} chars)`);
    
    try {
      // Find the textarea
      const textarea = document.querySelector('#prompt-textarea');
      if (!textarea) {
        console.error('Could not find #prompt-textarea element');
        toast.error('Could not find input area');
        return false;
      }
      
      // Normalize content
      const normalizedContent = content.replace(/\r\n/g, '\n').trim();
      console.log('Content normalized');
      
      // ---- Method 1: Event-based insertion ----
      try {
        // Make sure textarea is in focus
        textarea.focus();
        
        // For regular textareas
        if (textarea instanceof HTMLTextAreaElement) {
          console.log('Using HTMLTextAreaElement approach');
          textarea.value = normalizedContent;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        
        // For contenteditable divs
        if (textarea instanceof HTMLElement) {
          console.log('Using contenteditable approach');
          
          // Generate HTML paragraphs
          const paragraphs = normalizedContent.split('\n').filter(p => p.trim() !== '');
          const paragraphsHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
          
          // Set content directly
          textarea.innerHTML = paragraphsHTML;
          
          // Trigger input event
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Set selection at the end
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(textarea);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
          
          return true;
        }
      } catch (e) {
        console.warn('Method 1 failed:', e);
        // Continue to next method
      }
      
      // ---- Method 2: Data transfer/clipboard approach ----
      try {
        console.log('Trying clipboard data transfer approach');
        
        // Create a data transfer to simulate paste
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', normalizedContent);
        
        // Create and dispatch events
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        
        textarea.dispatchEvent(pasteEvent);
        
        // Check if the event was handled
        if (!pasteEvent.defaultPrevented) {
          throw new Error('Paste event not handled');
        }
        
        return true;
      } catch (e) {
        console.warn('Method 2 failed:', e);
        // Continue to next method
      }
      
      // ---- Method 3: Command insertion ----
      try {
        console.log('Trying document.execCommand approach');
        
        // Fallback to execCommand (though deprecated)
        document.execCommand('insertText', false, normalizedContent);
        return true;
      } catch (e) {
        console.warn('Method 3 failed:', e);
        // Continue to next method
      }
      
      // ---- Method 4: Basic innerHTML approach ----
      try {
        console.log('Trying basic innerHTML approach');
        
        if (textarea instanceof HTMLElement) {
          // Generate clean HTML
          const paragraphs = normalizedContent.split('\n').filter(p => p.trim() !== '');
          const paragraphsHTML = paragraphs.length > 0
            ? paragraphs.map(p => `<p>${p}</p>`).join('')
            : '<p><br></p>';
          
          // Set content directly
          textarea.innerHTML = paragraphsHTML;
          
          // Trigger synthetic input events
          ['input', 'change'].forEach(eventType => {
            textarea.dispatchEvent(new Event(eventType, { bubbles: true }));
          });
          
          return true;
        }
      } catch (e) {
        console.warn('Method 4 failed:', e);
      }
      
      console.error('All insertion methods failed');
      toast.error('Could not insert template content');
      return false;
    } catch (error) {
      console.error('Error inserting template content:', error);
      toast.error('Failed to apply template');
      return false;
    }
  }, []);
  
  /**
   * Handle template content after editing in the placeholder editor
   */
  const handleTemplateComplete = useCallback((finalContent: string) => {
    console.log('Template editing completed, content length:', finalContent?.length);
    
    // Insert the content with a small delay to ensure dialog is fully closed
    setTimeout(() => {
      insertContentIntoChat(finalContent);
    }, 50);
  }, [insertContentIntoChat]);
  
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
    
    console.log(`Using template: ${template.title || 'Untitled'}`);
    setIsProcessing(true);
    
    try {
      // Open the placeholder editor dialog
      openDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR, {
        content: template.content,
        title: template.title || 'Untitled Template',
        onComplete: handleTemplateComplete
      });
      
      // Track template usage (don't await)
      if (template.id) {
        trackTemplateUsage.mutate(template.id);
      }
    } catch (error) {
      console.error('Error using template:', error);
      toast.error('Failed to open template editor');
    } finally {
      setIsProcessing(false);
    }
  }, [openDialog, handleTemplateComplete, trackTemplateUsage]);
  
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
      userFolders: queryClient.getQueryData(QUERY_KEYS.USER_FOLDERS) || [],
      onSave: async (templateData: any) => {
        try {
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
            
            return true; // Close dialog
          } else {
            toast.error('Failed to create template');
            return false; // Keep dialog open
          }
        } catch (error) {
          console.error('Error creating template:', error);
          toast.error('An unexpected error occurred');
          return false;
        }
      }
    };
    
    openDialog(DIALOG_TYPES.CREATE_TEMPLATE, dialogData);
  }, [openDialog, createTemplateMutation, queryClient]);
  
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
      userFolders: queryClient.getQueryData(QUERY_KEYS.USER_FOLDERS) || []
      // The saving will be handled by the dialog's internal logic
    };
    
    openDialog(DIALOG_TYPES.EDIT_TEMPLATE, dialogData);
  }, [openDialog, queryClient]);
  
  return {
    isProcessing,
    useTemplate,
    createTemplate,
    createFolderAndTemplate,
    editTemplate
  };
}