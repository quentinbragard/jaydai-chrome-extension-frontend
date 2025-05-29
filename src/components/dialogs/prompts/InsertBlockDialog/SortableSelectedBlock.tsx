import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Block } from '@/types/prompts/blocks';
import { getBlockTypeIcon, getBlockIconColors, BLOCK_TYPE_LABELS } from '@/components/prompts/blocks/blockUtils';
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
  const title = typeof block.title === 'string' ? block.title : block.title?.en || 'Untitled';
  const content = typeof block.content === 'string' ? block.content : block.content.en || '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative border rounded-lg p-3 bg-background transition-all duration-200',
        isDragging ? 'shadow-lg ring-2 ring-primary/20' : 'hover:shadow-md'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <button
        onClick={() => onRemove(block.id)}
        className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
      >
        <X className="h-3 w-3 text-destructive" />
      </button>
      <div className="flex items-start gap-3 ml-6 mr-6">
        <span className={`p-1.5 rounded-md ${iconBg} flex-shrink-0`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">{title}</h4>
            <Badge variant="secondary" className="text-xs">
              {BLOCK_TYPE_LABELS[block.type || 'content']}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            <div className={cn('transition-all duration-200', isExpanded ? '' : 'line-clamp-2')}>
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
