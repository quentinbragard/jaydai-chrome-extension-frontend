// src/services/TemplateService.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { promptApi } from './api/PromptApi';
import { toast } from 'sonner';
import { Template, TemplateFolder, TemplateFormData } from '@/types/templates';
import { DIALOG_TYPES } from '@/core/dialogs/registry';

// Key constants for query caching
const QUERY_KEYS = {
  PINNED_FOLDERS: 'pinnedFolders',
  USER_FOLDERS: 'userFolders',
  ALL_FOLDERS: 'allFolders',
  USER_TEMPLATES: 'userTemplates',
  USER_METADATA: 'userMetadata'
};

/**
 * Get user metadata including pinned folder IDs
 */
export function useUserMetadata() {
  return useQuery(QUERY_KEYS.USER_METADATA, async () => {
    const response = await promptApi.getUserMetadata();
    if (!response.success) {
      throw new Error(response.error || 'Failed to get user metadata');
    }
    return response.data;
  });
}

/**
 * Get all pinned folders (official and organization)
 */
export function usePinnedFolders() {
  const queryClient = useQueryClient();
  
  return useQuery(QUERY_KEYS.PINNED_FOLDERS, async () => {
    // First get user metadata to find pinned folder IDs
    const metadata = await promptApi.getUserMetadata();
    if (!metadata.success) {
      throw new Error(metadata.error || 'Failed to get user metadata');
    }
    
    // Get official pinned folders
    const officialIds = metadata.data?.pinned_official_folder_ids || [];
    let officialFolders: TemplateFolder[] = [];
    
    if (officialIds.length > 0) {
      const officialResponse = await promptApi.getPromptTemplatesFolders('official', officialIds);
      if (officialResponse.success) {
        officialFolders = officialResponse.folders.map(folder => ({
          ...folder,
          is_pinned: true
        }));
      }
    }
    
    // Get organization pinned folders
    const orgIds = metadata.data?.pinned_organization_folder_ids || [];
    let orgFolders: TemplateFolder[] = [];
    
    if (orgIds.length > 0) {
      const orgResponse = await promptApi.getPromptTemplatesFolders('organization', orgIds);
      if (orgResponse.success) {
        orgFolders = orgResponse.folders.map(folder => ({
          ...folder,
          is_pinned: true
        }));
      }
    }
    
    return {
      official: officialFolders,
      organization: orgFolders
    };
  }, {
    // Don't refetch on window focus to avoid unnecessary requests
    refetchOnWindowFocus: false,
    // Handle error
    onError: (error: any) => {
      toast.error(`Failed to load pinned folders: ${error.message}`);
    }
  });
}

/**
 * Get all user folders
 */
export function useUserFolders() {
  return useQuery(QUERY_KEYS.USER_FOLDERS, async () => {
    const response = await promptApi.getPromptTemplatesFolders('user');
    if (!response.success) {
      throw new Error(response.error || 'Failed to load user folders');
    }
    return response.folders;
  }, {
    refetchOnWindowFocus: false,
    onError: (error: any) => {
      toast.error(`Failed to load user folders: ${error.message}`);
    }
  });
}

/**
 * Get all folders of a specific type (for browsing)
 */
export function useAllFoldersOfType(type: 'official' | 'organization') {
  return useQuery([QUERY_KEYS.ALL_FOLDERS, type], async () => {
    // Load all folders of the specified type
    const response = await promptApi.getAllTemplateFolders(type, true);
    if (!response.success) {
      throw new Error(response.error || `Failed to load ${type} folders`);
    }
    
    // Get user metadata to determine which folders are pinned
    const metadata = await promptApi.getUserMetadata();
    if (!metadata.success) {
      throw new Error(metadata.error || 'Failed to get user metadata');
    }
    
    // Get pinned folder IDs based on folder type
    const pinnedIds = type === 'official' 
      ? metadata.data?.pinned_official_folder_ids || []
      : metadata.data?.pinned_organization_folder_ids || [];
    
    // Mark pinned status on each folder
    return response.folders.map(folder => ({
      ...folder,
      is_pinned: pinnedIds.includes(folder.id)
    }));
  }, {
    refetchOnWindowFocus: false,
    onError: (error: any) => {
      toast.error(`Failed to load ${type} folders: ${error.message}`);
    }
  });
}

