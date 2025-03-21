// src/features/Templates/hooks/useTemplates.ts
import { useState, useCallback, useEffect } from 'react';
import { Template, TemplateFormData } from '../types';
import { toast } from 'sonner';
import { promptApi } from '@/api/PromptApi';
import { useFolders } from './useFolders';

// Default form data
const DEFAULT_FORM_DATA: TemplateFormData = {
  name: '',
  content: '',
  description: '',
  folder: '',
  based_on_official_id: null
};

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
  
  // Current folder context - store the current folder when creating a template
  const [currentFolderContext, setCurrentFolderContext] = useState<string | null>(null);

  // Incorporate the folders error into our error state
  useEffect(() => {
    if (foldersError) {
      setError(foldersError);
    }
  }, [foldersError]);

  // Handle template usage
  const handleUseTemplate = async (template: Template) => {
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
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.value = finalContent;
      } else {
        textarea.textContent = finalContent;
      }
      
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.focus();
      
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
  const openEditDialog = (template: Template | null, folderPath?: string) => {
    setSelectedTemplate(template);
    
    // If folder path is provided, use it (for creating a template in a specific folder)
    if (folderPath) {
      setCurrentFolderContext(folderPath);
    } else {
      setCurrentFolderContext(null);
    }
    
    setTemplateFormData(template ? {
      name: template.title || '',
      content: template.content || '',
      description: template.description || '',
      folder: template.folder || template.path || '',
      based_on_official_id: template.based_on_official_id ?? null
    } : {
      ...DEFAULT_FORM_DATA,
      folder: folderPath || '' // Use the provided folder path if available
    });
    
    setEditDialogOpen(true);
  };
  
  const handleSaveTemplate = useCallback(async () => {
    try {
      if (!templateFormData.name || !templateFormData.content) {
        toast.error('Name and content are required');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // If we have a current folder context but no folder specified in the form,
      // use the folder context
      const folderToUse = templateFormData.folder || currentFolderContext || '';
      
      // Prepare template data
      const templateData = {
        name: templateFormData.name,
        content: templateFormData.content,
        description: templateFormData.description || '',
        folder: folderToUse,
        based_on_official_id: templateFormData.based_on_official_id
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
      
      if (response.success) {
        toast.success(selectedTemplate ? 'Template updated' : 'Template created');
        setEditDialogOpen(false);
        
        // Refresh folders to show the new or updated template
        await loadFolders();
      } else {
        const errorMessage = `Failed to ${selectedTemplate ? 'update' : 'create'} template: ${response.error || 'Unknown error'}`;
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
  }, [templateFormData, currentFolderContext, selectedTemplate, loadFolders]);
  
  const handleDeleteTemplate = useCallback(async (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${template.title}"?`)) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (!template.id) {
        toast.error('Template ID is missing');
        return;
      }
      
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
    refreshFolders: retryLoading,
    createFolder,
    deleteFolder,
    toggleFolderPin,
    currentFolderContext
  };
}