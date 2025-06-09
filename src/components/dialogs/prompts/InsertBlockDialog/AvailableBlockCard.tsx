// Enhanced AvailableBlockCard with consistent styling
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Block } from '@/types/prompts/blocks';
import { 
  getBlockTypeIcon, 
  getBlockTypeColors, 
  getBlockIconColors, 
  BLOCK_TYPE_LABELS 
} from '@/components/prompts/blocks/blockUtils';
import { Plus, ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { cn } from '@/core/utils/classNames';

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
  const cardColors = getBlockTypeColors(block.type || 'custom', isDark);
  const iconBg = getBlockIconColors(block.type, isDark);
  const title = typeof block.title === 'string' ? block.title : block.title?.en || 'Untitled';
  const content = typeof block.content === 'string' ? block.content : block.content.en || '';
  
  const shouldShowExpander = content.length > 120;

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