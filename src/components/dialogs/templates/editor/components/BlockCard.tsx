import React from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Trash2, FileText, MessageSquare, User, Layout, Type, Users, GripVertical } from 'lucide-react';
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
  index: number;
  total: number;
  onMove: (id: number, dir: 'up' | 'down') => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, updated: Partial<Block>) => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({ 
  block, 
  index, 
  total, 
  onMove, 
  onRemove, 
  onUpdate 
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
    <Card className="jd-transition-all jd-duration-200 jd-hover:jd-shadow-md jd-group">
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
                variant="outline" 
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
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onMove(block.id, 'up')} 
              disabled={index === 0} 
              className="jd-h-7 jd-w-7 jd-p-0"
              title="Move up"
            >
              <ArrowUp className="jd-h-3 jd-w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onMove(block.id, 'down')} 
              disabled={index === total - 1} 
              className="jd-h-7 jd-w-7 jd-p-0"
              title="Move down"
            >
              <ArrowDown className="jd-h-3 jd-w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onRemove(block.id)} 
              className="jd-h-7 jd-w-7 jd-p-0 jd-text-muted-foreground jd-hover:jd-text-destructive"
              title="Delete block"
            >
              <Trash2 className="jd-h-3 jd-w-3" />
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