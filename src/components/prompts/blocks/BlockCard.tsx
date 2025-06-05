// Enhanced BlockCard with consistent styling
import React, { useState } from 'react';
import { Block, BlockType, isMetadataBlock } from '@/types/prompts/blocks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Trash2, GripVertical, Plus, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import {
  BLOCK_TYPES,
  BLOCK_TYPE_LABELS,
  getLocalizedContent,
  getBlockTypeIcon,
  getBlockTypeColors,
  getBlockIconColors
} from './blockUtils';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { cn } from '@/core/utils/classNames';

const AVAILABLE_BLOCK_TYPES = BLOCK_TYPES.filter(t => !isMetadataBlock(t));

interface BlockCardProps {
  block: Block;
  availableBlocks: Block[];
  onRemove: (id: number) => void;
  onUpdate: (id: number, updated: Partial<Block>) => void;
  onDragStart?: (id: number) => void;
  onDragOver?: (id: number) => void;
  onDragEnd?: () => void;
  onSave?: (block: Block) => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  availableBlocks,
  onRemove,
  onUpdate,
  onDragStart,
  onDragOver,
  onDragEnd,
  onSave
}) => {
  const isDark = useThemeDetector();
  const Icon = getBlockTypeIcon(block.type || 'content');
  const cardColors = getBlockTypeColors(block.type || 'content', isDark);
  const iconBg = getBlockIconColors(block.type || 'content', isDark);
  const content = typeof block.content === 'string' 
    ? block.content 
    : block.content[getCurrentLanguage()] || block.content.en || '';

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalContent, setOriginalContent] = useState(content);
  const [originalType, setOriginalType] = useState(block.type);
  const { openDialog } = useDialogManager();

  const handleContentChange = (newContent: string) => {
    if (typeof block.content === 'string') {
      onUpdate(block.id, { content: newContent });
    } else {
      const lang = getCurrentLanguage();
      onUpdate(block.id, {
        content: { ...block.content, [lang]: newContent }
      });
    }
    
    // Track if content has changed
    setHasUnsavedChanges(newContent !== originalContent || block.type !== originalType);
  };

  const handleTypeChange = (newType: BlockType) => {
    onUpdate(block.id, { type: newType });
    setHasUnsavedChanges(content !== originalContent || newType !== originalType);
  };

  const isContentType = block.type === 'content';
  const blocksForType = block.type ? availableBlocks : [];
  const existing = blocksForType.find(b => b.id === block.id);
  const readOnly = !block.isNew;

  // Show save button if:
  // 1. Block is new and has content and type, OR
  // 2. Block is existing but has unsaved changes
  const shouldShowSaveButton = (block.isNew && content.trim() && block.type) || 
                               (!block.isNew && hasUnsavedChanges);

  React.useEffect(() => {
    if (block.type && !existing && !block.isNew) {
      onUpdate(block.id, { isNew: true });
    }
  }, [block.type, existing, block.isNew]);

  const selectedExistingId = existing && !block.isNew ? String(existing.id) : 'custom';

  const handleExistingSelect = (value: string) => {
    if (value === 'custom') {
      onUpdate(block.id, { isNew: true });
      setOriginalContent('');
      setOriginalType(block.type);
    } else {
      const found = blocksForType.find(b => b.id === Number(value));
      if (found) {
        onUpdate(block.id, {
          ...found,
          name: getLocalizedContent(found.title),
          isNew: false
        });
        setOriginalContent(getLocalizedContent(found.content));
        setOriginalType(found.type);
        setHasUnsavedChanges(false);
      }
    }
  };

  const handleSaveClick = () => {
    openDialog(DIALOG_TYPES.CREATE_BLOCK, {
      initialType: block.type || 'content',
      initialContent: content,
      onBlockCreated: handleBlockCreated
    });
  };

  const handleBlockCreated = (newBlock: Block) => {
    if (onSave) {
      onSave(newBlock);
    }
    
    // Update current block to reference the new saved block
    onUpdate(block.id, { 
      id: newBlock.id, 
      isNew: false,
      name: getLocalizedContent(newBlock.title)
    });
    
    // Reset tracking
    setOriginalContent(content);
    setOriginalType(block.type);
    setHasUnsavedChanges(false);
  };

  return (
    <Card
      className={cn(
        'jd-transition-all jd-duration-300 jd-transform jd-group',
        'hover:jd-shadow-xl hover:jd-scale-[1.02] hover:-jd-translate-y-1',
        'jd-border-2 jd-backdrop-blur-sm',
        cardColors
      )}
      draggable
      onDragStart={() => onDragStart && onDragStart(block.id)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver && onDragOver(block.id);
      }}
      onDragEnd={() => onDragEnd && onDragEnd()}
    >
      <CardContent className="jd-p-4">
        <div className="jd-flex jd-items-center jd-justify-between jd-mb-4">
          <div className="jd-flex jd-items-center jd-gap-3">
            <div className="jd-flex jd-items-center jd-gap-2">
              <GripVertical className="jd-h-4 jd-w-4 jd-text-muted-foreground jd-opacity-50 group-hover:jd-opacity-100 jd-transition-opacity jd-cursor-grab" />
              <div
                className={cn(
                  'jd-p-2 jd-rounded-lg jd-transition-all jd-duration-300',
                  'group-hover:jd-scale-110 group-hover:jd-rotate-3',
                  iconBg
                )}
              >
                <Icon className="jd-h-4 jd-w-4" />
              </div>
            </div>
            <div className="jd-flex jd-items-center jd-gap-2">
              <span className="jd-font-semibold jd-text-sm">
                {block.name || 'Block'}
                {hasUnsavedChanges && <span className="jd-text-amber-500 jd-ml-1">*</span>}
              </span>
              {!readOnly && (
                <>
                  <Select
                    value={block.type || ''}
                    onValueChange={(value) => handleTypeChange(value as BlockType)}
                  >
                    <SelectTrigger className="jd-w-32 jd-text-xs jd-h-7">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="jd-z-[10010]">
                      {AVAILABLE_BLOCK_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {BLOCK_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isContentType && (
                    <Select value={selectedExistingId} onValueChange={handleExistingSelect}>
                      <SelectTrigger className="jd-w-40 jd-text-xs jd-h-7">
                        <SelectValue placeholder="Select block" />
                      </SelectTrigger>
                      <SelectContent className="jd-z-[10010]">
                        {blocksForType.map(b => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {getLocalizedContent(b.title) || 'Block'}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">
                          <div className="jd-flex jd-items-center jd-gap-1">
                            <Plus className="jd-h-3 jd-w-3" /> Create custom
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}
              {readOnly && (
                <span className="jd-text-xs jd-text-muted-foreground">(Existing)</span>
              )}
            </div>
          </div>
          
          <div className="jd-flex jd-items-center jd-gap-1">
            {shouldShowSaveButton && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveClick}
                className="jd-h-8 jd-px-3 jd-text-blue-600 jd-hover:jd-text-blue-700 jd-hover:jd-bg-blue-50 jd-transition-colors"
                title="Save as new block"
              >
                <Save className="jd-h-3 jd-w-3 jd-mr-1" />
                Save
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(block.id)}
              className="jd-h-8 jd-w-8 jd-p-0 jd-text-muted-foreground jd-hover:jd-text-destructive jd-transition-colors"
              title="Delete block"
            >
              <Trash2 className="jd-h-4 jd-w-4" />
            </Button>
          </div>
        </div>

        <div className="jd-space-y-3">
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="jd-resize-none jd-min-h-[100px] jd-text-sm jd-transition-colors jd-focus:jd-ring-2"
            placeholder={block.type ? `Enter ${block.type} content...` : 'Enter block content...'}
            readOnly={readOnly}
          />

          {!readOnly && content && (
            <div className="jd-flex jd-justify-between jd-text-xs jd-text-muted-foreground">
              <span>{content.length} characters</span>
              <span>{content.split('\n').length} lines</span>
            </div>
          )}

          {block.isNew && shouldShowSaveButton && (
            <Input
              value={block.name || ''}
              onChange={(e) => onUpdate(block.id, { name: e.target.value })}
              placeholder="Block name (will be auto-generated)"
              className="jd-text-xs"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};