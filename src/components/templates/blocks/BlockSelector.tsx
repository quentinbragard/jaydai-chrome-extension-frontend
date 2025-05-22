// src/components/dialogs/templates/blocks/BlockSelector.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { BlockSelectorProps, BlockType, BLOCK_TYPES } from './types';
import { ExistingBlocksDropdown } from './ExistingBlocksDropdown';
import { getMessage } from '@/core/utils/i18n';

/**
 * Modal-like selector for choosing block types and existing blocks
 */
export const BlockSelector: React.FC<BlockSelectorProps> = ({ 
  onSelectBlock, 
  onCancel 
}) => {
  const [selectedType, setSelectedType] = useState<BlockType | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close
  useEffect(() => {
    const root = (cardRef.current?.getRootNode() ?? document) as Document | ShadowRoot;

    const handleClickOutside = (event: MouseEvent) => {
      const path = event.composedPath();
      if (cardRef.current && !path.includes(cardRef.current)) {
        onCancel();
      }
    };

    root.addEventListener('mousedown', handleClickOutside);
    return () => root.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  // Handle escape key
  useEffect(() => {
    const root = (cardRef.current?.getRootNode() ?? document) as Document | ShadowRoot;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedType) {
          setSelectedType(null);
        } else {
          onCancel();
        }
      }
    };

    root.addEventListener('keydown', handleEscape);
    return () => root.removeEventListener('keydown', handleEscape);
  }, [selectedType, onCancel]);

  const handleTypeSelect = (type: BlockType) => {
    setSelectedType(type);
  };

  const handleBack = () => {
    setSelectedType(null);
  };

  const handleSelectExisting = (block: any) => {
    onSelectBlock(selectedType!, block);
  };

  const handleCreateNew = () => {
    onSelectBlock(selectedType!);
  };

  return (
    <Card 
      ref={cardRef} 
      className="jd-w-80 jd-shadow-lg jd-border jd-bg-background jd-max-h-96 jd-overflow-hidden"
    >
      <CardContent className="jd-p-4">
        <div className="jd-flex jd-items-center jd-justify-between jd-mb-4">
          <h3 className="jd-text-sm jd-font-semibold">
            {selectedType 
              ? getMessage('selectExistingOrCreate', undefined, 'Select Existing or Create New')
              : getMessage('selectBlockType', undefined, 'Select Block Type')
            }
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={selectedType ? handleBack : onCancel}
            className="jd-h-6 jd-w-6"
          >
            <X className="jd-h-4 jd-w-4" />
          </Button>
        </div>

        {!selectedType ? (
          <div className="jd-space-y-2 jd-max-h-80 jd-overflow-y-auto">
            {BLOCK_TYPES.map((blockType) => (
              <Button
                key={blockType.id}
                variant="ghost"
                onClick={() => handleTypeSelect(blockType.id)}
                className="jd-w-full jd-justify-start jd-h-auto jd-p-3 jd-text-left"
              >
                <div className="jd-flex jd-items-center jd-gap-3">
                  <div className={`jd-w-3 jd-h-3 jd-rounded-full ${blockType.color}`} />
                  <div>
                    <div className="jd-font-medium">{blockType.name}</div>
                    <div className="jd-text-xs jd-text-muted-foreground">
                      {blockType.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <ExistingBlocksDropdown
            blockType={selectedType}
            onSelectExisting={handleSelectExisting}
            onCreateNew={handleCreateNew}
          />
        )}
      </CardContent>
    </Card>
  );
};