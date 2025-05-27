import React from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, MessageSquare, User, Layout, Type, Users, GripVertical } from 'lucide-react';
import { SaveBlockButton } from './SaveBlockButton';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { cn } from '@/core/utils/classNames';

const BLOCK_ICONS: Record<BlockType, React.ComponentType<any>> = {
  content: FileText,
  context: MessageSquare,
  role: User,
  example: Layout,
  format: Type,
  audience: Users
};

const BLOCK_COLORS: Record<BlockType, string> = {
  content: 'jd-bg-blue-50 jd-border-blue-200 jd-text-blue-900',
  context: 'jd-bg-green-50 jd-border-green-200 jd-text-green-900',
  role: 'jd-bg-purple-50 jd-border-purple-200 jd-text-purple-900',
  example: 'jd-bg-orange-50 jd-border-orange-200 jd-text-orange-900',
  format: 'jd-bg-pink-50 jd-border-pink-200 jd-text-pink-900',
  audience: 'jd-bg-teal-50 jd-border-teal-200 jd-text-teal-900'
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
  const Icon = BLOCK_ICONS[block.type];
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
                {block.name || `${block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block`}
              </span>
              <Badge 
                variant="default" 
                className={cn(
                  'jd-text-xs jd-border',
                  BLOCK_COLORS[block.type]
                )}
              >
                {block.type}
              </Badge>
            </div>
          </div>
          
          <div className="jd-flex jd-items-center jd-gap-1 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity">
            {block.isNew && content.trim() && (
              <SaveBlockButton
                type={block.type}
                content={content}
                title={block.name}
                description={block.description}
                onSaved={(saved) => onSave && onSave(saved)}
                className="jd-h-8 jd-w-8 jd-p-1"
              />
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(block.id)}
              className="jd-h-8 jd-w-8 jd-p-1 jd-text-muted-foreground jd-hover:jd-text-destructive"
              title="Delete block"
            >
              <Trash2 className="jd-h-4 jd-w-4" />
            </Button>
          </div>
        </div>

        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="jd-resize-none jd-min-h-[100px] jd-text-sm"
          placeholder={`Enter ${block.type} content...`}
        />
        
        {content && (
          <div className="jd-mt-2 jd-text-xs jd-text-muted-foreground jd-flex jd-justify-between">
            <span>{content.length} characters</span>
            <span>{content.split('\n').length} lines</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};