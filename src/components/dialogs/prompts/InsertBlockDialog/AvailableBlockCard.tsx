// src/components/dialogs/prompts/InsertBlockDialog/AvailableBlockCard.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Block } from '@/types/prompts/blocks';
import { 
  getBlockTypeIcon, 
  getBlockTypeColors, 
  getBlockIconColors, 
  BLOCK_TYPE_LABELS 
} from '@/utils/prompts/blockUtils';
import { Plus, Check, X, Edit2, Trash2, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { getMessage } from '@/core/utils/i18n';

export interface AvailableBlockCardProps {
  block: Block;
  isDark: boolean;
  onAdd: (block: Block) => void;
  onEdit?: (block: Block) => void;
  onDelete?: (block: Block) => void;
  isSelected?: boolean;
  onRemove: (block: Block) => void;
  showActions?: boolean;
}

export function AvailableBlockCard({ 
  block, 
  isDark, 
  onAdd, 
  onEdit, 
  onDelete, 
  isSelected = false, 
  onRemove,
  showActions = true 
}: AvailableBlockCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const Icon = getBlockTypeIcon(block.type || 'custom');
  const cardColors = getBlockTypeColors(block.type || 'custom', isDark);
  const iconBg = getBlockIconColors(block.type, isDark);
  const title = block.title || 'Untitled';
  const content = block.content || '';
  const shouldShowExpander = content.length > 120;

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

  const handleAddRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      onRemove(block);
    } else {
      onAdd(block);
    }
  };

  return (
    <Card 
      className={cn(
        'jd-pt-2 jd-cursor-pointer jd-transition-all jd-duration-200 jd-group jd-relative',
        'jd-border-2 jd-backdrop-blur-sm hover:jd-shadow-lg',
        'jd-transform hover:jd-scale-[1.02] hover:-jd-translate-y-1',
        cardColors,
        isSelected && 'jd-ring-2 jd-ring-primary/50 jd-shadow-md jd-border-primary/30'
      )}
      onClick={() => !isSelected && onAdd(block)}
    >
      <CardContent className="jd-p-4">
        {/* Header with icon, title, and actions */}
        <div className="jd-flex jd-items-start jd-gap-3 jd-mb-3">
          {/* Icon with enhanced styling */}
          <div className={cn(
            'jd-p-2 jd-rounded-lg jd-flex-shrink-0 jd-transition-all jd-duration-300',
            'group-hover:jd-scale-110 group-hover:jd-rotate-3',
            iconBg
          )}>
            <Icon className="jd-h-4 jd-w-4" />
          </div>
          
          {/* Title and Badge */}
          <div className="jd-flex-1 jd-min-w-0">
            <div className="jd-flex jd-items-center jd-gap-2">
              <h3 className="jd-font-semibold jd-text-sm jd-truncate jd-flex-1">{title}</h3>
              <Badge variant="secondary" className="jd-text-xs jd-px-2 jd-py-1 jd-h-auto jd-flex-shrink-0">
                {BLOCK_TYPE_LABELS[block.type || 'custom']}
              </Badge>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="jd-flex jd-items-center jd-gap-1 jd-flex-shrink-0">
            {/* Edit/Delete Dropdown Menu */}
            {showActions && (onEdit || onDelete) && (
              <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      'jd-transition-all jd-duration-200',
                      'jd-text-muted-foreground hover:jd-text-foreground',
                      'jd-opacity-70 group-hover:jd-opacity-100 hover:jd-bg-muted',
                      'jd-border jd-border-transparent hover:jd-border-border'
                    )}
                    title="More actions"
                  >
                    <MoreVertical className="jd-h-4 jd-w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="jd-w-40 jd-z-[10020]">
                  {onEdit && (
                    <DropdownMenuItem onClick={handleEdit} className="jd-text-sm jd-cursor-pointer">
                      <Edit2 className="jd-h-3 jd-w-3 jd-mr-2" />
                      {getMessage('edit', undefined, 'Edit')}
                    </DropdownMenuItem>
                  )}
                  {onEdit && onDelete && <DropdownMenuSeparator />}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={handleDelete} 
                      className="jd-text-sm jd-text-destructive jd-focus:jd-text-destructive jd-cursor-pointer"
                    >
                      <Trash2 className="jd-h-3 jd-w-3 jd-mr-2" />
                      {getMessage('delete', undefined, 'Delete')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Add/Remove Toggle Button */}
            { isSelected &&
            <Button
              variant={isSelected ? "destructive" : "default"}
              size="sm"
              onClick={handleAddRemove}
              className={cn(
                'jd-h-8 jd-px-3 jd-transition-all jd-duration-200 jd-font-medium jd-bg-red-500 hover:jd-bg-red-600 jd-text-white jd-shadow-sm hover:jd-shadow-md'
              )}
              title={isSelected ? 'Remove from selection' : 'Add to selection'}
            >
              <X className="jd-h-3 jd-w-3 jd-mr-1 jd-font-black" />
            </Button>
            }
          </div>
        </div>
        
        {/* Content with expand/collapse */}
        <div className="jd-text-xs jd-text-muted-foreground jd-leading-relaxed">
          <div className={cn(
            'jd-transition-all jd-duration-200',
            isExpanded ? '' : 'jd-line-clamp-2'
          )}>
            {content}
          </div>
          
          {shouldShowExpander && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className={cn(
                'jd-flex jd-items-center jd-gap-1 jd-text-primary jd-hover:jd-underline', 
                'jd-mt-2 jd-text-xs jd-font-medium jd-transition-colors'
              )}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="jd-h-3 jd-w-3" />
                  {getMessage('showLess', undefined, 'Show less')}
                </>
              ) : (
                <>
                  <ChevronDown className="jd-h-3 jd-w-3" />
                  {getMessage('showMore', undefined, 'Show more')}
                </>
              )}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}