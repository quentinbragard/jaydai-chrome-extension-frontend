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
        'jd-cursor-pointer jd-transition-all jd-duration-200 hover:jd-shadow-md hover:jd-scale-[1.02] jd-group',
        cardColors
      )}
      onClick={() => onAdd(block)}
    >
      <CardContent className="jd-p-4">
        <div className="jd-flex jd-items-start jd-gap-3">
          <span className={`jd-p-2 jd-rounded-lg ${iconBg} jd-flex-shrink-0`}>
            <Icon className="jd-h-5 jd-w-5" />
          </span>
          <div className="jd-flex-1 jd-min-w-0">
            <div className="jd-flex jd-items-center jd-justify-between jd-mb-2">
              <h3 className="jd-font-medium jd-text-sm jd-truncate">{title}</h3>
              <Plus className="jd-h-4 jd-w-4 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity jd-text-primary" />
            </div>
            <Badge variant="outline" className="jd-mb-2 jd-text-xs">
              {BLOCK_TYPE_LABELS[block.type || 'content']}
            </Badge>
            <div className="jd-text-xs jd-text-muted-foreground">
              <div className={cn('jd-transition-all jd-duration-200', isExpanded ? '' : 'jd-line-clamp-3')}>
                {content}
              </div>
              {content.length > 150 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="jd-text-primary hover:jd-underline jd-mt-1"
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
