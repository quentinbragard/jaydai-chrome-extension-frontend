// src/components/dialogs/prompts/editors/AdvancedEditor/index.tsx (simplified)
import React from 'react';
import { useTemplateEditor } from '@/contexts/TemplateEditorContext';
import { MetadataSection } from './MetadataSection';
import { ContentSection } from './ContentSection';
import { PreviewSection } from './PreviewSection';

export const AdvancedEditor: React.FC = () => {
  const { state } = useTemplateEditor();

  return (
    <div className="jd-h-full jd-flex jd-flex-col jd-space-y-6">
      <MetadataSection availableMetadataBlocks={state.blocks.availableMetadataBlocks} />
      <ContentSection
        blocks={[]}
        availableBlocksByType={state.blocks.availableBlocksByType}
        draggedBlockId={null}
        onAddBlock={() => {}}
        onRemoveBlock={() => {}}
        onUpdateBlock={() => {}}
        onDragStart={() => {}}
        onDragOver={() => {}}
        onDragEnd={() => {}}
        onBlockSaved={() => {}}
      />
      <PreviewSection
        content={state.content.content}
        expanded={false}
        onToggle={() => {}}
      />
    </div>
  );
};