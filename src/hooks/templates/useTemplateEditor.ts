import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Template, TemplateFormData, DEFAULT_FORM_DATA } from '@/types/templates';
import { promptApi } from '@/services/api/PromptApi';

/**
 * Hook for managing template editing
 */
export function useTemplateEditor(onSaveSuccess?: () => Promise<void>) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>(DEFAULT_FORM_DATA);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Open editor for a new or existing template
  const openEditor = useCallback((template: Template | null) => {
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
  }, []);
  
  // Close the editor
  const closeEditor = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedTemplate(null);
    setTemplateFormData(DEFAULT_FORM_DATA);
    setError(null);
  }, []);
  
  // Save template (create or update)
  const saveTemplate = useCallback(async () => {
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
      
      setIsSubmitting(true);
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
        closeEditor();
        
        // Call the success callback if provided
        if (onSaveSuccess) {
          await onSaveSuccess();
        }
        
        return true;
      } else {
        const errorMessage = `Failed to ${selectedTemplate ? 'update' : 'create'} template: ${response?.error || 'Unknown error'}`;
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save template';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Template save error:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [templateFormData, selectedTemplate, closeEditor, onSaveSuccess]);
  
  // Delete a template
  const deleteTemplate = useCallback(async (template: Template, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Valid template check
    if (!template || !template.id) {
      toast.error('Invalid template selected');
      return false;
    }
    
    // Confirmation dialog
    if (!window.confirm(`Delete "${template.title || 'this template'}"?`)) return false;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await promptApi.deleteTemplate(template.id);
      
      if (response.success) {
        toast.success('Template deleted');
        
        // Call the success callback if provided
        if (onSaveSuccess) {
          await onSaveSuccess();
        }
        
        return true;
      } else {
        const errorMessage = `Failed to delete template: ${response.error || 'Unknown error'}`;
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Template delete error:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSaveSuccess]);

  return {
    // State
    selectedTemplate,
    templateFormData,
    editDialogOpen,
    isSubmitting,
    error,
    
    // Functions
    setTemplateFormData,
    openEditor,
    closeEditor,
    saveTemplate,
    deleteTemplate
  };
}

export default useTemplateEditor;