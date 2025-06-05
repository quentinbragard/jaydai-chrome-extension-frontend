// src/components/prompts/blocks/MultipleMetadataCard.tsx
import React, { useState } from 'react';
import { Block, MultipleMetadataType, MetadataItem, METADATA_CONFIGS } from '@/types/prompts/metadata';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, ChevronUp, ChevronDown, Plus, GripVertical } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import {
  getLocalizedContent,
  getBlockTypeColors,
  getBlockIconColors,
  getBlockTextColors
} from '@/components/prompts/blocks/blockUtils';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';

interface MultipleMetadataCardProps {
  type: MultipleMetadataType;
  icon: React.ComponentType<any>;
  availableBlocks: Block[];
  items: MetadataItem[];
  expanded: boolean;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<MetadataItem>) => void;
  onToggle: () => void;
  onRemove?: () => void;
  onSaveBlock?: (block: Block) => void;
  onReorderItems?: (newItems: MetadataItem[]) => void;
}

interface MetadataItemRowProps {
  item: MetadataItem;
  index: number;
  config: typeof METADATA_CONFIGS[keyof typeof METADATA_CONFIGS];
  availableBlocks: Block[];
  isDarkMode: boolean;
  draggedItemId: string | null;
  draggable: boolean;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<MetadataItem>) => void;
  onSaveBlock?: (block: Block) => void;
  onDragStart: (itemId: string) => void;
  onDragOver: (itemId: string) => void;
  onDragEnd: () => void;
  stopPropagation: (e: React.MouseEvent) => void;
}

