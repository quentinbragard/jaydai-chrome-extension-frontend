import React, { useCallback } from 'react';
import {
  PromptMetadata,
  MetadataType,
  MultipleMetadataType,
  SingleMetadataType,
  MetadataItem
} from '@/types/prompts/metadata';
import {
  addMetadata,
  removeMetadata,
  updateMetadataItem as updateItem,
  reorderMetadataItems as reorderItems
} from '@/utils/prompts/metadataUtils';

interface UseTemplateMetadataParams {
  metadata: PromptMetadata;
  setMetadata: (
    metadata: PromptMetadata | ((prev: PromptMetadata) => PromptMetadata)
  ) => void;
}

export const useTemplateMetadataHandlers = ({
  metadata,
  setMetadata
}: UseTemplateMetadataParams) => {
  const handleUpdateMetadata = useCallback(
    (newMetadata: PromptMetadata) => {
      setMetadata(newMetadata);
    },
    [setMetadata]
  );

  const handleAddMetadata = useCallback(
    (type: MetadataType, action: 'type' | 'item') => {
      setMetadata(prev => addMetadata(prev, type, action));
    },
    [setMetadata]
  );

  const handleRemoveMetadata = useCallback(
    (type: MetadataType, action: 'type' | 'item', itemId?: string) => {
      setMetadata(prev => removeMetadata(prev, type, action, itemId));
    },
    [setMetadata]
  );

  const handleUpdateMetadataItem = useCallback(
    (
      type: MultipleMetadataType,
      itemId: string,
      updates: Partial<MetadataItem>
    ) => {
      setMetadata(prev => updateItem(prev, type, itemId, updates));
    },
    [setMetadata]
  );

  const handleReorderMetadataItems = useCallback(
    (type: MultipleMetadataType, newItems: MetadataItem[]) => {
      setMetadata(prev => reorderItems(prev, type, newItems));
    },
    [setMetadata]
  );

  return {
    handleUpdateMetadata,
    handleAddMetadata,
    handleRemoveMetadata,
    handleUpdateMetadataItem,
    handleReorderMetadataItems
  };
};
