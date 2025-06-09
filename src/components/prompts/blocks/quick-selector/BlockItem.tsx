// src/components/prompts/quick-selector/BlockItem.tsx
import React from 'react';
import { Block } from '@/types/prompts/blocks';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import {
  getBlockTypeIcon,
  getBlockIconColors,
  BLOCK_TYPE_LABELS,
  getLocalizedContent
} from '@/components/prompts/blocks/blockUtils';

interface BlockItemProps {
  block: Block;
  isDark: boolean;
  onSelect: (block: Block) => void;
  isActive: boolean;
}

export const BlockItem: React.FC<BlockItemProps> = ({ 
  block, 
  isDark, 
  onSelect, 
  isActive 
}) => {
  const Icon = getBlockTypeIcon(block.type);
  const iconBg = getBlockIconColors(block.type, isDark);
  const title = getLocalizedContent(block.title);
  const content = getLocalizedContent(block.content);
  
  return (
    <div
      onClick={() => onSelect(block)}
      className={cn(
        'jd-p-3 jd-cursor-pointer jd-transition-all jd-duration-150',
        'jd-hover:jd-bg-muted/80 jd-rounded-md jd-group',
        isActive && 'jd-bg-muted'
      )}
    >
      <div className="jd-flex jd-items-start jd-gap-2">
        <div className={cn(
          'jd-p-1.5 jd-rounded-md jd-flex-shrink-0 jd-transition-transform',
          'jd-group-hover:jd-scale-110',
          iconBg
        )}>
          <Icon className="jd-h-3 jd-w-3" />
        </div>
        <div className="jd-flex-1 jd-min-w-0">
          <div className="jd-flex jd-items-center jd-gap-2">
            <h4 className="jd-text-sm jd-font-medium jd-truncate">{title}</h4>
            <span className="jd-text-[10px] jd-px-1.5 jd-py-0.5 jd-bg-muted jd-rounded jd-text-muted-foreground">
              {BLOCK_TYPE_LABELS[block.type || 'custom']}
            </span>
          </div>
          <p className="jd-text-xs jd-text-muted-foreground jd-line-clamp-1 jd-mt-0.5">
            {content}
          </p>
        </div>
        <ChevronRight className="jd-h-3 jd-w-3 jd-text-muted-foreground jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity jd-flex-shrink-0 jd-mt-1" />
      </div>
    </div>
  );
};