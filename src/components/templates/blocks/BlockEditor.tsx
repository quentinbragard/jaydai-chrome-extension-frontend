// src/components/dialogs/templates/blocks/BlockEditor.tsx
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlockItem } from './BlockItem';
import { BlockEditorProps } from './types';
import { getMessage } from '@/core/utils/i18n';

/**
 * Main editor component that displays and manages all blocks
 */
export const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  onUpdateBlock,
  onRemoveBlock,
  onMoveBlock
}) => {
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);

  const handleEditBlock = (blockId: number) => {
    setActiveBlockId(activeBlockId === blockId ? null : blockId);
  };

  const handleUpdateBlock = (blockId: number, updatedBlock: any) => {
    onUpdateBlock(blockId, updatedBlock);
  };

  const handleRemoveBlock = (blockId: number) => {
    onRemoveBlock(blockId);
    if (activeBlockId === blockId) {
      setActiveBlockId(null);
    }
  };

  const handleMoveBlock = (blockId: number, direction: 'up' | 'down') => {
    onMoveBlock(blockId, direction);
  };

  if (blocks.length === 0) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full jd-text-muted-foreground jd-p-8">
        <div className="jd-text-center">
          <p className="jd-mb-2">{getMessage('noBlocks', undefined, 'No blocks in this template.')}</p>
          <p className="jd-text-sm">{getMessage('addBlockToStart', undefined, 'Add a block above to get started.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jd-h-full jd-flex jd-flex-col">
      <div className="jd-mb-4">
        <h3 className="jd-text-sm jd-font-medium jd-mb-2">
          {getMessage('promptBlocks', undefined, 'Prompt Blocks')}
        </h3>
        <p className="jd-text-xs jd-text-muted-foreground">
          {getMessage('blockEditorDescription', undefined, 'Click on a block to edit it. Use placeholders like [variable] to make your prompt dynamic.')}
        </p>
      </div>
      
      <ScrollArea className="jd-flex-1 jd-border jd-rounded-md jd-p-4">
        <div className="jd-space-y-4">
          {blocks.map((block, index) => (
            <BlockItem
              key={block.id}
              block={block}
              index={index}
              isActive={activeBlockId === block.id}
              onEdit={() => handleEditBlock(block.id)}
              onUpdate={(updatedBlock) => handleUpdateBlock(block.id, updatedBlock)}
              onRemove={() => handleRemoveBlock(block.id)}
              onMoveUp={() => handleMoveBlock(block.id, 'up')}
              onMoveDown={() => handleMoveBlock(block.id, 'down')}
              canMoveUp={index > 0}
              canMoveDown={index < blocks.length - 1}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};