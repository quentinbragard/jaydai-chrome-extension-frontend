// src/components/dialogs/prompts/editors/AdvancedEditor/ContentSection.tsx
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Block, BlockType } from '@/types/prompts/blocks';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { BlockCard } from '@/components/prompts/blocks/BlockCard';
import { AddBlockButton } from '@/components/common/AddBlockButton';

interface ContentSectionProps {
  blocks: Block[];
  availableBlocksByType: Record<BlockType, Block[]>;
  draggedBlockId: number | null;
  onAddBlock: (
    position: 'start' | 'end',
    blockType?: BlockType | null,
    existingBlock?: Block,
    duplicate?: boolean
  ) => void;
  onRemoveBlock: (blockId: number) => void;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onDragStart: (id: number) => void;
  onDragOver: (id: number) => void;
  onDragEnd: () => void;
  onBlockSaved: (tempId: number, saved: Block) => void;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  blocks,
  availableBlocksByType,
  draggedBlockId,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onDragStart,
  onDragOver,
  onDragEnd,
  onBlockSaved
}) => {
  const contentBlock = blocks[0];
  const otherBlocks = blocks.slice(1);

  return (
    <div className="jd-flex-1 jd-flex jd-flex-col jd-min-h-0 jd-border-t jd-pt-4">
      <div className="jd-flex jd-items-center jd-justify-between jd-mb-4">
        <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
          Prompt Content
        </h3>
      </div>

      <div className="jd-flex-1 jd-flex jd-flex-col jd-min-h-0 jd-space-y-4">
        {/* Main Content Block */}
        {contentBlock ? (
          <MainContentBlock
            block={contentBlock}
            onUpdateBlock={onUpdateBlock}
          />
        ) : (
          <div className="jd-flex jd-items-center jd-justify-center jd-min-h-[200px] jd-border jd-border-dashed jd-rounded-md jd-text-sm jd-text-muted-foreground">
            No prompt content yet. Use the button below to add your first block.
          </div>
        )}

        {/* Additional Blocks */}
        {otherBlocks.length > 0 && (
          <AdditionalBlocks
            blocks={otherBlocks}
            availableBlocksByType={availableBlocksByType}
            draggedBlockId={draggedBlockId}
            onRemoveBlock={onRemoveBlock}
            onUpdateBlock={onUpdateBlock}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onBlockSaved={onBlockSaved}
          />
        )}

        {/* Add Block Button */}
        <div className="jd-flex jd-justify-center jd-py-2">
          <AddBlockButton
            availableBlocks={availableBlocksByType}
            onAdd={(type, existing, duplicate) =>
              onAddBlock('end', type, existing, duplicate)
            }
          />
        </div>
      </div>
    </div>
  );
};

// Sub-component for the main content block
const MainContentBlock: React.FC<{
  block: Block;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
}> = ({ block, onUpdateBlock }) => {
  const getContentValue = () => {
    if (typeof block.content === 'string') {
      return block.content;
    }
    const lang = getCurrentLanguage();
    return block.content[lang] || block.content.en || '';
  };

  return (
    <div className="jd-flex-1 jd-flex jd-flex-col jd-min-h-0">
      <h4 className="jd-text-sm jd-font-medium jd-mb-2">Main Content</h4>
      <Textarea
        value={getContentValue()}
        onChange={e => onUpdateBlock(block.id, { content: e.target.value })}
        className="jd-flex-1 jd-min-h-[200px] jd-text-sm jd-resize-none"
        placeholder="Enter main prompt content..."
        onKeyDown={(e) => e.stopPropagation()}
        onKeyPress={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      />
    </div>
  );
};

// Sub-component for additional blocks
const AdditionalBlocks: React.FC<{
  blocks: Block[];
  availableBlocksByType: Record<BlockType, Block[]>;
  draggedBlockId: number | null;
  onRemoveBlock: (blockId: number) => void;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onDragStart: (id: number) => void;
  onDragOver: (id: number) => void;
  onDragEnd: () => void;
  onBlockSaved: (tempId: number, saved: Block) => void;
}> = ({
  blocks,
  availableBlocksByType,
  draggedBlockId,
  onRemoveBlock,
  onUpdateBlock,
  onDragStart,
  onDragOver,
  onDragEnd,
  onBlockSaved
}) => {
  return (
    <div className="jd-flex jd-flex-col jd-space-y-3 jd-max-h-[300px] jd-overflow-y-auto jd-pr-2">
      {blocks.map((block, index) => (
        <div key={block.id} className="jd-animate-in jd-slide-in-from-bottom-2 jd-duration-300">
          <BlockCard
            block={block}
            availableBlocks={availableBlocksByType[block.type || 'custom'] || []}
            onRemove={onRemoveBlock}
            onUpdate={onUpdateBlock}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onSave={(saved) => onBlockSaved(block.id, saved)}
          />
        </div>
      ))}
    </div>
  );
};