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
  buildCompletePreview
} from '@/utils/templates/promptPreviewUtils';
import { prefillMetadataFromMapping } from '@/utils/templates/metadataPrefill';

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
        finalContent = buildCompletePreviewWithBlocks(
          metadata,
          content,
          blockContentCache
        );
      } else {
        // Fallback: prefill metadata values by fetching blocks if needed
        const mapping: Record<string, number | number[]> = {};

        const singleTypes = [
          'role',
          'context',
          'goal',
          'audience',
          'output_format',
          'tone_style'
        ] as const;

        singleTypes.forEach(type => {
          const id = (metadata as any)[type];
          if (typeof id === 'number' && id > 0) {
            mapping[type] = id;
          }
        });

        if (metadata.constraint) {
          const ids = metadata.constraint
            .map(item => item.blockId)
            .filter(id => typeof id === 'number' && id > 0);
          if (ids.length > 0) mapping['constraint'] = ids;
        }

        if (metadata.example) {
          const ids = metadata.example
            .map(item => item.blockId)
            .filter(id => typeof id === 'number' && id > 0);
          if (ids.length > 0) mapping['example'] = ids;
        }

        let resolved = metadata;
        if (Object.keys(mapping).length > 0) {
          const prefilled = await prefillMetadataFromMapping(mapping);

          resolved = {
            ...prefilled,
            values: { ...prefilled.values, ...metadata.values },
            constraint: metadata.constraint || prefilled.constraint,
            example: metadata.example || prefilled.example
          } as PromptMetadata;
        }

        finalContent = buildCompletePreview(resolved, content);
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
    dialogProps
  };
}