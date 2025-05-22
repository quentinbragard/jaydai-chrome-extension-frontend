// src/components/dialogs/templates/blocks/AddBlockButton.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BlockSelector } from './BlockSelector';
import { AddBlockButtonProps, BlockType, Block } from './types';
import { getMessage } from '@/core/utils/i18n';
import { cn } from "@/core/utils/classNames";

/**
 * Floating button that triggers block selection
 */
export const AddBlockButton: React.FC<AddBlockButtonProps> = ({ 
  position, 
  onAddBlock, 
  className 
}) => {
  const [showSelector, setShowSelector] = useState(false);

  const handleSelectBlock = (blockType: BlockType, existingBlock?: Block) => {
    onAddBlock(position, blockType, existingBlock);
    setShowSelector(false);
  };

  const handleCancel = () => {
    setShowSelector(false);
  };

  return (
    <div className={cn("jd-relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSelector(true)}
        className="jd-border-dashed jd-border-2 jd-border-primary/30 hover:jd-border-primary jd-bg-background/50 hover:jd-bg-background jd-transition-all jd-duration-200"
      >
        <Plus className="jd-h-4 jd-w-4 jd-mr-2" />
        {getMessage('addBlock', undefined, 'Add Block')}
        {position === 'start' && ' ' + getMessage('above', undefined, 'Above')}
        {position === 'end' && ' ' + getMessage('below', undefined, 'Below')}
      </Button>

      {showSelector && (
        <div className="jd-absolute jd-top-full jd-left-1/2 jd-transform -jd-translate-x-1/2 jd-mt-2 jd-z-50">
          <BlockSelector
            onSelectBlock={handleSelectBlock}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
};