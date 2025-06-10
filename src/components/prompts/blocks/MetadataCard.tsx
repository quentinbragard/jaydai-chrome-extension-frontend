// src/components/prompts/blocks/MetadataCard.tsx - Enhanced version
import React from 'react';
import { Block, MetadataType, METADATA_CONFIGS } from '@/types/prompts/metadata';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import {
  getLocalizedContent,
  getBlockTypeColors,
  getBlockIconColors,
  getBlockTextColors
} from '@/utils/prompts/blockUtils';
import { useThemeDetector } from '@/hooks/useThemeDetector';

interface MetadataCardProps {
  type: MetadataType;
  icon: React.ComponentType<any>;
  availableBlocks: Block[];
  expanded: boolean;
  selectedId: number;
  customValue: string;
  isPrimary?: boolean;
  onSelect: (value: string) => void;
  onCustomChange: (value: string) => void;
  onToggle: () => void;
  onRemove?: () => void;
  onSaveBlock?: (block: Block) => void;
}

export const MetadataCard: React.FC<MetadataCardProps> = ({
  type,
  icon: Icon,
  availableBlocks,
  expanded,
  selectedId,
  customValue,
  isPrimary = false,
  onSelect,
  onCustomChange,
  onToggle,
  onRemove,
  onSaveBlock
}) => {
  const config = METADATA_CONFIGS[type];
  const isDarkMode = useThemeDetector();
  const cardColors = getBlockTypeColors(config.blockType, isDarkMode);
  const iconColors = getBlockIconColors(config.blockType, isDarkMode);
  const { openDialog } = useDialogManager();

  // Find the selected block
  const selectedBlock = selectedId && selectedId !== 0 
    ? availableBlocks.find(b => b.id === selectedId) 
    : null;

  // Get the display content - either from selected block or custom value
  const getDisplayContent = (): string => {
    if (selectedBlock) {
      return getLocalizedContent(selectedBlock.content) || '';
    }
    return customValue || '';
  };

  // Get the display title
  const getDisplayTitle = (): string => {
    if (selectedBlock) {
      return getLocalizedContent(selectedBlock.title) || `${type} block`;
    }
    if (customValue?.trim()) {
      return 'Custom value';
    }
    return `Click to set ${type}`;
  };

  // Click outside handler to collapse the card
  const cardRef = useClickOutside<HTMLDivElement>(() => {
    if (expanded) {
      onToggle();
    }
  }, expanded);

  // Handle card click - only toggle if clicking on the card itself, not on interactive elements
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button') || 
                         target.closest('[role="combobox"]') || 
                         target.closest('select') || 
                         target.closest('textarea') ||
                         target.closest('input') ||
                         target.closest('[data-radix-collection-item]') ||
                         target.closest('[data-radix-select-trigger]') ||
                         target.closest('[data-radix-select-content]');
    
    if (!isInteractive) {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    }
  };

  // Stop propagation for interactive elements
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      ref={cardRef}
      onClick={handleCardClick}
      className={cn(
        'jd-transition-all jd-duration-300 jd-cursor-pointer hover:jd-shadow-md',
        'jd-border-2 jd-backdrop-blur-sm jd-py-2 jd-select-none',
        cardColors,
        isPrimary && 'jd-border-primary/20',
        expanded &&
          (isDarkMode
            ? 'jd-ring-2 jd-ring-primary/50 jd-shadow-lg jd-bg-gray-800'
            : 'jd-ring-2 jd-ring-primary/50 jd-shadow-lg jd-bg-white')
      )}
    >
      <CardContent className="jd-p-4">
        <div className="jd-flex jd-items-center jd-justify-between">
          <div className="jd-flex jd-items-center jd-gap-2">
            <div className={cn('jd-p-1.5 jd-rounded-md', iconColors)}>
              <Icon className="jd-h-4 jd-w-4" />
            </div>
            <span className={cn('jd-font-medium', getBlockTextColors(config.blockType, isDarkMode))}>
              {config.label}
            </span>
          </div>
          <div className="jd-flex jd-items-center jd-gap-1" onClick={stopPropagation}>
            {!isPrimary && onRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground jd-hover:jd-text-destructive"
              >
                <Trash2 className="jd-h-3 jd-w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="jd-h-6 jd-w-6 jd-p-0"
            >
              {expanded ? <ChevronUp className="jd-h-3 jd-w-3" /> : <ChevronDown className="jd-h-3 jd-w-3" />}
            </Button>
          </div>
        </div>

        {expanded ? (
          <div className="jd-space-y-3 jd-mt-3" onClick={stopPropagation}>
            {/* Block Selection Dropdown */}
            <Select
              value={selectedId ? String(selectedId) : '0'}
              onValueChange={(value) => {
                if (value === 'custom') {
                  openDialog(DIALOG_TYPES.CREATE_BLOCK, {
                    initialType: config.blockType,
                    onBlockCreated: (b) => {
                      onSaveBlock && onSaveBlock(b);
                      onSelect(String(b.id));
                      onToggle();
                    }
                  });
                  return;
                }
                onSelect(value);
                if (value !== '0') {
                  onToggle();
                }
              }}
            >
              <SelectTrigger className="jd-w-full">
                <SelectValue placeholder="Select or create custom" />
              </SelectTrigger>
              <SelectContent className="jd-z-[10010]">
                <SelectItem value="0">None</SelectItem>
                {availableBlocks.map((block) => (
                  <SelectItem key={block.id} value={String(block.id)}>
                    <div className="jd-flex jd-items-center jd-gap-2">
                      <span className="jd-font-medium jd-truncate jd-max-w-32">
                        {getLocalizedContent(block.title) || `${type} block`}
                      </span>
                      <span className="jd-text-xs jd-text-muted-foreground jd-truncate jd-max-w-48">
                        {typeof block.content === 'string'
                          ? block.content.substring(0, 40) + (block.content.length > 40 ? '...' : '')
                          : (block.content[getCurrentLanguage()] || '').substring(0, 40) + 
                            ((block.content[getCurrentLanguage()] || '').length > 40 ? '...' : '')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="custom">
                  <div className="jd-flex jd-items-center jd-gap-2">
                    <Plus className="jd-h-3 jd-w-3" />
                    Create custom {type}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Value Input - Only show when no block is selected */}
            {(!selectedId || selectedId === 0) && (
              <div className="jd-space-y-2">
                <label className="jd-text-xs jd-font-medium jd-text-muted-foreground">
                  Custom {type}:
                </label>
                <Textarea
                  value={customValue}
                  onChange={(e) => onCustomChange(e.target.value)}
                  placeholder={`Enter custom ${type}...`}
                  className="jd-min-h-[80px] jd-text-sm jd-resize-none"
                  rows={3}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyPress={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Block Content Preview - Show when a block is selected */}
            {selectedBlock && (
              <div className="jd-space-y-2">
                <label className="jd-text-xs jd-font-medium jd-text-muted-foreground">
                  Selected {type} content:
                </label>
                <div className="jd-p-3 jd-rounded jd-bg-muted/50 jd-text-sm jd-max-h-20 jd-overflow-y-auto">
                  {getLocalizedContent(selectedBlock.content) || 'No content'}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Collapsed view - show content preview
          <div className="jd-text-sm jd-text-muted-foreground jd-mt-2">
            <div className="jd-font-medium jd-text-xs jd-text-foreground jd-mb-1">
              {getDisplayTitle()}
            </div>
            <div className="jd-text-xs jd-line-clamp-2">
              {getDisplayContent() 
                ? (getDisplayContent().substring(0, 60) + (getDisplayContent().length > 60 ? '...' : ''))
                : `Click to set ${type}`
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};