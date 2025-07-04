// src/components/prompts/blocks/quick-selector/BlockItem.tsx
import React, { useState } from 'react';
import { Block } from '@/types/prompts/blocks';
import { ChevronRight, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  getBlockTypeIcon,
  getBlockIconColors,
  BLOCK_TYPE_LABELS,
  getLocalizedContent
} from '@/utils/prompts/blockUtils';
import { getMessage } from '@/core/utils/i18n';

interface BlockItemProps {
  block: Block;
  isDark: boolean;
  onSelect: (block: Block) => void;
  onEdit?: (block: Block) => void;
  onDelete?: (block: Block) => void;
  isActive: boolean;
  itemRef?: React.Ref<HTMLDivElement>;
  showActions?: boolean; // Optional prop to show/hide actions
}

export const BlockItem: React.FC<BlockItemProps> = ({
  block,
  isDark,
  onSelect,
  onEdit,
  onDelete,
  isActive,
  itemRef,
  showActions = true
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const Icon = getBlockTypeIcon(block.type);
  const iconBg = getBlockIconColors(block.type, isDark);
  const title = getLocalizedContent(block.title);
  const content = getLocalizedContent(block.content);
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(false);
    if (onEdit) onEdit(block);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(false);
    if (onDelete) onDelete(block);
  };

  const handleSelect = () => {
    onSelect(block);
  };
  
  return (
    <div
      ref={itemRef}
      onClick={handleSelect}
      className={cn(
        'jd-p-3 jd-cursor-pointer jd-transition-all jd-duration-150',
        'jd-hover:jd-bg-muted/80 jd-rounded-md jd-group jd-relative',
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

        <div className="jd-flex jd-items-center jd-gap-1 jd-flex-shrink-0">
          {/* Actions dropdown - only show if actions are enabled and handlers are provided */}
          {showActions && (onEdit || onDelete) && (
            <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="jd-h-6 jd-w-6 jd-p-0 jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="jd-h-3 jd-w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="jd-w-40 jd-z-[10020]">
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit} className="jd-text-sm">
                    <Edit2 className="jd-h-3 jd-w-3 jd-mr-2" />
                    {getMessage('edit', undefined, 'Edit')}
                  </DropdownMenuItem>
                )}
                {onEdit && onDelete && <DropdownMenuSeparator />}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={handleDelete} 
                    className="jd-text-sm jd-text-destructive jd-focus:jd-text-destructive"
                  >
                    <Trash2 className="jd-h-3 jd-w-3 jd-mr-2" />
                    {getMessage('delete', undefined, 'Delete')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Selection arrow */}
          <ChevronRight className="jd-h-3 jd-w-3 jd-text-muted-foreground jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity jd-flex-shrink-0 jd-mt-1" />
        </div>
      </div>
    </div>
  );
};