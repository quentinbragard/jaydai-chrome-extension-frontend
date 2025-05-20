import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Template } from '@/types/prompts/templates';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { useTemplateMutations } from './useTemplateMutations';
import { useFolderMutations } from './useFolderMutations';
import { useQueryClient } from 'react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { insertContentIntoChat, formatContentForInsertion } from '@/utils/templates/insertPrompt';
import { trackEvent, EVENTS, incrementUserProperty } from '@/utils/amplitude';
import { useBlockActions } from '../useBlockActions';

/**
 * A redesigned template action hook with support for block-based templates
 */
export function useTemplateActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { trackTemplateUsage, createTemplate: createTemplateMutation } = useTemplateMutations();
  const { createFolder: createFolderMutation } = useFolderMutations();
  const queryClient = useQueryClient();
  const dialogManager = useDialogManager();
  // Get block actions for block functionality
  const { useBlocks, groupBlocksByType } = useBlockActions();
  
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
 * Generate the final content with all blocks included
 */
const generateFinalContent = useCallback((expandedBlocks) => {
  if (!expandedBlocks || expandedBlocks.length === 0) {
    return '';
  }
  
  // Combine all block content with proper spacing
  return expandedBlocks.map(block => block.content || '').join('\n\n');
}, []);

/**
 * Handle template content after editing in the placeholder editor
 * with support for updated blocks
 */
const handleTemplateComplete = useCallback((finalContent: string, updatedBlocks: any[] = []) => {
  console.log('Template editing completed, content length:', finalContent?.length);
  console.log('Template blocks:', updatedBlocks);
  
  if (!finalContent && (!updatedBlocks || updatedBlocks.length === 0)) {
    console.error('No content received from template editor');
    toast.error('Template content is empty');
    return;
  }
  
  // If we have blocks with content, use that instead of finalContent
  const contentToInsert = updatedBlocks && updatedBlocks.length > 0 
    ? generateFinalContent(updatedBlocks)
    : finalContent;
  
  // Format content for insertion - normalizes newlines while preserving paragraph breaks
  const formattedContent = formatContentForInsertion(contentToInsert);
  
  // Insert the content with a small delay to ensure dialog is fully closed
  setTimeout(() => {
    const success = insertContentIntoChat(formattedContent);
    
    if (success) {
      // Only show toast on success
      toast.success('Template applied successfully');
      trackEvent(EVENTS.TEMPLATE_APPLIED);
      incrementUserProperty('template_usage_count', 1);
    } else {
      toast.error('Failed to apply template');
      trackEvent(EVENTS.TEMPLATE_APPLIED_ERROR, {
        error: 'Failed to apply template'
      });
    }
    
    // Dispatch an event to close the main button and panels
    document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
  }, 50);
}, [generateFinalContent]);

// Updated useTemplate function with block support
const useTemplate = useCallback((template: Template) => {
  // Validation
  if (!template) {
    toast.error('Invalid template data');
    trackEvent(EVENTS.TEMPLATE_APPLIED_ERROR, {
      error: 'Invalid template data'
    });
    return;
  }
  
  if (!template.content && (!template.expanded_blocks || template.expanded_blocks.length === 0)) {
    toast.error('Template has no content');
    trackEvent(EVENTS.TEMPLATE_APPLIED_ERROR, {
      error: 'Template has no content'
    });
    return;
  }
  
  console.log(`Using template: ${template.title || 'Untitled'}`);
  
  setIsProcessing(true);
  
  try {
    // Open the placeholder editor dialog with expanded blocks
    openDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR, {
      content: template.content || '',
      expandedBlocks: template.expanded_blocks || [],
      title: template.title || 'Untitled Template',
      type: template.type,
      id: template.id,
      onComplete: handleTemplateComplete
    });
    
    trackEvent(EVENTS.PLACEHOLDER_EDITOR_OPENED, {
      template_id: template.id,
      template_name: template.title,
      template_type: template.type
    });
    
    // Track template usage (don't await)
    if (template.id) {
      trackTemplateUsage.mutate(template.id);
    }
    
    // Close all panels when template is used
    document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
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
    // Fetch available blocks for selection
    const { data: availableBlocks = [] } = useBlocks();
    
    const dialogData = {
      formData: {
        name: '',
        content: '',
        description: '',
        folder: initialFolder?.name || '',
        folder_id: initialFolder?.id || undefined,
        blocks: [] // Initialize with empty blocks array
      },
      userFolders: queryClient.getQueryData(QUERY_KEYS.USER_FOLDERS) || [],
      availableBlocks: groupBlocksByType(availableBlocks || []),
      onSave: async (templateData: any) => {
        try {
          const result = await createTemplateMutation.mutateAsync({
            title: templateData.name,
            content: templateData.content,
            description: templateData.description,
            folder_id: templateData.folder_id,
            blocks: templateData.blocks || [], // Include blocks array
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
  }, [openDialog, createTemplateMutation, queryClient, groupBlocksByType, useBlocks]);
  
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
    if (!template || !template.id) {
      toast.error('Invalid template');
      return;
    }
    
    // Fetch available blocks for selection
    const { data: availableBlocks = [] } = useBlocks();
    
    const dialogData = {
      template,
      formData: {
        name: template.title || '',
        content: template.content || '',
        description: template.description || '',
        folder: template.folder || '',
        folder_id: template.folder_id,
        blocks: template.blocks || [] // Include existing blocks
      },
      userFolders: queryClient.getQueryData(QUERY_KEYS.USER_FOLDERS) || [],
      availableBlocks: groupBlocksByType(availableBlocks || []),
      // The saving will be handled by the dialog's internal logic
    };
    
    openDialog(DIALOG_TYPES.EDIT_TEMPLATE, dialogData);
    trackEvent(EVENTS.TEMPLATE_EDIT_DIALOG_OPENED, {
      template_id: template.id,
      template_name: template.title,
      template_type: template.type
    });
  }, [openDialog, queryClient, groupBlocksByType, useBlocks]);
  
  return {
    isProcessing,
    useTemplate,
    createTemplate,
    createFolderAndTemplate,
    editTemplate
  };
}