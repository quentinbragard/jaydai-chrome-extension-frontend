// src/hooks/dialogs/useCustomizeTemplateDialog.ts - Simplified Version
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { useTemplateDialogBase } from './useTemplateDialogBase';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';
import { PromptMetadata } from '@/types/prompts/metadata';
import { buildCompletePreviewWithBlocks } from '@/utils/templates/promptPreviewUtils';

export function useCustomizeTemplateDialog() {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR);
  
  const handleComplete = async (
    content: string, 
    metadata: PromptMetadata
  ): Promise<boolean> => {
    try {
      // Build the final content from template content + metadata
      const blockContentCache = data?.blockContentCache || {};
      let finalContent: string;
      
      if (Object.keys(blockContentCache).length > 0) {
        // Use block content if available
        finalContent = buildCompletePreviewWithBlocks(metadata, content, blockContentCache);
      } else {
        // Simple concatenation of metadata values + content
        const metadataParts: string[] = [];
        
        // Add metadata values
        const singleTypes = ['role', 'context', 'goal', 'audience', 'output_format', 'tone_style'];
        singleTypes.forEach(type => {
          const value = metadata.values?.[type as keyof typeof metadata.values];
          if (value?.trim()) {
            metadataParts.push(value);
          }
        });
        
        // Add constraints and examples
        if (metadata.constraints) {
          metadata.constraints.forEach(item => {
            if (item.value.trim()) {
              metadataParts.push(`Contrainte: ${item.value}`);
            }
          });
        }
        
        if (metadata.examples) {
          metadata.examples.forEach(item => {
            if (item.value.trim()) {
              metadataParts.push(`Exemple: ${item.value}`);
            }
          });
        }
        
        // Combine all parts
        const allParts = [...metadataParts, content.trim()].filter(Boolean);
        finalContent = allParts.join('\n\n');
      }
      
      if (data && data.onComplete) {
        data.onComplete(finalContent);
      }
      
      // Track usage
      trackEvent(EVENTS.TEMPLATE_USED, {
        template_id: data?.id,
        template_name: data?.title,
        template_type: data?.type,
        metadata_items_count: Object.keys(metadata.values || {}).length + 
                              (metadata.constraints?.length || 0) + 
                              (metadata.examples?.length || 0),
        final_content_length: finalContent.length
      });
      
      // Trigger cleanup events
      document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
      document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
      
      return true;
    } catch (error) {
      console.error('Error in customize template complete:', error);
      toast.error(getMessage('errorProcessingTemplateToast', undefined, 'Error processing template'));
      return false;
    }
  };
  
  const handleClose = () => {
    try {
      dialogProps.onOpenChange(false);
      document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
      document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
    } catch (error) {
      console.error('Error in customize template close:', error);
    }
  };
  
  const baseHook = useTemplateDialogBase({
    dialogType: 'customize',
    initialData: data,
    onComplete: handleComplete,
    onClose: handleClose
  });
  
  return {
    ...baseHook,
    isOpen,
    dialogProps
  };
}