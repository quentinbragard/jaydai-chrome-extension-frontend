// src/components/MainButton/hooks/useTemplates.ts
import { useState, useCallback, useEffect } from 'react';
import { Template, TemplateFormData, DEFAULT_FORM_DATA } from '../MenuPanel/TemplatesPanel/types';
import { toast } from 'sonner';
import { promptApi } from '@/api/PromptApi';
import { useFolders } from './useFolders';

export function useTemplates() {
  // Get folder functionality
  const { 
    pinnedOfficialFolders, 
    pinnedOrganizationFolders, 
    userFolders, 
    loading: foldersLoading, 
    loadFolders,
    createFolder,
    deleteFolder,
    toggleFolderPin,
    error: foldersError
  } = useFolders();
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>(DEFAULT_FORM_DATA);
  const [placeholderEditorOpen, setPlaceholderEditorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Incorporate the folders error into our error state
  useEffect(() => {
    if (foldersError) {
      setError(foldersError);
    }
  }, [foldersError]);

  // Handle template usage
  const handleUseTemplate = async (template: Template) => {
    // Valid template check
    if (!template || !template.content) {
      toast.error('Invalid template selected');
      return;
    }
    
    setSelectedTemplate(template);
    setPlaceholderEditorOpen(true);
    
    // Track template usage
    try {
      if (template.id) {
        await promptApi.trackTemplateUsage(template.id);
      }
    } catch (error) {
      // Silent fail for usage tracking - doesn't affect user experience
      console.error('Failed to track template usage:', error);
    }
  };
  
  // Apply template content
  const handleFinalizeTemplate = (finalContent: string, onClose?: () => void) => {
    const textarea = document.querySelector('#prompt-textarea');
    if (!textarea) {
      toast.error('Could not find input area');
      return;
    }

    try {
      // Normalize line breaks and trim excess whitespace
      const formattedContent = finalContent
        .replace(/\r\n/g, '\n')  // Normalize line breaks
        .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines
        .trim();  // Remove leading/trailing whitespace

      if (textarea instanceof HTMLTextAreaElement) {
        // If it's a textarea, set the value directly
        textarea.value = formattedContent;
      } else {
        // For contenteditable divs, set textContent
        textarea.textContent = formattedContent;
      }
      
      // Trigger input event to notify React of the change
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Focus the textarea
      textarea.focus();
      
      // If the textarea supports setting cursor position
      if ('setSelectionRange' in textarea) {
        (textarea as HTMLTextAreaElement).setSelectionRange(
          formattedContent.length, 
          formattedContent.length
        );
      }
      
      toast.success('Template applied');
      setPlaceholderEditorOpen(false);
      setSelectedTemplate(null);
      if (onClose) onClose();
    } catch (error) {
      toast.error('Failed to apply template');
      console.error('Template application error:', error);
    }
  };
  
  // Template CRUD operations
  const openEditDialog = (template: Template | null) => {
    setSelectedTemplate(template);
    
    // Initialize form data from template or defaults
    setTemplateFormData(template ? {
      name: template.title || '',
      content: template.content || '',
      description: template.description || '',
      folder: template.folder || '',
      folder_id: template.folder_id,
      based_on_official_id: null
    } : DEFAULT_FORM_DATA);
    
    setEditDialogOpen(true);
  };
  
  // Save or update a template
  const handleSaveTemplate = useCallback(async () => {
    try {
      // Form validation
      if (!templateFormData.name?.trim()) {
        toast.error('Template name is required');
        return;
      }
      
      if (!templateFormData.content?.trim()) {
        toast.error('Template content is required');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Prepare template data for backend 
      // Notice we're sending folder_id directly as expected by the backend
      const templateData = {
        title: templateFormData.name.trim(),  // Backend expects 'title'
        content: templateFormData.content.trim(),
        folder_id: templateFormData.folder_id,
        tags: [],           // Optional in backend
        locale: chrome.i18n.getUILanguage() || 'en'  // Fallback to 'en' if no language is available
      };
      
      console.log('Saving template with data:', templateData);
      
      let response;
      
      if (selectedTemplate?.id) {
        // Update existing template
        response = await promptApi.updateTemplate(selectedTemplate.id, templateData);
      } else {
        // Create new template
        response = await promptApi.createTemplate(templateData);
      }
      
      console.log('Template save response:', response);
      
      if (response && response.success) {
        toast.success(selectedTemplate ? 'Template updated' : 'Template created');
        setEditDialogOpen(false);
        
        // Clear form data and selection
        setTemplateFormData(DEFAULT_FORM_DATA);
        setSelectedTemplate(null);
        
        // Refresh folders to show the new or updated template
        await loadFolders();
      } else {
        const errorMessage = `Failed to ${selectedTemplate ? 'update' : 'create'} template: ${response?.error || 'Unknown error'}`;
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save template';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Template save error:', error);
    } finally {
      setLoading(false);
    }
  }, [templateFormData, selectedTemplate, loadFolders]);
  
  // Delete a template with confirmation
  const handleDeleteTemplate = useCallback(async (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Valid template check
    if (!template || !template.id) {
      toast.error('Invalid template selected');
      return;
    }
    
    // Confirmation dialog
    if (!window.confirm(`Delete "${template.title || 'this template'}"?`)) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await promptApi.deleteTemplate(template.id);
      
      if (response.success) {
        toast.success('Template deleted');
        
        // Refresh folders to update the UI
        await loadFolders();
      } else {
        const errorMessage = `Failed to delete template: ${response.error || 'Unknown error'}`;
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Template delete error:', error);
    } finally {
      setLoading(false);
    }
  }, [loadFolders]);
  
  // Create a new folder and select it immediately in the template form
  const handleCreateFolder = useCallback(async (folderData: { name: string; path: string; description: string }) => {
    try {
      setLoading(true);
      const success = await createFolder(folderData);
      
      if (success) {
        // Refresh folders
        await loadFolders();
        
        // Get the newly created folder
        const userFoldersResponse = await promptApi.getUserFolders();
        if (userFoldersResponse.success && userFoldersResponse.folders) {
          const newFolder = userFoldersResponse.folders.find(f => f.name === folderData.name);
          
          if (newFolder) {
            // Update the template form with the new folder
            setTemplateFormData(prev => ({
              ...prev,
              folder_id: newFolder.id,
              folder: newFolder.name
            }));
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error creating folder:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [createFolder, loadFolders]);
  
  // Function to retry loading if there was an error
  const retryLoading = useCallback(async () => {
    setError(null);
    try {
      await loadFolders();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load templates';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [loadFolders]);
  
  return {
    loading: loading || foldersLoading,
    error,
    editDialogOpen,
    setEditDialogOpen,
    selectedTemplate,
    templateFormData,
    setTemplateFormData,
    placeholderEditorOpen,
    setPlaceholderEditorOpen,
    pinnedOfficialFolders,
    pinnedOrganizationFolders,
    userFolders,
    handleUseTemplate,
    handleFinalizeTemplate,
    openEditDialog,
    handleSaveTemplate,
    handleDeleteTemplate,
    handleCreateFolder,
    refreshFolders: retryLoading,
    createFolder,
    deleteFolder,
    toggleFolderPin
  };
}