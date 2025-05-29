import React, { useEffect, useState } from 'react';
import { Block, BlockType, METADATA_BLOCK_TYPES } from '@/types/prompts/blocks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, GripVertical } from 'lucide-react';
import { Plus } from 'lucide-react';
import { SaveBlockButton } from '@/components/prompts/blocks/SaveBlockButton';
import { blocksApi } from '@/services/api/BlocksApi';
import { getCurrentLanguage } from '@/core/utils/i18n';
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




interface BlockCardProps {
  block: Block;
  onRemove: (id: number) => void;
  onUpdate: (id: number, updated: Partial<Block>) => void;
  onDragStart?: (id: number) => void;
  onDragOver?: (id: number) => void;
  onDragEnd?: () => void;
  onSave?: (block: Block) => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
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
  const AVAILABLE_TYPES = BLOCK_TYPES.filter(
    (t) => !METADATA_BLOCK_TYPES.includes(t)
  );

  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);

  useEffect(() => {
    const fetchBlocks = async () => {
      if (!block.type) return;
      const res = await blocksApi.getBlocksByType(block.type);
      setAvailableBlocks(res.success ? res.data : []);
    };
    fetchBlocks();
  }, [block.type]);
  const content = typeof block.content === 'string' 
    ? block.content 
    : block.content[getCurrentLanguage()] || block.content.en || '';

  const handleContentChange = (newContent: string) => {
    if (typeof block.content === 'string') {
      onUpdate(block.id, { content: newContent });
    } else {
      const lang = getCurrentLanguage();
      onUpdate(block.id, { 
        content: { ...block.content, [lang]: newContent } 
      });
    }
  };

  return (
    <Card
      className={cn(
        'jd-transition-all jd-duration-300 jd-transform',
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
        <div className="jd-flex jd-items-center jd-justify-between jd-mb-3">
          <div className="jd-flex jd-items-center jd-gap-3">
            <div className="jd-flex jd-items-center jd-gap-2">
              <GripVertical className="jd-h-4 jd-w-4 jd-text-muted-foreground jd-opacity-50 group-hover:jd-opacity-100 jd-transition-opacity" />
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
              {block.isNew ? (
                <Input
                  value={block.name || ''}
                  onChange={(e) => onUpdate(block.id, { name: e.target.value })}
                  placeholder="Block name"
                  className="jd-h-7 jd-text-xs jd-w-32"
                />
              ) : (
                <span className="jd-font-medium jd-text-sm">
                  {block.name || getLocalizedContent(block.title) || 'Block'}
                </span>
              )}
              <Select
                value={block.type || ''}
                onValueChange={(value) => onUpdate(block.id, { type: value as BlockType })}
              >
                <SelectTrigger className="jd-w-32 jd-text-xs jd-h-7">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {BLOCK_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {block.type && (
            <div className="jd-mt-2 jd-w-full">
              <Select
                value={block.isNew ? 'custom' : String(block.id)}
                onValueChange={(value) => {
                  if (value === 'custom') {
                    onUpdate(block.id, { isNew: true });
                  } else {
                    const existing = availableBlocks.find(b => b.id === Number(value));
                    if (existing) {
                      onUpdate(block.id, {
                        id: existing.id,
                        type: existing.type,
                        content: existing.content,
                        title: existing.title,
                        description: existing.description,
                        name: existing.name,
                        isNew: false
                      });
                    }
                  }
                }}
              >
                <SelectTrigger className="jd-w-full jd-text-xs jd-h-7">
                  <SelectValue placeholder="Select existing or custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">
                    <div className="jd-flex jd-items-center jd-gap-2">
                      <Plus className="jd-h-3 jd-w-3" />
                      Custom Content
                    </div>
                  </SelectItem>
                  {availableBlocks.map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {getLocalizedContent(b.title) || b.name || `Block ${b.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}


          <div className="jd-flex jd-items-center jd-gap-1">

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(block.id)}
              className="jd-h-8 jd-w-8 jd-p-1 jd-text-muted-foreground jd-hover:jd-text-destructive"
              title="Delete block"
            >
              <Trash2 className="jd-h-5 jd-w-5" />
            </Button>
          </div>
        </div>

        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="jd-resize-none jd-min-h-[100px] jd-text-sm"
          placeholder={block.type ? `Enter ${block.type} content...` : 'Enter block content...'}
        />
        
        {content && (
          <div className="jd-mt-2 jd-text-xs jd-text-muted-foreground jd-flex jd-justify-between">
            <span>{content.length} characters</span>
            <span>{content.split('\n').length} lines</span>
          </div>
        )}

        {block.isNew && content.trim() && block.type && (
          <div className="jd-flex jd-justify-end jd-mt-3">
            <SaveBlockButton
              type={block.type}
              content={content}
              title={block.name || getLocalizedContent(block.title)}
              description={block.description}
              onSaved={(saved) => onSave && onSave(saved)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};