import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Block } from '@/types/prompts/blocks';
import { getBlockTypeIcon, getBlockTypeColors, getBlockIconColors, BLOCK_TYPE_LABELS } from '@/components/prompts/blocks/blockUtils';
import { Plus } from 'lucide-react';
import { cn } from '@/core/utils/classNames';

export interface AvailableBlockCardProps {
  block: Block;
  isDark: boolean;
  onAdd: (block: Block) => void;
}

export function AvailableBlockCard({ block, isDark, onAdd }: AvailableBlockCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = getBlockTypeIcon(block.type);
  const cardColors = getBlockTypeColors(block.type, isDark);
  const iconBg = getBlockIconColors(block.type, isDark);
  const title = typeof block.title === 'string' ? block.title : block.title?.en || 'Untitled';
  const content = typeof block.content === 'string' ? block.content : block.content.en || '';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] group',
        cardColors
      )}
      onClick={() => onAdd(block)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className={`p-2 rounded-lg ${iconBg} flex-shrink-0`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm truncate">{title}</h3>
              <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </div>
            <Badge variant="outline" className="mb-2 text-xs">
              {BLOCK_TYPE_LABELS[block.type || 'content']}
            </Badge>
            <div className="text-xs text-muted-foreground">
              <div className={cn('transition-all duration-200', isExpanded ? '' : 'line-clamp-3')}>
                {content}
              </div>
              {content.length > 150 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="text-primary hover:underline mt-1"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
