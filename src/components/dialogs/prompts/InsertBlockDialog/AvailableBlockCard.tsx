import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Block } from '@/types/prompts/blocks';
import { 
  getBlockTypeIcon, 
  getBlockTypeColors, 
  getBlockIconColors, 
  BLOCK_TYPE_LABELS 
} from '@/components/prompts/blocks/blockUtils';
import { Plus, ChevronDown, ChevronRight, Trash } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { Button } from '@/components/ui/button';

export interface AvailableBlockCardProps {
  block: Block;
  isDark: boolean;
  onAdd: (block: Block) => void;
  isSelected?: boolean;
  onRemove: (block: Block) => void;
}

export function AvailableBlockCard({ block, isDark, onAdd, isSelected = false, onRemove }: AvailableBlockCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = getBlockTypeIcon(block.type);
  const iconBg = getBlockIconColors(block.type, isDark);
  const title = typeof block.title === 'string' ? block.title : block.title?.en || 'Untitled';
  const content = typeof block.content === 'string' ? block.content : block.content.en || '';
  
  const shouldShowExpander = content.length > 80;

  return (
    <Card 
      className={cn(
        'jd-cursor-pointer jd-transition-all jd-duration-200 hover:jd-shadow-sm hover:jd-border-primary/50 jd-group jd-relative',
        'jd-border-l-2 hover:jd-border-l-primary/60',
        isSelected && 'jd-border-primary/50 jd-bg-primary/5 jd-shadow-sm'
      )}
      onClick={() => onAdd(block)}
    >
      {isSelected && (
       <div className="jd-absolute jd--top-1 jd--right-1 jd-bg-primary jd-text-primary-foreground jd-rounded-full jd-w-5 jd-h-5 jd-flex jd-items-center jd-justify-center jd-text-xs jd-font-bold">
       <Button variant="outline" size="icon" onClick={() => onRemove(block)}><Trash className="jd-h-3.5 jd-w-3.5 jd-text-red-500" /></Button>
     </div>
      )}
      
      <CardContent className="jd-p-3">
        <div className="jd-flex jd-items-center jd-gap-2">
          {/* Icon */}
          <span className={`jd-p-1.5 jd-rounded-md ${iconBg} jd-flex-shrink-0`}>
            <Icon className="jd-h-3.5 jd-w-3.5" />
          </span>
          
          {/* Content */}
          <div className="jd-flex-1 jd-min-w-0">
            <div className="jd-flex jd-items-center jd-gap-2 jd-mb-1">
              <h3 className="jd-font-medium jd-text-xs jd-truncate jd-flex-1">{title}</h3>
              <Badge variant="secondary" className="jd-text-[10px] jd-px-1.5 jd-py-0.5 jd-h-auto">
                {BLOCK_TYPE_LABELS[block.type || 'content']}
              </Badge>
            </div>
            
            <div className="jd-text-[11px] jd-text-muted-foreground">
              <div className={cn(
                'jd-transition-all jd-duration-200',
                isExpanded ? '' : 'jd-line-clamp-1'
              )}>
                {content}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="jd-flex jd-items-center jd-gap-1 jd-ml-2">
            {shouldShowExpander && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="jd-p-1 hover:jd-bg-muted jd-rounded jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity"
              >
                {isExpanded ? 
                  <ChevronDown className="jd-h-3 jd-w-3" /> : 
                  <ChevronRight className="jd-h-3 jd-w-3" />
                }
              </button>
            )}
            
            {!isSelected && (
              <Plus className="jd-h-3.5 jd-w-3.5 jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity jd-text-red-500" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
