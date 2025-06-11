import React, { createContext, useContext } from 'react';
import { PromptMetadata, MetadataType } from '@/types/prompts/metadata';

export interface MetadataUIState {
  expandedMetadata: MetadataType | null;
  setExpandedMetadata: (type: MetadataType | null) => void;
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
