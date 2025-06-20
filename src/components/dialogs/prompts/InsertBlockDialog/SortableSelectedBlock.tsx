import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Block } from '@/types/prompts/blocks';
import { getBlockTypeIcon, getBlockIconColors, BLOCK_TYPE_LABELS } from '@/utils/prompts/blockUtils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/core/utils/classNames';

export interface SortableSelectedBlockProps {
  block: Block;
  isDark: boolean;
  onRemove: (id: number) => void;
  isExpanded: boolean;
  onToggleExpand: (id: number) => void;
}

export function SortableSelectedBlock({ block, isDark, onRemove, isExpanded, onToggleExpand }: SortableSelectedBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = getBlockTypeIcon(block.type);
  const iconBg = getBlockIconColors(block.type, isDark);
  const title = block.title || 'Untitled';
  const content = block.content || '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative jd-border jd-rounded-lg jd-p-3 jd-bg-background jd-transition-all jd-duration-200',
        isDragging ? 'jd-shadow-lg jd-ring-2 jd-ring-primary/20' : 'jd-hover:jd-shadow-md'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="jd-absolute jd-left-1 jd-top-1/2 jd-translate-y-1/2 jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity jd-cursor-grab jd-active:jd-cursor-grabbing"
      >
        <GripVertical className="jd-h-4 jd-w-4 jd-text-muted-foreground" />
      </div>
      <button
        onClick={() => onRemove(block.id)}
        className="jd-absolute jd-right-1 jd-top-1 jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity jd-p-1 jd-hover:jd-bg-destructive/10 jd-rounded"
      >
        <X className="jd-h-3 jd-w-3 jd-text-destructive" />
      </button>
      <div className="jd-flex jd-items-start jd-gap-3 jd-ml-6 jd-mr-6">
        <span className={`jd-p-1.5 jd-rounded-md ${iconBg} jd-flex-shrink-0`}>
          <Icon className="jd-h-4 jd-w-4" />
        </span>
        <div className="jd-flex-1 jd-min-w-0">
          <div className="jd-flex jd-items-center jd-gap-2 jd-mb-1">
            <h4 className="jd-text-sm jd-font-medium jd-truncate">{title}</h4>
            <Badge variant="secondary" className="jd-text-xs">
              {BLOCK_TYPE_LABELS[block.type || 'custom']}
            </Badge>
          </div>
          <div className="jd-text-xs jd-text-muted-foreground">
            <div className={cn('jd-transition-all jd-duration-200', isExpanded ? '' : 'jd-line-clamp-2')}>
              {content}
            </div>
            {content.length > 100 && (
              <button onClick={() => onToggleExpand(block.id)} className="text-primary hover:underline mt-1">
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
