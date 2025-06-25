// src/hooks/dialogs/useCustomizeTemplateDialog.ts - Simplified Version
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { useTemplateDialogBase } from './useTemplateDialogBase';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';
import { PromptMetadata } from '@/types/prompts/metadata';
import {
  buildCompletePreviewWithBlocks,
  extractContentFromCompleteTemplate
} from '@/utils/templates/promptPreviewUtils';

export function useCustomizeTemplateDialog() {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR);
  
  const handleComplete = async (
    content: string, 
    metadata: PromptMetadata
  ): Promise<boolean> => {
    try {
      // Build the final content from template content only. We avoid inserting
      // metadata blocks directly and instead resolve any block IDs found in the
      // content using the provided cache.
      const blockContentCache = data?.blockContentCache || {};
      let finalContent: string;

      if (Object.keys(blockContentCache).length > 0) {
        const complete = buildCompletePreviewWithBlocks(
          metadata,
          content,
          blockContentCache
        );
        const metadataPart = buildCompletePreviewWithBlocks(
          metadata,
          '',
          blockContentCache
        );
        finalContent = extractContentFromCompleteTemplate(complete, metadataPart);
      } else {
        finalContent = content.trim();
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
                              (metadata.constraint?.length || 0) + 
                              (metadata.example?.length || 0),
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
    dialogProps,
    data
  };
}