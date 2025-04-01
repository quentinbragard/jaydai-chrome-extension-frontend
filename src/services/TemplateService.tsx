// src/services/TemplateService.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { promptApi } from './api/PromptApi';
import { toast } from 'sonner';
import { Template, TemplateFolder, TemplateFormData } from '@/types/templates';
import { DIALOG_TYPES } from '@/core/dialogs/registry';
import { getCurrentLanguage } from '@/core/utils/i18n';

// Key constants for query caching
const QUERY_KEYS = {
  PINNED_FOLDERS: 'pinnedFolders',
  USER_FOLDERS: 'userFolders',
  ALL_FOLDERS: 'allFolders',
  USER_TEMPLATES: 'userTemplates',
  UNORGANIZED_TEMPLATES: 'unorganizedTemplates', // Add this new key
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
  // Get the user's current language
  const userLocale = getCurrentLanguage();
  
  return useQuery(QUERY_KEYS.PINNED_FOLDERS, async () => {
    // First get user metadata to find pinned folder IDs
    const metadata = await promptApi.getUserMetadata();
    if (!metadata.success) {
      throw new Error(metadata.error || 'Failed to get user metadata');
    }
    
    // Get official pinned folders with locale filtering
    const officialIds = metadata.data?.pinned_official_folder_ids || [];
    let officialFolders: TemplateFolder[] = [];
    
    if (officialIds.length > 0) {
      const officialResponse = await promptApi.getPromptTemplatesFolders('official', officialIds, false, userLocale);
      if (officialResponse.success) {
        officialFolders = officialResponse.folders.map(folder => ({
          ...folder,
          is_pinned: true
        }));
      }
    }
    
    // Get organization pinned folders with locale filtering
    const orgIds = metadata.data?.pinned_organization_folder_ids || [];
    let orgFolders: TemplateFolder[] = [];
    
    if (orgIds.length > 0) {
      const orgResponse = await promptApi.getPromptTemplatesFolders('organization', orgIds, false, userLocale);
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
 * Get all folders of a specific type (for browsing)
 */
export function useAllFoldersOfType(type: 'official' | 'organization') {
  // Get the user's current language
  const userLocale = getCurrentLanguage();
  
  return useQuery([QUERY_KEYS.ALL_FOLDERS, type], async () => {
    // Load all folders of the specified type with locale filtering
    const response = await promptApi.getAllTemplateFolders(type, true, userLocale);
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
 * Get all user folders and include root templates
 */
export function useUserFolders() {
  return useQuery(QUERY_KEYS.USER_FOLDERS, async () => {
    const response = await promptApi.getPromptTemplatesFolders('user', [], true);
    if (!response.success) {
      throw new Error(response.error || 'Failed to load user folders');
    }
    
    // Also fetch user templates to properly handle templates with null folder_id
    const templatesResponse = await promptApi.getUserTemplates();
    
    if (templatesResponse.success && templatesResponse.templates) {
      // Create a map of folder ID to folder for easy lookup
      const folderMap = new Map();
      response.folders.forEach(folder => {
        folderMap.set(folder.id, folder);
        
        // Initialize templates array if not present
        if (!folder.templates) {
          folder.templates = [];
        }
      });
      
      // Process all templates
      templatesResponse.templates.forEach(template => {
        if (template.folder_id === null) {
          // For templates with null folder_id, add to a virtual root folder
          // We'll create a virtual root folder if it doesn't exist yet
          if (!folderMap.has('root')) {
            const rootFolder = {
              id: 'root',
              name: 'Root',
              path: '/',
              templates: [],
              Folders: [],
              type: 'user'
            };
            folderMap.set('root', rootFolder);
            response.folders.push(rootFolder);
          }
          
          // Add the template to the root folder
          const rootFolder = folderMap.get('root');
          rootFolder.templates.push(template);
        } else if (folderMap.has(template.folder_id)) {
          // For templates with a valid folder_id, add to the corresponding folder
          const folder = folderMap.get(template.folder_id);
          folder.templates.push(template);
        }
      });
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
 * Get all templates with null folder_id (unorganized templates)
 */
export function useUnorganizedTemplates() {
  return useQuery(
    [QUERY_KEYS.USER_TEMPLATES, 'unorganized'], 
    async () => {
      const response = await promptApi.getUnorganizedTemplates();
      if (!response.success) {
        throw new Error(response.error || 'Failed to load unorganized templates');
      }
      return response.templates || [];
    }, 
    {
      refetchOnWindowFocus: false,
      onError: (error: any) => {
        toast.error(`Failed to load unorganized templates: ${error.message}`);
      }
    }
  );
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
      },
      // Add optimistic update
      onMutate: async (newFolder) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(QUERY_KEYS.USER_FOLDERS);
        
        // Snapshot the previous value
        const previousFolders = queryClient.getQueryData(QUERY_KEYS.USER_FOLDERS);
        
        // Optimistically update to the new value
        queryClient.setQueryData(QUERY_KEYS.USER_FOLDERS, (old: any) => {
          // Create a placeholder folder with temporary ID
          const tempFolder = {
            id: Date.now(), // Temporary ID
            name: newFolder.name,
            path: newFolder.path,
            description: newFolder.description,
            templates: [],
            Folders: []
          };
          
          return [...(old || []), tempFolder];
        });
        
        // Return a context object with the snapshotted value
        return { previousFolders };
      },
      // If the mutation fails, use the context returned from onMutate to roll back
      onError: (err, newFolder, context) => {
        if (context?.previousFolders) {
          queryClient.setQueryData(QUERY_KEYS.USER_FOLDERS, context.previousFolders);
        }
      }
    }
  );
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const userLocale = getCurrentLanguage();
  console.log('useCreateTemplate');
  
  return useMutation(
    async (templateData: TemplateFormData) => {
      console.log('useCreateTemplate', templateData);
      // Prepare template data for the API
      const apiTemplateData = {
        title: templateData.name,
        content: templateData.content,
        description: templateData.description,
        folder_id: templateData.folder_id,
        tags: [],
        locale: userLocale
      };
      
      const response = await promptApi.createTemplate(apiTemplateData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create template');
      }
      return response;
    },
    {
      onSuccess: () => {
        toast.success('Template created successfully');
        
        // Invalidate all affected queries to ensure everything is refreshed
        queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
        queryClient.invalidateQueries(QUERY_KEYS.UNORGANIZED_TEMPLATES);
        
        // If you have a specific templates query, invalidate that too
        queryClient.invalidateQueries(QUERY_KEYS.USER_TEMPLATES);
      },
      onError: (error: any) => {
        toast.error(`Failed to create template: ${error.message}`);
      }
    }
  );
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async ({ templateId, templateData }: { templateId: number, templateData: TemplateFormData }) => {
      // Prepare template data for the API
      const apiTemplateData = {
        title: templateData.name,
        content: templateData.content,
        description: templateData.description,
        folder_id: templateData.folder_id,
        tags: []
      };
      
      const response = await promptApi.updateTemplate(templateId, apiTemplateData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update template');
      }
      return response;
    },
    {
      onSuccess: () => {
        toast.success('Template updated successfully');
        
        // Invalidate all affected queries for a complete refresh
        queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
        queryClient.invalidateQueries(QUERY_KEYS.UNORGANIZED_TEMPLATES);
        queryClient.invalidateQueries(QUERY_KEYS.USER_TEMPLATES);
      },
      onError: (error: any) => {
        toast.error(`Failed to update template: ${error.message}`);
      }
    }
  );
}

/**
 * Delete a template with improved cache invalidation
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async (templateId: number) => {
      const response = await promptApi.deleteTemplate(templateId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete template');
      }
      return response;
    },
    {
      onSuccess: () => {
        toast.success('Template deleted successfully');
        
        // Invalidate all affected queries for a complete refresh
        queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
        queryClient.invalidateQueries(QUERY_KEYS.UNORGANIZED_TEMPLATES);
        queryClient.invalidateQueries(QUERY_KEYS.USER_TEMPLATES);
      },
      onError: (error: any) => {
        toast.error(`Failed to delete template: ${error.message}`);
      }
    }
  );
}
/**
 * Handle using a template with improved cache management
 */
export function useTemplateActions() {
  const queryClient = useQueryClient();
  const createTemplateMutation = useCreateTemplate();
  const updateTemplateMutation = useUpdateTemplate();
  const deleteTemplateMutation = useDeleteTemplate();

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
      
      // Refresh usage information
      queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
      queryClient.invalidateQueries(QUERY_KEYS.UNORGANIZED_TEMPLATES);
    } catch (error) {
      console.error('Template application error:', error);
      toast.error('Error applying template');
    }
  };

  // Helper to handle saving a template (create or update)
  const saveTemplate = async (template: Template | null, formData: TemplateFormData) => {
    try {
      if (template?.id) {
        // Update existing template
        await updateTemplateMutation.mutateAsync({
          templateId: template.id,
          templateData: formData
        });
      } else {
        // Create new template
        await createTemplateMutation.mutateAsync(formData);
      }
      
      // Ensure fresh data by triggering refetches after a short delay
      // to allow the backend to process the changes
      setTimeout(() => {
        queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
        queryClient.invalidateQueries(QUERY_KEYS.UNORGANIZED_TEMPLATES);
        queryClient.invalidateQueries(QUERY_KEYS.USER_TEMPLATES);
      }, 300);
      
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      return false;
    }
  };

  // Helper to handle deleting a template
  const deleteTemplate = async (templateId: number) => {
    try {
      await deleteTemplateMutation.mutateAsync(templateId);
      
      // Ensure fresh data
      setTimeout(() => {
        queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
        queryClient.invalidateQueries(QUERY_KEYS.UNORGANIZED_TEMPLATES);
        queryClient.invalidateQueries(QUERY_KEYS.USER_TEMPLATES);
      }, 300);
      
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  };

  // Helper to handle editing a template
  const openTemplateEditor = (template?: Template, selectedFolder?: any) => {
    if (!window.dialogManager) {
      toast.error('Dialog manager not available');
      return;
    }

    const dialogType = template ? DIALOG_TYPES.EDIT_TEMPLATE : DIALOG_TYPES.CREATE_TEMPLATE;
    
    // Create form data from template or use defaults
    const formData = template ? {
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
      folder: selectedFolder?.name || '',
      folder_id: selectedFolder?.id,
      based_on_official_id: null
    };

    // Load user folders asynchronously
    promptApi.getUserFolders().then(foldersResult => {
      // Open template dialog with the folders
      window.dialogManager.openDialog(dialogType, {
        template,
        formData,
        selectedFolder, // Pass the selected folder if available
        onFormChange: () => {}, // Will be handled by the dialog itself
        onSave: (updatedFormData: TemplateFormData) => saveTemplate(template, updatedFormData),
        userFolders: foldersResult.folders || []
      });
    }).catch(error => {
      console.error('Error loading user folders:', error);
      
      // Still open the dialog even if folders couldn't be loaded
      window.dialogManager.openDialog(dialogType, {
        template,
        formData,
        selectedFolder,
        onFormChange: () => {},
        onSave: (updatedFormData: TemplateFormData) => saveTemplate(template, updatedFormData),
        userFolders: []
      });
    });
  };

  return {
    useTemplate: openPlaceholderEditor,
    editTemplate: (template: Template) => openTemplateEditor(template),
    createTemplate: (selectedFolder?: any) => openTemplateEditor(undefined, selectedFolder),
    finalizeTemplate: handleFinalizeTemplate,
    saveTemplate,
    deleteTemplate
  };
}