const MetadataItemRow: React.FC<MetadataItemRowProps> = ({
  item,
  index,
  config,
  availableBlocks,
  isDarkMode,
  draggedItemId,
  draggable,
  onRemoveItem,
  onUpdateItem,
  onSaveBlock,
  onDragStart,
  onDragOver,
  onDragEnd,
  stopPropagation
}) => {
  const isCustom = !item.blockId;
  const { openDialog } = useDialogManager();

  const handleItemSelect = (value: string) => {
    if (value === 'custom') {
      openDialog(DIALOG_TYPES.CREATE_BLOCK, {
        initialType: config.blockType,
        onBlockCreated: (b) => {
          onSaveBlock && onSaveBlock(b);
          const content = getLocalizedContent(b.content) || '';
          onUpdateItem(item.id, { blockId: b.id, value: content });
        }
      });
    } else {
      const blockId = Number(value);
      const block = availableBlocks.find(b => b.id === blockId);
      if (block) {
        const content = getLocalizedContent(block.content) || '';
        onUpdateItem(item.id, { blockId, value: content });
      }
    }
  };


  return (
    <div
      className={cn(
        'jd-border jd-rounded-lg jd-p-3 jd-space-y-3 jd-transition-all jd-duration-200',
        isDarkMode ? 'jd-bg-gray-800/50 jd-border-gray-700' : 'jd-bg-white/50 jd-border-gray-200',
        draggedItemId === item.id && 'jd-opacity-50'
      )}
      draggable={draggable}
      onDragStart={() => onDragStart(item.id)}
      onDragOver={e => {
        e.preventDefault();
        onDragOver(item.id);
      }}
      onDragEnd={onDragEnd}
      onClick={stopPropagation}
    >
      <div className="jd-flex jd-items-center jd-justify-between">
        <div className="jd-flex jd-items-center jd-gap-2">
          {draggable && <GripVertical className="jd-h-4 jd-w-4 jd-text-muted-foreground jd-cursor-grab" />}
          <span className="jd-text-sm jd-font-medium">
            {config.label} {index + 1}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemoveItem(item.id)}
          className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground jd-hover:jd-text-destructive"
        >
          <Trash2 className="jd-h-3 jd-w-3" />
        </Button>
      </div>

      <Select value={isCustom ? 'custom' : item.blockId?.toString() || 'custom'} onValueChange={handleItemSelect}>
        <SelectTrigger className="jd-w-full">
          <SelectValue placeholder={`Select or create custom ${config.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {availableBlocks.map(block => (
            <SelectItem key={block.id} value={block.id.toString()}>
              <div className="jd-flex jd-items-center jd-gap-2">
                <span className="jd-font-medium jd-truncate jd-max-w-32">
                  {getLocalizedContent(block.title) || `${config.blockType} block`}
                </span>
                <span className="jd-text-xs jd-text-muted-foreground jd-truncate jd-max-w-48">
                  {typeof block.content === 'string'
                    ? block.content.substring(0, 40) + (block.content.length > 40 ? '...' : '')
                    : (getLocalizedContent(block.content) || '').substring(0, 40) +
                      ((getLocalizedContent(block.content) || '').length > 40 ? '...' : '')}
                </span>
              </div>
            </SelectItem>
          ))}
          <SelectItem value="custom">
            <div className="jd-flex jd-items-center jd-gap-2">
              <Plus className="jd-h-3 jd-w-3" />
              Create custom {config.label.toLowerCase()}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {isCustom && (
        <Textarea
          value={item.value}
          onChange={e => onUpdateItem(item.id, { value: e.target.value })}
          placeholder={config.placeholder}
          rows={3}
          className="jd-resize-none"
        />
      )}
    </div>
  );
};

export const MultipleMetadataCard: React.FC<MultipleMetadataCardProps> = ({
  type,
  icon: Icon,
  availableBlocks,
  items,
  expanded,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onToggle,
  onRemove,
  onSaveBlock,
  onReorderItems
}) => {
  const config = METADATA_CONFIGS[type];
  const isDarkMode = useThemeDetector();
  const cardColors = getBlockTypeColors(config.blockType, isDarkMode);
  const iconColors = getBlockIconColors(config.blockType, isDarkMode);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const cardRef = useClickOutside<HTMLDivElement>(() => {
    if (expanded) {
      onToggle();
    }
  }, expanded);

  // Handle card click - only toggle if clicking on the card itself
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button') || 
                         target.closest('[role="combobox"]') || 
                         target.closest('select') || 
                         target.closest('textarea') ||
                         target.closest('[data-radix-collection-item]');
    
    if (!isInteractive) {
      onToggle();
    }
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle drag and drop for reordering
  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId);
  };

  const handleDragOver = (targetItemId: string) => {
    if (!draggedItemId || draggedItemId === targetItemId || !onReorderItems) return;
    
    const draggedIndex = items.findIndex(item => item.id === draggedItemId);
    const targetIndex = items.findIndex(item => item.id === targetItemId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newItems = [...items];
    const [moved] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, moved);
    
    onReorderItems(newItems);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };


  return (
    <Card
      ref={cardRef}
      onClick={handleCardClick}
      className={cn(
        'jd-transition-all jd-duration-300 jd-cursor-pointer hover:jd-shadow-md',
        'jd-border-2 jd-backdrop-blur-sm jd-py-2',
        cardColors,
        expanded &&
          (isDarkMode
            ? 'jd-ring-2 jd-ring-primary/50 jd-shadow-lg jd-bg-gray-800'
            : 'jd-ring-2 jd-ring-primary/50 jd-shadow-lg jd-bg-white')
      )}
    >
      <CardContent className="jd-p-4">
        {/* Card header */}
        <div className="jd-flex jd-items-center jd-justify-between">
          <div className="jd-flex jd-items-center jd-gap-2">
            <div className={cn('jd-p-1.5 jd-rounded-md', iconColors)}>
              <Icon className="jd-h-4 jd-w-4" />
            </div>
            <span className={cn('jd-font-medium', getBlockTextColors(config.blockType, isDarkMode))}>
              {config.label}s {items.length > 0 && `(${items.length})`}
            </span>
          </div>
          <div className="jd-flex jd-items-center jd-gap-1" onClick={stopPropagation}>
            {onRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
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

        {/* Collapsed preview */}
        {!expanded && items.length > 0 && (
          <div className="jd-mt-2 jd-text-sm jd-text-muted-foreground">
            {items.slice(0, 2).map((item, index) => (
              <div key={item.id} className="jd-truncate">
                {index + 1}. {item.value.substring(0, 50)}{item.value.length > 50 ? '...' : ''}
              </div>
            ))}
            {items.length > 2 && (
              <div className="jd-text-xs jd-opacity-75">
                +{items.length - 2} more...
              </div>
            )}
          </div>
        )}

        {/* Expanded content */}
          {expanded && (
          <div className="jd-space-y-3 jd-mt-4" onClick={stopPropagation}>
            {items.map((item, index) => (
              <MetadataItemRow
                key={item.id}
                item={item}
                index={index}
                config={config}
                availableBlocks={availableBlocks}
                isDarkMode={isDarkMode}
                draggedItemId={draggedItemId}
                draggable={!!onReorderItems}
                onRemoveItem={onRemoveItem}
                onUpdateItem={onUpdateItem}
                onSaveBlock={onSaveBlock}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                stopPropagation={stopPropagation}
              />
            ))}
            
            {/* Add new item button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onAddItem}
              className="jd-w-full jd-border-dashed"
            >
              <Plus className="jd-h-4 jd-w-4 jd-mr-2" />
              Add {config.label}
            </Button>
          </div>
        )}

        {/* Empty state when collapsed */}
        {!expanded && items.length === 0 && (
          <div className="jd-text-sm jd-text-muted-foreground jd-mt-2">
            Click to add {config.label.toLowerCase()}s
          </div>
        )}
      </CardContent>
    </Card>
  );
};