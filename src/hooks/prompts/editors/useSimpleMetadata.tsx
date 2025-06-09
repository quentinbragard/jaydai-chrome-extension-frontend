import { useState, useEffect, useCallback } from 'react';
import {
  PromptMetadata,
  MetadataType,
  SingleMetadataType,
  MultipleMetadataType,
  MetadataItem,
  PRIMARY_METADATA,
  SECONDARY_METADATA,
  isMultipleMetadataType,
  generateMetadataItemId
} from '@/types/prompts/metadata';

interface UseSimpleMetadataProps {
  metadata: PromptMetadata;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
}

export function useSimpleMetadata({ metadata, onUpdateMetadata }: UseSimpleMetadataProps) {
  const [expandedMetadata, setExpandedMetadata] = useState<MetadataType | null>(null);
  const [activeSecondaryMetadata, setActiveSecondaryMetadata] = useState<Set<MetadataType>>(new Set());
  const [metadataCollapsed, setMetadataCollapsed] = useState(false);
  const [secondaryMetadataCollapsed, setSecondaryMetadataCollapsed] = useState(false);

  useEffect(() => {
    const active = new Set<MetadataType>();
    SECONDARY_METADATA.forEach(type => {
      if (isMultipleMetadataType(type)) {
        const items = metadata[type as MultipleMetadataType];
        if (items && items.length > 0) active.add(type);
      } else {
        const value = metadata.values?.[type as SingleMetadataType];
        if (value) active.add(type);
      }
    });
    setActiveSecondaryMetadata(active);
  }, [metadata]);

  const handleSingleMetadataChange = useCallback(
    (type: SingleMetadataType, value: string) => {
      if (!onUpdateMetadata) return;
      const newValues = { ...(metadata.values || {}), [type]: value };
      onUpdateMetadata({ ...metadata, values: newValues });
    },
    [metadata, onUpdateMetadata]
  );

  const handleCustomChange = handleSingleMetadataChange;

  const handleAddMetadataItem = useCallback(
    (type: MultipleMetadataType) => {
      if (!onUpdateMetadata) return;
      const items = metadata[type] || [];
      onUpdateMetadata({ ...metadata, [type]: [...items, { id: generateMetadataItemId(), value: '' }] });
    },
    [metadata, onUpdateMetadata]
  );

  const handleRemoveMetadataItem = useCallback(
    (type: MultipleMetadataType, itemId: string) => {
      if (!onUpdateMetadata) return;
      const items = (metadata[type] || []).filter(i => i.id !== itemId);
      onUpdateMetadata({ ...metadata, [type]: items });
    },
    [metadata, onUpdateMetadata]
  );

  const handleUpdateMetadataItem = useCallback(
    (type: MultipleMetadataType, itemId: string, updates: Partial<MetadataItem>) => {
      if (!onUpdateMetadata) return;
      const items = (metadata[type] || []).map(i => (i.id === itemId ? { ...i, ...updates } : i));
      onUpdateMetadata({ ...metadata, [type]: items });
    },
    [metadata, onUpdateMetadata]
  );

  const handleReorderMetadataItems = useCallback(
    (type: MultipleMetadataType, newItems: MetadataItem[]) => {
      if (!onUpdateMetadata) return;
      onUpdateMetadata({ ...metadata, [type]: newItems });
    },
    [metadata, onUpdateMetadata]
  );

  const addSecondaryMetadata = useCallback(
    (type: MetadataType) => {
      setActiveSecondaryMetadata(prev => new Set([...prev, type]));
      if (!onUpdateMetadata) return;
      if (isMultipleMetadataType(type)) {
        onUpdateMetadata({ ...metadata, [type]: [] });
      } else {
        const newValues = { ...(metadata.values || {}), [type as SingleMetadataType]: '' };
        onUpdateMetadata({ ...metadata, values: newValues });
      }
    },
    [metadata, onUpdateMetadata]
  );

  const removeSecondaryMetadata = useCallback(
    (type: MetadataType) => {
      setActiveSecondaryMetadata(prev => {
        const n = new Set(prev);
        n.delete(type);
        return n;
      });
      if (!onUpdateMetadata) return;
      const newMetadata = { ...metadata } as PromptMetadata;
      if (isMultipleMetadataType(type)) {
        delete (newMetadata as any)[type];
      } else {
        const values = { ...(metadata.values || {}) };
        delete values[type as SingleMetadataType];
        newMetadata.values = values;
      }
      onUpdateMetadata(newMetadata);
    },
    [metadata, onUpdateMetadata]
  );

  return {
    expandedMetadata,
    setExpandedMetadata,
    activeSecondaryMetadata,
    metadataCollapsed,
    setMetadataCollapsed,
    secondaryMetadataCollapsed,
    setSecondaryMetadataCollapsed,
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
