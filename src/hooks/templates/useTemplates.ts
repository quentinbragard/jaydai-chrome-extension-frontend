import { useState, useCallback } from 'react';
import { Template } from '@/types/templates';
import { useTemplateFolders } from './useTemplateFolders';
import { useTemplateEditor } from './useTemplateEditor';

/**
 * Main templates hook that consolidates template functionality
 * This hook is much smaller now since it delegates to specialized hooks
 */
export function useTemplates() {
  const [placeholderEditorOpen, setPlaceholderEditorOpen] = useState(false);
  
  // Use specialized hooks
  const folderManager = useTemplateFolders();
  const templateEditor = useTemplateEditor(folderManager.loadFolders);
  
  // Handle using a template (opening placeholder editor)
  const handleUseTemplate = useCallback((template: Template) => {
    // Valid template check
    if (!template || !template.content) {
      console.error('Invalid template selected');
      return;
    }
    
    templateEditor.openEditor(template);
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
  }, [templateEditor]);
  
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
      templateEditor.setTemplateFormData(prevState => ({...prevState})); // Reset form
      
      if (onClose) onClose();
    } catch (error) {
      console.error('Template application error:', error);
    }
  }, [templateEditor]);

  return {
    // Re-export state from other hooks
    ...folderManager,
    ...templateEditor,
    
    // Placeholder editor state
    placeholderEditorOpen,
    setPlaceholderEditorOpen,
    
    // Template usage functions
    handleUseTemplate,
    handleFinalizeTemplate,
  };
}

export default useTemplates;