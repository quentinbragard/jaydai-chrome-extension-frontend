// src/components/dialogs/templates/editor/AdvancedEditor.tsx
import React from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { PromptMetadata, DEFAULT_METADATA_FIELDS } from '@/components/templates/metadata/types';
import { EnhancedInteractivePreviewPanel } from './EnhancedInteractivePreviewPanel';

interface AdvancedEditorProps {
  blocks: Block[];
  metadata?: PromptMetadata;
  onAddBlock: (position: 'start' | 'end', blockType: BlockType, existingBlock?: Block) => void;
  onRemoveBlock: (blockId: number) => void;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onMoveBlock: (blockId: number, direction: 'up' | 'down') => void;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
  isProcessing: boolean;
}

/**
 * Advanced editor mode - Enhanced unified interface with inline editing and metadata support
 */
export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  blocks,
  metadata = { fields: DEFAULT_METADATA_FIELDS },
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onMoveBlock,
  onUpdateMetadata,
  isProcessing
}) => {
  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="jd-h-full">
      <EnhancedInteractivePreviewPanel
        blocks={blocks}
        metadata={metadata}
        onAddBlock={onAddBlock}
        onRemoveBlock={onRemoveBlock}
        onUpdateBlock={onUpdateBlock}
        onMoveBlock={onMoveBlock}
        onUpdateMetadata={onUpdateMetadata}
      />
    </div>
  );
};