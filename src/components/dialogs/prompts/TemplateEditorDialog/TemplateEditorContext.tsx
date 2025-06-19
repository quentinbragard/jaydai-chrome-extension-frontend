import React, { createContext, useContext } from 'react';
import { PromptMetadata, MetadataType } from '@/types/prompts/metadata';
import { Block } from '@/types/prompts/blocks';

export interface MetadataUIState {
  expandedMetadata: Set<MetadataType>;
  toggleExpandedMetadata: (type: MetadataType) => void;
  activeSecondaryMetadata: Set<MetadataType>;
  metadataCollapsed: boolean;
  setMetadataCollapsed: (collapsed: boolean) => void;
  secondaryMetadataCollapsed: boolean;
  setSecondaryMetadataCollapsed: (collapsed: boolean) => void;
  customValues: Record<string, string>;
}

export interface TemplateEditorContextValue extends MetadataUIState {
  metadata: PromptMetadata;
  setMetadata: (updater: (metadata: PromptMetadata) => PromptMetadata) => void;

  // Editor state
  content: string;
  setContent: (content: string) => void;
  finalPromptContent: string;
  setFinalPromptContent: (content: string) => void;
  modifiedBlocks: Record<number, string>;
  modifiedMetadata: Record<number, string>;

  // Blocks
  blockContentCache: Record<number, string>;
  availableMetadataBlocks: Record<MetadataType, Block[]>;
}

const TemplateEditorContext = createContext<TemplateEditorContextValue | undefined>(undefined);

export const TemplateEditorProvider: React.FC<{ value: TemplateEditorContextValue; children: React.ReactNode }> = ({ value, children }) => (
  <TemplateEditorContext.Provider value={value}>{children}</TemplateEditorContext.Provider>
);

export const useTemplateEditor = (): TemplateEditorContextValue => {
  const context = useContext(TemplateEditorContext);
  if (!context) {
    throw new Error('useTemplateEditor must be used within a TemplateEditorProvider');
  }
  return context;
};
