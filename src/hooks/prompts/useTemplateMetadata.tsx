import React, { createContext, useContext, useEffect, useState } from 'react';
import { PromptMetadata, DEFAULT_METADATA } from '@/types/prompts/metadata';
import { useTemplateMetadata as useTemplateMetadataHandlers } from '@/hooks/dialogs/shared/useTemplateMetada';

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
