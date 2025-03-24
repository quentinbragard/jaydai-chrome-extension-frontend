// src/hooks/templates/useTemplateSelection.ts

import { useState, useCallback } from 'react';
import { Template } from '@/types/templates';
import { toast } from 'sonner';
import { DIALOG_TYPES } from '@/core/dialogs/registry';

/**
 * Hook for handling template selection and usage
 */
export function useTemplateSelection() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handle selecting and using a template by opening the placeholder editor
   */
  const useTemplate = useCallback((template: Template) => {
    // Validate template
    if (!template) {
      console.error('❌ Invalid template - cannot use undefined/null template');
      toast.error('Could not use template: Invalid template data');
      return;
    }

    if (!template.content) {
      console.error('❌ Template has no content:', template.id);
      toast.error('Could not use template: Template has no content');
      return;
    }

    console.log('🔍 Using template:', template.id, template.title);
    setSelectedTemplate(template);
    setIsProcessing(true);

    try {
      

      // Make sure we have window.dialogManager
      if (!window.dialogManager) {
        console.error('❌ dialogManager not available');
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

      console.log('✅ Template editor opened successfully');

      // Record template usage in background (don't await)
      if (template.id) {
        import('@/services/api/PromptApi').then(({ promptApi }) => {
          promptApi.trackTemplateUsage(template.id).catch(err => {
            console.error('Failed to track template usage:', err);
          });
        });
      }
    } catch (error) {
      console.error('❌ Error opening template editor:', error);
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
      console.warn('⚠️ Finalized template has no content');
      return;
    }

    try {
      console.log('✅ Template finalized with content length:', finalContent.length);
      
      // Find the textarea to insert the content into
      const textarea = document.querySelector('#prompt-textarea');
      if (!textarea) {
        console.error('❌ Could not find prompt textarea');
        toast.error('Could not apply template: Input area not found');
        return;
      }

      // Normalize the content
      const normalizedContent = finalContent
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // Insert the content
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.value = normalizedContent;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // For contenteditable divs or other inputs
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
      
      // Reset selected template
      setSelectedTemplate(null);
    } catch (error) {
      console.error('❌ Error applying template:', error);
      toast.error('Failed to apply template');
    }
  }, []);

  return {
    selectedTemplate,
    isProcessing,
    useTemplate,
    handleTemplateFinalized
  };
}

export default useTemplateSelection;