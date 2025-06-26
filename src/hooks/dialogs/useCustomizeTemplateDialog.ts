// src/hooks/dialogs/useCustomizeTemplateDialog.ts - Simplified Version
import { useState, useEffect } from 'react';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { useTemplateDialogBase } from './useTemplateDialogBase';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';
import { PromptMetadata } from '@/types/prompts/metadata';
import {
  replaceBlockIdsInContent,
  buildCompletePreviewWithBlocks
} from '@/utils/templates/promptPreviewUtils';
import { blocksApi } from '@/services/api/BlocksApi';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';
import { Block } from '@/types/prompts/blocks';

// Helper to build a cache of block ID -> translated content
const buildBlockCache = (blocks: Block[]): Record<number, string> => {
  const cache: Record<number, string> = {};
  blocks.forEach(b => {
    cache[b.id] = getLocalizedContent(b.content);
  });
  return cache;
};

export function useCustomizeTemplateDialog() {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR);

  const [blockContentCache, setBlockContentCache] = useState<Record<number, string>>({});

  // Fetch blocks when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    const loadBlocks = async () => {
      try {
        const res = await blocksApi.getBlocks();
        if (res.success && Array.isArray(res.data)) {
          setBlockContentCache(buildBlockCache(res.data));
        }
      } catch (err) {
        console.error('Failed to load blocks for customize dialog', err);
      }
    };
    loadBlocks();
  }, [isOpen]);
  
  const handleComplete = async (
    content: string,
    metadata: PromptMetadata
  ): Promise<boolean> => {
    try {
      const initialCache = data?.blockContentCache || {};
      const allBlocks = { ...initialCache, ...blockContentCache };

      // Replace block IDs in the content
      let replacedContent = content.trim();
      if (Object.keys(allBlocks).length > 0) {
        replacedContent = replaceBlockIdsInContent(replacedContent, allBlocks);
      }

      // Build final prompt using metadata + content
      const finalPrompt = buildCompletePreviewWithBlocks(
        metadata,
        replacedContent,
        allBlocks
      );

      if (data && data.onComplete) {
        data.onComplete(finalPrompt);
      }

      // Track usage
      trackEvent(EVENTS.TEMPLATE_USED, {
        template_id: data?.id,
        template_name: data?.title,
        template_type: data?.type,
        metadata_items_count:
          Object.keys(metadata.values || {}).length +
          (metadata.constraint?.length || 0) +
          (metadata.example?.length || 0),
        final_content_length: finalPrompt.length
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