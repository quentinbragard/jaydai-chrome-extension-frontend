import { useState, useCallback } from 'react';
import { Template, TemplateFormData, DEFAULT_FORM_DATA } from '@/types/templates';
import { useTemplateFolders } from './useTemplateFolders';
import { useTemplateEditor } from './useTemplateEditor';
import { toast } from 'sonner';

/**
 * Main templates hook that consolidates template functionality
 * This hook combines functionality from specialized hooks and adds template usage-specific features
 */
export function useTemplates() {
  const [placeholderEditorOpen, setPlaceholderEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>(DEFAULT_FORM_DATA);
  
  // Use specialized hooks
  const folderManager = useTemplateFolders();
  const templateEditor = useTemplateEditor(folderManager.loadFolders);
  
  // Create a combined hook object for easy use
  const { editDialogOpen, setEditDialogOpen, isSubmitting, error } = templateEditor;
  
  // Function to open the template editor dialog
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
  }, [setEditDialogOpen]);
  
  // Handle saving a template
  const handleSaveTemplate = useCallback(async () => {
    try {
      // Form validation
      if (!templateFormData.name?.trim()) {
        toast.error('Template name is required');
        return false;
      }
      
      if (!templateFormData.content?.trim()) {
        toast.error('Template content is required');
        return false;
      }
      
      // Delegate to the editor hook
      const success = await templateEditor.saveTemplate();
      
      if (success) {
        // Reset template selection and form when saved successfully
        setSelectedTemplate(null);
        setTemplateFormData(DEFAULT_FORM_DATA);
        
        // Refresh the folders list to show the new template
        await folderManager.loadFolders();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
      return false;
    }
  }, [templateFormData, templateEditor, folderManager.loadFolders]);
  
  // Handle using a template (opening placeholder editor)
  const handleUseTemplate = useCallback((template: Template) => {
    // Valid template check
    if (!template || !template.content) {
      console.error('Invalid template selected');
      return;
    }
    
    setSelectedTemplate(template);
    setPlaceholderEditorOpen(true);
    
    // Track template usage in the background
    if (template.id) {
      // This is fire-and-forget, we don't wait for the result
      import('@/services/api/PromptApi').then(({ promptApi }) => {
        promptApi.trackTemplateUsage(template.id);
      }).catch(err => {
        console.error('Failed to track template usage:', err);
      });
    }
  }, []);
  
  // Handle finalizing and applying a template
  const handleFinalizeTemplate = useCallback((finalContent: string, onClose?: () => void) => {
    const textarea = document.querySelector('#prompt-textarea');
    if (!textarea) {
      console.error('Could not find input area');
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
      
      setPlaceholderEditorOpen(false);
      setSelectedTemplate(null);
      setTemplateFormData(DEFAULT_FORM_DATA);
      
      if (onClose) onClose();
    } catch (error) {
      console.error('Template application error:', error);
    }
  }, []);

  return {
    // Folders state from folderManager
    pinnedOfficialFolders: folderManager.pinnedOfficialFolders,
    pinnedOrganizationFolders: folderManager.pinnedOrganizationFolders,
    userFolders: folderManager.userFolders,
    loading: folderManager.loading,
    error: folderManager.error || error,
    refreshFolders: folderManager.loadFolders,
    
    // Editor state
    editDialogOpen, 
    setEditDialogOpen,
    selectedTemplate,
    templateFormData, 
    setTemplateFormData,
    
    // Placeholder editor state
    placeholderEditorOpen,
    setPlaceholderEditorOpen,
    
    // Editor functions
    openEditor,
    handleSaveTemplate,
    handleDeleteTemplate: templateEditor.deleteTemplate,
    
    // Template usage functions
    handleUseTemplate,
    handleFinalizeTemplate,
  };
}

export default useTemplates;