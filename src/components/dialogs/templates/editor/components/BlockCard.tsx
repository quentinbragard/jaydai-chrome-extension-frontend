import React from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Trash2, FileText, MessageSquare, User, Layout, Type, Users, GripVertical } from 'lucide-react';
import { SaveBlockButton } from './SaveBlockButton';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { BLOCK_TYPES, BLOCK_TYPE_LABELS } from '../../utils/blockUtils';


const BLOCK_ICONS: Record<BlockType, React.ComponentType<any>> = {
  content: FileText,
  context: MessageSquare,
  role: User,
  example: Layout,
  format: Type,
  audience: Users
};


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
  const Icon = block.type ? BLOCK_ICONS[block.type] : FileText;
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
      className="jd-transition-all jd-duration-200 jd-hover:jd-shadow-md jd-group"
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
              <Icon className="jd-h-4 jd-w-4 jd-text-muted-foreground" />
            </div>
            <div className="jd-flex jd-items-center jd-gap-2">
              <span className="jd-font-medium jd-text-sm">
                {block.name || 'Block'}
              </span>
              <Select
                value={block.type || ''}
                onValueChange={(value) => onUpdate(block.id, { type: value as BlockType })}
              >
                <SelectTrigger className="jd-w-32 jd-text-xs jd-h-7">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {BLOCK_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          

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
              title={getLocalizedContent(block.title)}
              description={block.description}
              onSaved={(saved) => onSave && onSave(saved)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};