/**
 * Pin or unpin a folder
 */
export function useToggleFolderPin() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async ({ folderId, isPinned, type }: { folderId: number, isPinned: boolean, type: 'official' | 'organization' }) => {
      const response = await promptApi.toggleFolderPin(folderId, isPinned, type);
      if (!response.success) {
        throw new Error(response.error || `Failed to ${isPinned ? 'unpin' : 'pin'} folder`);
      }
      return response;
    },
    {
      onSuccess: (_, variables) => {
        // Show success toast
        toast.success(variables.isPinned ? 'Folder unpinned' : 'Folder pinned');
        
        // Invalidate affected queries to trigger refetch
        queryClient.invalidateQueries(QUERY_KEYS.PINNED_FOLDERS);
        queryClient.invalidateQueries([QUERY_KEYS.ALL_FOLDERS, variables.type]);
        queryClient.invalidateQueries(QUERY_KEYS.USER_METADATA);
      },
      onError: (error: any) => {
        toast.error(error.message);
      }
    }
  );
}

/**
 * Delete a folder
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async (folderId: number) => {
      const response = await promptApi.deleteFolder(folderId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete folder');
      }
      return response;
    },
    {
      onSuccess: () => {
        toast.success('Folder deleted successfully');
        
        // Invalidate user folders query to trigger refetch
        queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
      },
      onError: (error: any) => {
        toast.error(`Failed to delete folder: ${error.message}`);
      }
    }
  );
}

/**
 * Create a folder
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async (folderData: { name: string, path: string, description?: string }) => {
      const response = await promptApi.createFolder(folderData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create folder');
      }
      return response;
    },
    {
      onSuccess: () => {
        toast.success('Folder created successfully');
        
        // Invalidate user folders query to trigger refetch
        queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
      },
      onError: (error: any) => {
        toast.error(`Failed to create folder: ${error.message}`);
      }
    }
  );
}

/**
 * Handle using a template
 */
export function useTemplateActions() {
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
  const handleFinalizeTemplate = (finalContent: string, onClose?: () => void) => {
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
      } else {
        textarea.textContent = formattedContent;
      }
      
      // Trigger input event to notify React of the change
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Focus the textarea
      textarea.focus();
      
      // Close dialog
      if (window.dialogManager) {
        window.dialogManager.closeDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR);
      }
      
      if (onClose) onClose();
      
      toast.success('Template applied successfully');
    } catch (error) {
      console.error('Template application error:', error);
      toast.error('Error applying template');
    }
  };

  // Helper to handle editing a template
  const openTemplateEditor = (template?: Template) => {
    if (!window.dialogManager) {
      toast.error('Dialog manager not available');
      return;
    }

    const dialogType = template ? DIALOG_TYPES.EDIT_TEMPLATE : DIALOG_TYPES.CREATE_TEMPLATE;
    
    // Create form data from template or use defaults
    const formData: TemplateFormData = template ? {
      name: template.title || '',
      content: template.content || '',
      description: template.description || '',
      folder: template.folder || '',
      folder_id: template.folder_id,
      based_on_official_id: null
    } : {
      name: '',
      content: '',
      description: '',
      folder: '',
      folder_id: undefined,
      based_on_official_id: null
    };

    window.dialogManager.openDialog(dialogType, {
      template,
      formData,
      onFormChange: () => {}, // Will be handled by the dialog itself
      onSave: () => true, // Will be handled by the dialog itself
      userFolders: [] // Will be fetched inside the dialog
    });
  };

  return {
    useTemplate: openPlaceholderEditor,
    editTemplate: openTemplateEditor,
    createTemplate: () => openTemplateEditor(),
    finalizeTemplate: handleFinalizeTemplate
  };
}