// src/hooks/dialogs/useCustomizeTemplateDialog.ts - Enhanced Version
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { useTemplateDialogBase } from './useTemplateDialogBase';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';
import { PromptMetadata } from '@/types/prompts/metadata';

export function useCustomizeTemplateDialog() {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR);
  
  const handleComplete = async (
    content: string, 
    metadata: PromptMetadata, 
    finalContent?: string
  ): Promise<boolean> => {
    try {
      // **NEW: Use final content if available, otherwise use base content**
      const contentToUse = finalContent || content;
      
      if (data && data.onComplete) {
        data.onComplete(contentToUse);
      }
      
      // Track usage
      trackEvent(EVENTS.TEMPLATE_USED, {
        template_id: data?.id,
        template_name: data?.title,
        template_type: data?.type,
        metadata_items_count: Object.keys(metadata.values || {}).length + 
                              (metadata.constraints?.length || 0) + 
                              (metadata.examples?.length || 0),
        final_content_length: contentToUse.length,
        content_modified: finalContent !== undefined && finalContent !== content
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