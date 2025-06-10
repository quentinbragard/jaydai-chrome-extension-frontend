// src/hooks/shared/useTemplateMetadata.ts

import { useCallback } from 'react';
import { 
  MetadataType, 
  MultipleMetadataType, 
  SingleMetadataType, 
  MetadataItem, 
  PromptMetadata,
} from '@/types/prompts/metadata';
import { isMultipleValueBlock } from '@/utils/prompts/blockUtils';

interface UseTemplateMetadataParams {
  metadata: PromptMetadata;
  setMetadata: (metadata: PromptMetadata | ((prev: PromptMetadata) => PromptMetadata)) => void;
}

export const useTemplateMetadata = ({ metadata, setMetadata }: UseTemplateMetadataParams) => {
  const generateMetadataItemId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleUpdateMetadata = useCallback((newMetadata: PromptMetadata) => {
    setMetadata(newMetadata);
  }, [setMetadata]);

  const handleAddMetadata = useCallback((type: MetadataType, action: 'type' | 'item') => {
    if (action === 'type') {
      // Adding a new metadata type/section
      if (isMultipleValueBlock(type)) {
        const multiType = type as MultipleMetadataType;
        const newItem: MetadataItem = {
          id: generateMetadataItemId(),
          value: '',
          blockId: undefined
        };
        
        setMetadata(prev => ({
          ...prev,
          [multiType]: [newItem]
        }));
      } else {
        const singleType = type as SingleMetadataType;
        setMetadata(prev => ({
          ...prev,
          [singleType]: 0,
          values: {
            ...prev.values,
            [singleType]: ''
          }
        }));
      }
    } else {
      // Adding an item to an existing metadata type
      if (isMultipleValueBlock(type)) {
        const multiType = type as MultipleMetadataType;
        const newItem: MetadataItem = {
          id: generateMetadataItemId(),
          value: '',
          blockId: undefined
        };
        
        setMetadata(prev => ({
          ...prev,
          [multiType]: [...(prev[multiType] || []), newItem]
        }));
      }
    }
  }, [setMetadata]);

  const handleRemoveMetadata = useCallback((type: MetadataType, action: 'type' | 'item', itemId?: string) => {
    if (action === 'type') {
      // Removing entire metadata type/section
      if (isMultipleValueBlock(type)) {
        const multiType = type as MultipleMetadataType;
        setMetadata(prev => ({
          ...prev,
          [multiType]: []
        }));
      } else {
        const singleType = type as SingleMetadataType;
        setMetadata(prev => ({
          ...prev,
          [singleType]: 0,
          values: {
            ...prev.values,
            [singleType]: ''
          }
        }));
      }
    } else {
      // Removing specific item from metadata type
      if (isMultipleValueBlock(type) && itemId) {
        const multiType = type as MultipleMetadataType;
        setMetadata(prev => ({
          ...prev,
          [multiType]: (prev[multiType] || []).filter(item => item.id !== itemId)
        }));
      }
    }
  }, [setMetadata]);

  const handleUpdateMetadataItem = useCallback((type: MultipleMetadataType, itemId: string, updates: Partial<MetadataItem>) => {
    setMetadata(prev => ({
      ...prev,
      [type]: (prev[type] || []).map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  }, [setMetadata]);

  const handleReorderMetadataItems = useCallback((type: MultipleMetadataType, newItems: MetadataItem[]) => {
    setMetadata(prev => ({
      ...prev,
      [type]: newItems
    }));
  }, [setMetadata]);

  return {
    handleUpdateMetadata,
    handleAddMetadata,
    handleRemoveMetadata,
    handleUpdateMetadataItem,
    handleReorderMetadataItems
  };
};