// src/components/dialogs/prompts/editors/AdvancedEditor/components/SingleMetadataDropdown.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Plus, Check, X, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { getMessage } from '@/core/utils/i18n';
import {
  SingleMetadataType,
  MetadataItem
} from '@/types/prompts/metadata';
import { Block } from '@/types/prompts/blocks';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';
import { trackEvent, EVENTS } from '@/utils/analytics';

interface SingleMetadataDropdownProps {
  type: SingleMetadataType;
  selectedBlockId: number;
  availableBlocks: Block[];
  onSelect: (val: string) => void;
  label: string;
}

export const SingleMetadataDropdown: React.FC<SingleMetadataDropdownProps> = ({
  type,
  selectedBlockId,
  availableBlocks,
  onSelect,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  useThemeDetector();

  const selectedBlock =
    selectedBlockId && selectedBlockId !== 0
      ? availableBlocks.find(b => b.id === selectedBlockId)
      : null;

  // FIXED: Enhanced block selection with error handling and proper dropdown closing
  const handleSelectBlock = (blockId: string) => {
    try {
      trackEvent(EVENTS.COMPACT_METADATA_CARD_BLOCK_SELECTED, {
        blockId: blockId,
        type: type
      });
      onSelect(blockId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error selecting block:', error);
      // Keep dropdown open on error
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

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
          <div className="jd-flex jd-items-center jd-gap-1 jd-flex-1 jd-min-w-0">
            {selectedBlock ? (
              <span className="jd-truncate">
                {getLocalizedContent(selectedBlock.title) || `${label} block`}
              </span>
            ) : (
              <> 
              </>
            )}
          </div>
          {selectedBlock ? (
            <ChevronDown className="jd-h-3 jd-w-3 jd-flex-shrink-0 jd-ml-1" />
          ) : (
            <Plus className="jd-h-3 jd-w-3 jd-flex-shrink-0" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="jd-w-80 jd-z-[10020] jd-p-0">
        {/* Header */}
        <div className="jd-flex jd-items-center jd-justify-between jd-p-3 jd-border-b jd-border-border/50">
          <div className="jd-text-sm jd-font-medium">
            Select {label.toLowerCase()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground hover:jd-text-foreground"
          >
            <X className="jd-h-3 jd-w-3" />
          </Button>
        </div>

        {/* Create new block option - Always at top for easy access */}
        <div className="jd-p-3 jd-border-b jd-border-border/50">
          <div
            className="jd-flex jd-items-center jd-gap-2 jd-p-2 jd-rounded jd-border jd-border-primary jd-bg-primary/10 jd-text-primary hover:jd-bg-primary/20 jd-cursor-pointer jd-transition-colors"
            onClick={() => handleSelectBlock('create')}
          >
            <Plus className="jd-h-4 jd-w-4" />
            <span className="jd-text-sm">
              {getMessage('createTypeBlock', [label.toLowerCase()], `Create new ${label.toLowerCase()} block`)}
            </span>
          </div>
        </div>

        {/* Current selection (if any) */}
        {selectedBlock && (
          <>
            <div className="jd-p-3 jd-bg-muted/30">
              <div className="jd-text-xs jd-font-medium jd-text-muted-foreground jd-mb-2">
                Current selection
              </div>
              <div className="jd-flex jd-items-center jd-justify-between jd-p-2 jd-bg-background jd-rounded jd-border">
                <div className="jd-flex-1 jd-min-w-0">
                  <div className="jd-text-sm jd-font-medium jd-truncate">
                    {getLocalizedContent(selectedBlock.title) || `${label} block`}
                  </div>
                  <div className="jd-text-xs jd-text-muted-foreground jd-truncate jd-mt-1">
                    {(() => {
                      const content = getLocalizedContent(selectedBlock.content);
                      return content.length > 50 ? `${content.substring(0, 50)}...` : content;
                    })()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectBlock('0')}
                  className="jd-ml-2 jd-h-7 jd-w-7 jd-p-0 jd-text-muted-foreground hover:jd-text-destructive jd-flex-shrink-0"
                  title={`Remove ${label.toLowerCase()}`}
                >
                  <Trash2 className="jd-h-3 jd-w-3" />
                </Button>
              </div>
            </div>
            <div className="jd-px-3 jd-py-2 jd-border-b jd-border-border/50">
              <div className="jd-text-xs jd-font-medium jd-text-muted-foreground">
                Or choose a different {label.toLowerCase()}
              </div>
            </div>
          </>
        )}

        {/* Available blocks list */}
        <div className="jd-max-h-60 jd-overflow-y-auto">
          {availableBlocks.length === 0 ? (
            <div className="jd-p-4 jd-text-center jd-text-sm jd-text-muted-foreground">
              No {label.toLowerCase()}s available
            </div>
          ) : (
            availableBlocks
              .filter(block => !selectedBlock || block.id !== selectedBlock.id)
              .map(block => (
                <div
                  key={block.id}
                  className="jd-flex jd-items-center jd-justify-between jd-p-3 jd-border-b jd-border-border/30 last:jd-border-b-0 hover:jd-bg-muted/50 jd-cursor-pointer"
                  onClick={() => handleSelectBlock(String(block.id))}
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
                  {selectedBlock && selectedBlock.id === block.id ? (
                    <Check className="jd-h-4 jd-w-4 jd-text-green-500 jd-ml-2 jd-flex-shrink-0" />
                  ) : (
                    <Plus className="jd-h-4 jd-w-4 jd-text-muted-foreground jd-ml-2 jd-flex-shrink-0" />
                  )}
                </div>
              ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};