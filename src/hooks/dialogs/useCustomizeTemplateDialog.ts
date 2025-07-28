// src/hooks/dialogs/useCustomizeTemplateDialog.ts - Simplified Version
import { useState, useEffect, useRef } from 'react';

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
import { replacePlaceholders } from '@/utils/templates/placeholderHelpers';
import { blocksApi } from '@/services/api/BlocksApi';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';
import { Block } from '@/types/prompts/blocks';
import { extractBlockIdsFromTemplateMetadata } from '@/utils/prompts/metadataBlockExtractor';

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
  const placeholderValuesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Record<string, string>>).detail || {};
      placeholderValuesRef.current = detail;
    };
    document.addEventListener('jaydai:placeholder-values', handler as EventListener);
    return () => document.removeEventListener('jaydai:placeholder-values', handler as EventListener);
  }, []);


  // Fetch blocks when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    
    const loadBlocks = async () => {
      try {
        // Get all published blocks
        const publishedResponse = await blocksApi.getBlocks({ published: true });
        let allBlocks: Block[] = [];
        
        if (publishedResponse.success && Array.isArray(publishedResponse.data)) {
          allBlocks = [...publishedResponse.data];
        }
  
        // Extract block IDs from template metadata
        const metadataBlockIds = extractBlockIdsFromTemplateMetadata(data?.metadata);
        
        if (metadataBlockIds.length > 0) {
          // Get the specific blocks referenced in metadata (including unpublished ones)
          const metadataBlocksResponse = await blocksApi.getBlocksByIds(metadataBlockIds);
          
          if (metadataBlocksResponse.success && Array.isArray(metadataBlocksResponse.data)) {
            // Merge with published blocks, avoiding duplicates
            const existingIds = new Set(allBlocks.map(b => b.id));
            const newBlocks = metadataBlocksResponse.data.filter(b => !existingIds.has(b.id));
            allBlocks = [...allBlocks, ...newBlocks];
          }
        }
  
        setBlockContentCache(buildBlockCache(allBlocks));
      } catch (err) {
        console.error('Failed to load blocks for customize dialog', err);
      }
    };
    
    loadBlocks();
  }, [isOpen, data?.metadata]);
  
  const handleComplete = async (
    content: string,
    metadata: PromptMetadata
  ): Promise<boolean> => {
    try {
      const initialCache = data?.blockContentCache || {};
      const allBlocks = { ...initialCache, ...blockContentCache };

      // Resolve placeholders in content and blocks
      const placeholders = placeholderValuesRef.current;

      let replacedContent = replacePlaceholders(content.trim(), placeholders);

      const resolvedBlocks: Record<number, string> = {};
      Object.entries(allBlocks).forEach(([id, text]) => {
        resolvedBlocks[parseInt(id, 10)] = replacePlaceholders(text, placeholders);
      });

      // Replace block IDs in the content
      if (Object.keys(resolvedBlocks).length > 0) {
        replacedContent = replaceBlockIdsInContent(replacedContent, resolvedBlocks);
      }

      // Build final prompt using metadata + content
      const finalPrompt = buildCompletePreviewWithBlocks(
        metadata,
        replacedContent,
        resolvedBlocks
      );

      if (data && data.onComplete) {
        data.onComplete(finalPrompt);
      }

      // Track usage with placeholder info
      const replacedPlaceholderKeys = Object.entries(placeholders)
        .filter(([, value]) => value && value.trim())
        .map(([key]) => key);

      trackEvent(EVENTS.TEMPLATE_USED, {
        template_id: data?.id,
        template_name: data?.title,
        template_type: data?.type,
        metadata_items_count:
          Object.keys(metadata.values || {}).length +
          (metadata.constraint?.length || 0) +
          (metadata.example?.length || 0),
        final_content_length: finalPrompt.length,
        replaced_placeholders: replacedPlaceholderKeys,
        replaced_placeholders_count: replacedPlaceholderKeys.length
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
  
  // If the dialog was opened with a loading state, skip initialization until
  // the real data is provided. This allows showing a spinner immediately.
  const baseHook = useTemplateDialogBase({
    dialogType: 'customize',
    initialData: (data as any)?.isLoading ? undefined : data,
    onComplete: handleComplete,
    onClose: handleClose
  });

  const isProcessing = baseHook.isProcessing || (data as any)?.isLoading;

  return {
    ...baseHook,
    isOpen,
    dialogProps,
    data,
    // Override isProcessing so the dialog shows the loading state until the
    // template details are fetched.
    isProcessing
  };
}