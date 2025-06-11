// src/hooks/prompts/editors/useSimpleMetadata.ts - Enhanced version without context dependency
import { useState, useCallback, useMemo } from 'react';
import { 
  PromptMetadata, 
  MetadataType, 
  SingleMetadataType, 
  MultipleMetadataType,
  MetadataItem,
  SECONDARY_METADATA,
  isMultipleMetadataType
} from '@/types/prompts/metadata';

interface UseSimpleMetadataProps {
  metadata: PromptMetadata;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
}

/**
 * Hook for managing metadata UI state and providing handlers
 * Now works with direct props instead of context
 */
export function useSimpleMetadata({ metadata, onUpdateMetadata }: UseSimpleMetadataProps) {
  // UI state
  const [expandedMetadata, setExpandedMetadata] = useState<MetadataType | null>(null);
  const [metadataCollapsed, setMetadataCollapsed] = useState(false);
  const [secondaryMetadataCollapsed, setSecondaryMetadataCollapsed] = useState(false);

  // Calculate active secondary metadata based on what's currently set
  const activeSecondaryMetadata = useMemo(() => {
    const activeSet = new Set<MetadataType>();

    SECONDARY_METADATA.forEach(type => {
      if (isMultipleMetadataType(type)) {
        const multiType = type as MultipleMetadataType;
        if (metadata[multiType] && metadata[multiType]!.length > 0) {
          activeSet.add(type);
        }
      } else {
        const singleType = type as SingleMetadataType;
        const hasField =
          Object.prototype.hasOwnProperty.call(metadata, singleType) ||
          (metadata.values &&
            Object.prototype.hasOwnProperty.call(metadata.values, singleType));

        if (hasField) {
          activeSet.add(type);
        }
      }
    });

    return activeSet;
  }, [metadata]);

  // Update metadata helper
  const updateMetadata = useCallback((updates: Partial<PromptMetadata>) => {
    if (onUpdateMetadata) {
      onUpdateMetadata({ ...metadata, ...updates });
    }
  }, [metadata, onUpdateMetadata]);

  // Handle single metadata changes (for dropdowns that select block IDs)
  const handleSingleMetadataChange = useCallback((type: SingleMetadataType, value: string) => {
    const numericValue = parseInt(value, 10);
    const blockId = isNaN(numericValue) ? 0 : numericValue;
    
    updateMetadata({
      [type]: blockId,
      // Clear custom value when selecting a block
      values: {
        ...metadata.values,
        [type]: blockId === 0 ? (metadata.values?.[type] || '') : ''
      }
    });
  }, [metadata, updateMetadata]);

  // Handle custom value changes (for text inputs)
  const handleCustomChange = useCallback((type: SingleMetadataType, value: string) => {
    updateMetadata({
      // Clear block ID when entering custom value
      [type]: value.trim() ? 0 : (metadata[type] || 0),
      values: {
        ...metadata.values,
        [type]: value
      }
    });
  }, [metadata, updateMetadata]);

  // Handle adding metadata items for multiple types (constraints, examples)
  const handleAddMetadataItem = useCallback((type: MultipleMetadataType) => {
    const newItem: MetadataItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      value: '',
      blockId: undefined
    };

    const currentItems = metadata[type] || [];
    updateMetadata({
      [type]: [...currentItems, newItem]
    });
  }, [metadata, updateMetadata]);

  // Handle removing metadata items
  const handleRemoveMetadataItem = useCallback((type: MultipleMetadataType, itemId: string) => {
    const currentItems = metadata[type] || [];
    const filteredItems = currentItems.filter(item => item.id !== itemId);
    
    updateMetadata({
      [type]: filteredItems
    });
  }, [metadata, updateMetadata]);

  // Handle updating metadata items
  const handleUpdateMetadataItem = useCallback((type: MultipleMetadataType, itemId: string, updates: Partial<MetadataItem>) => {
    const currentItems = metadata[type] || [];
    const updatedItems = currentItems.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    
    updateMetadata({
      [type]: updatedItems
    });
  }, [metadata, updateMetadata]);

  // Handle reordering metadata items
  const handleReorderMetadataItems = useCallback((type: MultipleMetadataType, newItems: MetadataItem[]) => {
    updateMetadata({
      [type]: newItems
    });
  }, [updateMetadata]);

  // Add secondary metadata type
  const addSecondaryMetadata = useCallback((type: MetadataType) => {
    if (isMultipleMetadataType(type)) {
      // For multiple types, add an empty item
      const multiType = type as MultipleMetadataType;
      const newItem: MetadataItem = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        value: '',
        blockId: undefined
      };
      
      updateMetadata({
        [multiType]: [newItem]
      });
    } else {
      // For single types, just initialize with empty values
      const singleType = type as SingleMetadataType;
      updateMetadata({
        [singleType]: 0,
        values: {
          ...metadata.values,
          [singleType]: ''
        }
      });
    }
    
    // Expand the newly added metadata
    setExpandedMetadata(type);
  }, [metadata, updateMetadata]);

  // Remove secondary metadata type
  const removeSecondaryMetadata = useCallback((type: MetadataType) => {
    let newMetadata: PromptMetadata = { ...metadata };

    if (isMultipleMetadataType(type)) {
      const multiType = type as MultipleMetadataType;
      delete (newMetadata as any)[multiType];
    } else {
      const singleType = type as SingleMetadataType;
      delete (newMetadata as any)[singleType];
      if (newMetadata.values) {
        const { [singleType]: _removed, ...restValues } = newMetadata.values;
        newMetadata.values = restValues;
      }
    }

    if (onUpdateMetadata) {
      onUpdateMetadata(newMetadata);
    }
    
    // Close expanded state if removing the currently expanded item
    if (expandedMetadata === type) {
      setExpandedMetadata(null);
    }
  }, [metadata, onUpdateMetadata, expandedMetadata]);

  return {
    // UI state
    expandedMetadata,
    setExpandedMetadata,
    activeSecondaryMetadata,
    metadataCollapsed,
    setMetadataCollapsed,
    secondaryMetadataCollapsed,
    setSecondaryMetadataCollapsed,
    
    // Handlers
    handleSingleMetadataChange,
    handleCustomChange,
    handleAddMetadataItem,
    handleRemoveMetadataItem,
    handleUpdateMetadataItem,
    handleReorderMetadataItems,
    addSecondaryMetadata,
    removeSecondaryMetadata
  };
}