import { useState, useCallback, useRef, useEffect } from 'react';
import { Template, TemplateFormData, DEFAULT_FORM_DATA } from '@/types/templates';
import { useTemplateFolders } from './useTemplateFolders';
import { useTemplateEditor } from './useTemplateEditor';
import { toast } from 'sonner';
import { DIALOG_TYPES } from '@/core/dialogs/registry';

/**
 * Main templates hook that consolidates template functionality
 * This hook combines functionality from specialized hooks and adds template usage-specific features
 */
export function useTemplates() {
  // State
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>(DEFAULT_FORM_DATA);
  
  // Use specialized hooks
  const folderManager = useTemplateFolders();
  const templateEditor = useTemplateEditor(folderManager.loadFolders);
  
  // Create a combined hook object for easy use
  const { isSubmitting, error } = templateEditor;
  
  // Debug state changes
  const lastFormUpdate = useRef<string>('');
  useEffect(() => {
    const formDataStr = JSON.stringify(templateFormData);
    if (formDataStr !== lastFormUpdate.current) {
      console.log('✅ templateFormData updated:', templateFormData);
      lastFormUpdate.current = formDataStr;
    }
  }, [templateFormData]);
  
  // Function to update form data consistently
  const updateFormData = useCallback((newData: TemplateFormData) => {
    console.log('🔄 updateFormData called with:', newData);
    setTemplateFormData(newData);
  }, []);
  
  // Handle finalizing and applying a template
  const handleFinalizeTemplate = useCallback((finalContent: string, onClose?: () => void) => {
    const textarea = document.querySelector('#prompt-textarea');
    if (!textarea) {
      console.error('❌ Could not find input area');
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
      
      // Close dialogs using dialog manager
      if (window.dialogManager) {
        window.dialogManager.closeDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR);
      }
      
      setSelectedTemplate(null);
      updateFormData(DEFAULT_FORM_DATA);
      
      if (onClose) onClose();
      
      toast.success('Template applied successfully');
    } catch (error) {
      console.error('❌ Template application error:', error);
      toast.error('Error applying template');
    }
  }, [updateFormData]);
  
  // Handle saving a template
  const handleSaveTemplate = useCallback(async () => {
    try {
      console.log('💾 Saving template with data:', templateFormData);
      
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
        console.log('✅ Template saved successfully');
        
        // Reset template selection and form when saved successfully
        setSelectedTemplate(null);
        updateFormData(DEFAULT_FORM_DATA);
        
        // Close dialogs if using dialog manager
        if (window.dialogManager) {
          window.dialogManager.closeDialog(DIALOG_TYPES.CREATE_TEMPLATE);
          window.dialogManager.closeDialog(DIALOG_TYPES.EDIT_TEMPLATE);
        }
        
        // Refresh the folders list to show the new template
        await folderManager.loadFolders();
        
        return true;
      } else {
        console.log('❌ Template save failed');
      }
      
      return false;
    } catch (error) {
      console.error("❌ Error saving template:", error);
      toast.error("Failed to save template");
      return false;
    }
  }, [templateFormData, templateEditor, folderManager.loadFolders, updateFormData]);
  
  // Handle using a template (opening placeholder editor)
  const handleUseTemplate = useCallback((template: Template) => {
    // Valid template check
    if (!template || !template.content) {
      console.error('❌ Invalid template selected');
      return;
    }
    
    setSelectedTemplate(template);
    
    // Always use the dialog manager
    if (window.dialogManager) {
      window.dialogManager.openDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR, {
        content: template.content,
        title: template.title,
        onComplete: handleFinalizeTemplate
      });
    } else {
      console.error('Dialog manager not available');
      toast.error('Could not open template editor. Please try again.');
    }
    
    // Track template usage in the background
    if (template.id) {
      // This is fire-and-forget, we don't wait for the result
      import('@/services/api/PromptApi').then(({ promptApi }) => {
        promptApi.trackTemplateUsage(template.id);
      }).catch(err => {
        console.error('❌ Failed to track template usage:', err);
      });
    }
  }, [handleFinalizeTemplate]);
  
  // Function to open the template editor dialog for new template
  const handleCreateTemplate = useCallback(() => {
    const initialData = { ...DEFAULT_FORM_DATA };
    
    // Update the state immediately
    setSelectedTemplate(null);
    updateFormData(initialData);
    
    console.log('🆕 Creating new template with data:', initialData);
    
    // Always use window.dialogManager
    if (window.dialogManager) {
      window.dialogManager.openDialog(DIALOG_TYPES.CREATE_TEMPLATE, {
        formData: initialData,
        onFormChange: updateFormData,
        onSave: handleSaveTemplate,
        userFolders: folderManager.userFolders || []
      });
    } else {
      console.error('Dialog manager not available');
      toast.error('Could not open template editor. Please try again.');
    }
  }, [folderManager.userFolders, updateFormData, handleSaveTemplate]);
  
  // Function to edit an existing template
  const handleEditTemplate = useCallback((template: Template) => {
    // Valid template check
    if (!template) {
      console.error('❌ Invalid template for editing');
      return;
    }
    
    // Create form data from template
    const formData = {
      name: template.title || '',
      content: template.content || '',
      description: template.description || '',
      folder: template.folder || '',
      folder_id: template.folder_id,
      based_on_official_id: null
    };
    
    // Update the state immediately
    setSelectedTemplate(template);
    updateFormData(formData);
    
    console.log('✏️ Editing template:', template.id, 'with data:', formData);
    
    // Always use window.dialogManager
    if (window.dialogManager) {
      window.dialogManager.openDialog(DIALOG_TYPES.EDIT_TEMPLATE, {
        template,
        formData,
        onFormChange: updateFormData,
        onSave: handleSaveTemplate,
        userFolders: folderManager.userFolders || []
      });
    } else {
      console.error('Dialog manager not available');
      toast.error('Could not open template editor. Please try again.');
    }
  }, [folderManager.userFolders, updateFormData, handleSaveTemplate]);

  return {
    // Folders state from folderManager
    pinnedOfficialFolders: folderManager.pinnedOfficialFolders,
    pinnedOrganizationFolders: folderManager.pinnedOrganizationFolders,
    userFolders: folderManager.userFolders,
    loading: folderManager.loading,
    error: folderManager.error || error,
    refreshFolders: folderManager.loadFolders,
    
    // Editor state
    selectedTemplate,
    templateFormData, 
    setTemplateFormData: updateFormData,
    
    // Editor functions
    handleCreateTemplate,
    handleSaveTemplate,
    handleDeleteTemplate: templateEditor.deleteTemplate,
    
    // Template usage functions
    handleUseTemplate,
    handleEditTemplate,
    handleFinalizeTemplate,
    
    // Folder functions
    toggleFolderPin: folderManager.toggleFolderPin,
    createFolder: folderManager.createFolder,
    deleteFolder: folderManager.deleteFolder,
    
    // For templates panel
    pinnedFolderIds: [
      ...folderManager.pinnedOfficialFolders.map(f => f.id),
      ...folderManager.pinnedOrganizationFolders.map(f => f.id)
    ]
  };
}

export default useTemplates;