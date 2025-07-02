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
import { Plus, ChevronDown, ChevronRight, Check, X, Edit2, Trash2, MoreVertical } from 'lucide-react';
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

  return (
    <Card 
      className={cn(
        'jd-cursor-pointer jd-transition-all jd-duration-200 jd-group jd-relative',
        'jd-border-2 jd-backdrop-blur-sm hover:jd-shadow-lg',
        'jd-transform hover:jd-scale-[1.02] hover:-jd-translate-y-1 jd-pt-4',
        cardColors,
        isSelected && 'jd-ring-2 jd-ring-primary/50 jd-shadow-md'
      )}
      onClick={() => !isSelected && onAdd(block)}
    >
      <CardContent className="jd-p-4">
        <div className="jd-flex jd-items-start jd-gap-3">
          {/* Icon with enhanced styling */}
          <div className={cn(
            'jd-p-2 jd-rounded-lg jd-flex-shrink-0 jd-transition-all jd-duration-300',
            'group-hover:jd-scale-110 group-hover:jd-rotate-3',
            iconBg
          )}>
            <Icon className="jd-h-4 jd-w-4" />
          </div>
          
          {/* Content */}
          <div className="jd-flex-1 jd-min-w-0">
            <div className="jd-flex jd-items-center jd-gap-2 jd-mb-2">
              <h3 className="jd-font-semibold jd-text-sm jd-truncate jd-flex-1">{title}</h3>
              <Badge variant="secondary" className="jd-text-xs jd-px-2 jd-py-1 jd-h-auto jd-flex-shrink-0">
                {BLOCK_TYPE_LABELS[block.type || 'custom']}
              </Badge>
            </div>
            
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
                  className="jd-text-primary jd-hover:jd-underline jd-mt-1 jd-text-xs jd-font-medium"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="jd-flex jd-items-center jd-gap-1 jd-ml-2 jd-flex-shrink-0">
            {/* Edit/Delete dropdown */}
            {showActions && (onEdit || onDelete) && (
              <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="jd-h-8 jd-w-8 jd-p-0 jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity jd-text-muted-foreground hover:jd-text-foreground"
                  >
                    <MoreVertical className="jd-h-4 jd-w-4" />
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

            {/* Add/Remove button */}
            {isSelected ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(block);
                }}
                className="jd-h-8 jd-w-8 jd-p-0 jd-text-red-500 hover:jd-text-red-600 hover:jd-bg-red-50"
              >
                <X className="jd-h-4 jd-w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(block);
                }}
                className={cn(
                  'jd-h-8 jd-w-8 jd-p-0 jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-all jd-duration-200',
                  'jd-text-primary hover:jd-text-primary-foreground hover:jd-bg-primary'
                )}
              >
                <Plus className="jd-h-4 jd-w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="jd-absolute jd-top-2 jd-right-2 jd-bg-primary jd-text-primary-foreground jd-rounded-full jd-w-5 jd-h-5 jd-flex jd-items-center jd-justify-center">
            <Check className="jd-h-3 jd-w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}