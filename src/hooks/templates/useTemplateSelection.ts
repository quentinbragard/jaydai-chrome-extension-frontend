// src/hooks/templates/useTemplateSelection.ts
import { useState, useCallback } from 'react';
import { Template } from '@/types/templates';
import { toast } from 'sonner';
import { DIALOG_TYPES } from '@/core/dialogs/registry';

/**
 * Hook for handling template selection and usage
 */
export function useTemplateSelection() {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handle selecting and using a template by opening the placeholder editor
   */
  const useTemplate = useCallback((template: Template) => {
    // Validate template
    if (!template) {
      toast.error('Could not use template: Invalid template data');
      return;
    }

    if (!template.content) {
      toast.error('Could not use template: Template has no content');
      return;
    }

    setIsProcessing(true);

    try {
      // Make sure we have window.dialogManager
      if (!window.dialogManager) {
        toast.error('Could not open template editor: System not initialized');
        setIsProcessing(false);
        return;
      }

      // Open the placeholder editor dialog
      window.dialogManager.openDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR, {
        content: template.content,
        title: template.title || 'Untitled Template',
        onComplete: handleTemplateFinalized
      });

      // Record template usage in background (don't await)
      if (template.id) {
        import('@/services/api/PromptApi').then(({ promptApi }) => {
          promptApi.trackTemplateUsage(template.id).catch(err => {
            console.error('Failed to track template usage:', err);
          });
        });
      }
    } catch (error) {
      toast.error('Failed to open template editor');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Handle finalizing a template after placeholder replacement
   */
  const handleTemplateFinalized = useCallback((finalContent: string) => {
    if (!finalContent) {
      return;
    }

    try {
      // Find the textarea to insert the content into
      const textarea = document.querySelector('#prompt-textarea');
      if (!textarea) {
        toast.error('Could not apply template: Input area not found');
        return;
      }

      // Normalize content for insertion
      const normalizedContent = finalContent.replace(/\r\n/g, '\n');
      
      // Insert the content
      if (textarea instanceof HTMLTextAreaElement) {
        // For standard textareas
        textarea.value = normalizedContent;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (textarea.isContentEditable) {
        // For contenteditable divs like in ChatGPT interface
        textarea.textContent = normalizedContent;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        textarea.textContent = normalizedContent;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Focus the textarea and set cursor at the end
      textarea.focus();
      if ('setSelectionRange' in textarea) {
        (textarea as HTMLTextAreaElement).setSelectionRange(
          normalizedContent.length,
          normalizedContent.length
        );
      }

      toast.success('Template applied successfully');
      
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to apply template');
    }
  }, []);

  return {
    isProcessing,
    useTemplate,
    handleTemplateFinalized
  };
}

export default useTemplateSelection;