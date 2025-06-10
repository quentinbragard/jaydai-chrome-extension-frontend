import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from 'react';
import {
  PromptMetadata,
  DEFAULT_METADATA,
  MetadataType,
  MultipleMetadataType,
  SingleMetadataType,
  MetadataItem
} from '@/types/prompts/metadata';
import { isMultipleValueBlock } from '@/utils/prompts/blockUtils';

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
  const generateMetadataItemId = () =>
    `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleUpdateMetadata = useCallback(
    (newMetadata: PromptMetadata) => {
      setMetadata(newMetadata);
    },
    [setMetadata]
  );

  const handleAddMetadata = useCallback(
    (type: MetadataType, action: 'type' | 'item') => {
      if (action === 'type') {
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
    },
    [setMetadata]
  );

  const handleRemoveMetadata = useCallback(
    (type: MetadataType, action: 'type' | 'item', itemId?: string) => {
      if (action === 'type') {
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
        if (isMultipleValueBlock(type) && itemId) {
          const multiType = type as MultipleMetadataType;
          setMetadata(prev => ({
            ...prev,
            [multiType]: (prev[multiType] || []).filter(
              item => item.id !== itemId
            )
          }));
        }
      }
    },
    [setMetadata]
  );

  const handleUpdateMetadataItem = useCallback(
    (
      type: MultipleMetadataType,
      itemId: string,
      updates: Partial<MetadataItem>
    ) => {
      setMetadata(prev => ({
        ...prev,
        [type]: (prev[type] || []).map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      }));
    },
    [setMetadata]
  );

  const handleReorderMetadataItems = useCallback(
    (type: MultipleMetadataType, newItems: MetadataItem[]) => {
      setMetadata(prev => ({
        ...prev,
        [type]: newItems
      }));
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

interface TemplateMetadataProviderProps {
  initialMetadata?: PromptMetadata;
  onMetadataChange?: (metadata: PromptMetadata) => void;
  children: React.ReactNode;
}

interface TemplateMetadataContextValue {
  metadata: PromptMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<PromptMetadata>>;
  handleUpdateMetadata: (newMetadata: PromptMetadata) => void;
  handleAddMetadata: (type: any, action: 'type' | 'item') => void;
  handleRemoveMetadata: (type: any, action: 'type' | 'item', itemId?: string) => void;
  handleUpdateMetadataItem: (type: any, itemId: string, updates: any) => void;
  handleReorderMetadataItems: (type: any, newItems: any[]) => void;
}

const TemplateMetadataContext = createContext<TemplateMetadataContextValue | null>(null);

export const TemplateMetadataProvider: React.FC<TemplateMetadataProviderProps> = ({
  initialMetadata = DEFAULT_METADATA,
  onMetadataChange,
  children
}) => {
  const [metadata, setMetadata] = useState<PromptMetadata>(initialMetadata);

  // Keep local state in sync with initialMetadata changes
  useEffect(() => {
    setMetadata(initialMetadata);
  }, [initialMetadata]);

  // Notify parent on metadata changes
  useEffect(() => {
    if (onMetadataChange) {
      onMetadataChange(metadata);
    }
  }, [metadata, onMetadataChange]);

  const handlers = useTemplateMetadataHandlers({ metadata, setMetadata });

  return (
    <TemplateMetadataContext.Provider value={{ metadata, setMetadata, ...handlers }}>
      {children}
    </TemplateMetadataContext.Provider>
  );
};

export const useTemplateMetadata = () => {
  const ctx = useContext(TemplateMetadataContext);
  if (!ctx) {
    throw new Error('useTemplateMetadata must be used within TemplateMetadataProvider');
  }
  return ctx;
};
