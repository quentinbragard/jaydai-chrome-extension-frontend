// src/components/dialogs/prompts/editors/AdvancedEditor/components/MultipleMetadataDropdown.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Plus, X, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { getMessage } from '@/core/utils/i18n';
import { MultipleMetadataType, MetadataItem } from '@/types/prompts/metadata';
import { Block } from '@/types/prompts/blocks';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';
import { trackEvent, EVENTS } from '@/utils/amplitude';

interface MultipleMetadataDropdownProps {
  type: MultipleMetadataType;
  items: MetadataItem[];
  availableBlocks: Block[];
  onRemove: (id: string) => void;
  onAdd: (val: string) => void;
  label: string;
}

export const MultipleMetadataDropdown: React.FC<MultipleMetadataDropdownProps> = ({
  type,
  items,
  availableBlocks,
  onRemove,
  onAdd,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  useThemeDetector();

  const getBlockName = (item: MetadataItem) => {
    if (!item.blockId) return `Empty ${label}`;
    const block = availableBlocks.find(b => b.id === item.blockId);
    return getLocalizedContent(block?.title) || `${label} block`;
  };

  const handleItemRemove = (itemId: string) => {
    try {
      onRemove(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleAddBlock = (blockId: string) => {
    try {
      trackEvent(EVENTS.COMPACT_METADATA_CARD_BLOCK_SELECTED, {
        blockId: blockId,
        type: type
      });
      onAdd(blockId);
      if (blockId === 'create') {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error adding block:', error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const availableBlocksFiltered = availableBlocks.filter(block =>
    !items.some(item => item.blockId === block.id)
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'jd-w-full jd-h-6 jd-text-xs jd-px-2 jd-mt-1 jd-justify-between',
            'jd-border-dashed jd-border-gray-300 jd-dark:jd-border-gray-600',
            'hover:jd-border-primary/50 hover:jd-bg-primary/5 jd-dark:hover:jd-bg-primary/10'
          )}
        >
          <div className="jd-flex jd-items-center jd-gap-1">
            {items.length > 0 ? (
              <>
                <span className="jd-font-medium">{items.length}</span>
                <span className="jd-text-muted-foreground">
                  {label.toLowerCase()}
                  {items.length > 1 ? 's' : ''}
                </span>
              </>
            ) : (
              <></>
            )}
          </div>
          {items.length > 0 ? (
            <ChevronDown className="jd-h-3 jd-w-3 jd-shrink-0" />
          ) : (
            <Plus className="jd-h-3 jd-w-3 jd-shrink-0" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="jd-w-80 jd-z-[10020] jd-p-0">
        {/* Header */}
        <div className="jd-flex jd-items-center jd-justify-between jd-p-3 jd-border-b jd-border-border/50">
          <div className="jd-text-sm jd-font-medium">Select {label.toLowerCase()}s</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground hover:jd-text-foreground"
          >
            <X className="jd-h-3 jd-w-3" />
          </Button>
        </div>

        {/* Selected blocks */}
        {items.length > 0 && (
          <>
            <div className="jd-p-3 jd-bg-muted/30">
              <div className="jd-text-xs jd-font-medium jd-text-muted-foreground jd-mb-2">
                Selected {label.toLowerCase()}s
              </div>
              {items.map(item => (
                <div
                  key={item.id}
                  className="jd-flex jd-items-center jd-justify-between jd-p-2 jd-border jd-rounded jd-mb-2 last:jd-mb-0"
                >
                  <div className="jd-flex-1 jd-min-w-0">
                    <div className="jd-text-sm jd-font-medium jd-truncate">
                      {getBlockName(item)}
                    </div>
                    {item.blockId && (
                      <div className="jd-text-xs jd-text-muted-foreground jd-truncate jd-mt-1">
                        {(() => {
                          const block = availableBlocks.find(b => b.id === item.blockId);
                          const content = block ? getLocalizedContent(block.content) : '';
                          return content.length > 50 ? `${content.substring(0, 50)}...` : content;
                        })()}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleItemRemove(item.id)}
                    className="jd-ml-2 jd-h-7 jd-w-7 jd-p-0 jd-text-muted-foreground hover:jd-text-destructive jd-flex-shrink-0"
                    title={`Remove ${label.toLowerCase()}`}
                  >
                    <Trash2 className="jd-h-3 jd-w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="jd-px-3 jd-py-2 jd-border-b jd-border-border/50">
              <div className="jd-text-xs jd-font-medium jd-text-muted-foreground">
                Add existing {label.toLowerCase()}s
              </div>
            </div>
          </>
        )}

        {/* Available blocks */}
        <div className="jd-max-h-60 jd-overflow-y-auto">
          {availableBlocksFiltered.length === 0 ? (
            <div className="jd-p-4 jd-text-center jd-text-sm jd-text-muted-foreground">
              No more {label.toLowerCase()}s available
            </div>
          ) : (
            availableBlocksFiltered.map(block => (
              <div
                key={block.id}
                className="jd-flex jd-items-center jd-justify-between jd-p-3 jd-border-b jd-border-border/30 last:jd-border-b-0 hover:jd-bg-muted/50 jd-cursor-pointer"
                onClick={() => handleAddBlock(String(block.id))}
              >
                <div className="jd-flex-1 jd-min-w-0">
                  <div className="jd-text-sm jd-font-medium jd-truncate">
                    {getLocalizedContent(block.title) || `${label} block`}
                  </div>
                  <div className="jd-text-xs jd-text-muted-foreground jd-truncate jd-mt-1">
                    {(() => {
                      const content = getLocalizedContent(block.content);
                      return content.length > 50 ? `${content.substring(0, 50)}...` : content;
                    })()}
                  </div>
                </div>
                <Plus className="jd-h-4 jd-w-4 jd-text-muted-foreground jd-ml-2 jd-flex-shrink-0" />
              </div>
            ))
          )}
        </div>

        <div className="jd-p-3 jd-border-t jd-border-border/50">
          <div
            className="jd-flex jd-items-center jd-gap-2 jd-p-2 jd-rounded jd-border jd-border-primary jd-bg-primary/10 jd-text-primary hover:jd-bg-primary/20 jd-cursor-pointer jd-transition-colors"
            onClick={() => handleAddBlock('create')}
          >
            <Plus className="jd-h-4 jd-w-4" />
            <span className="jd-text-sm">
              {getMessage('createTypeBlock', [label.toLowerCase()], `Create new ${label.toLowerCase()} block`)}
            </span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
