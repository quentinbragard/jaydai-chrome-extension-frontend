import React from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Trash2, FileText, MessageSquare, User, Layout, Type, Users } from 'lucide-react';
import { getCurrentLanguage } from '@/core/utils/i18n';

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
  index: number;
  total: number;
  onMove: (id: number, dir: 'up' | 'down') => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, updated: Partial<Block>) => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({ block, index, total, onMove, onRemove, onUpdate }) => {
  const Icon = BLOCK_ICONS[block.type];
  const content = typeof block.content === 'string' ? block.content : block.content[getCurrentLanguage()] || block.content.en || '';

  return (
    <Card className="jd-transition-all jd-duration-200 jd-hover:jd-shadow-md">
      <CardContent className="jd-p-4">
        <div className="jd-flex jd-items-center jd-justify-between jd-mb-2">
          <div className="jd-flex jd-items-center jd-gap-2">
            <Icon className="jd-h-4 jd-w-4 jd-text-muted-foreground" />
            <span className="jd-font-medium">{block.name || `${block.type} Block`}</span>
            <Badge variant="outline" className="jd-text-xs">
              {block.type}
            </Badge>
          </div>
          <div className="jd-flex jd-items-center jd-gap-1">
            <Button size="sm" variant="ghost" onClick={() => onMove(block.id, 'up')} disabled={index === 0} className="jd-h-6 jd-w-6 jd-p-0">
              <ArrowUp className="jd-h-3 jd-w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onMove(block.id, 'down')} disabled={index === total - 1} className="jd-h-6 jd-w-6 jd-p-0">
              <ArrowDown className="jd-h-3 jd-w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onRemove(block.id)} className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground jd-hover:jd-text-destructive">
              <Trash2 className="jd-h-3 jd-w-3" />
            </Button>
          </div>
        </div>

        <Textarea
          value={content}
          onChange={(e) => onUpdate(block.id, { content: e.target.value })}
          className="jd-resize-none jd-min-h-[80px]"
          placeholder={`Enter ${block.type} content...`}
        />
      </CardContent>
    </Card>
  );
};
