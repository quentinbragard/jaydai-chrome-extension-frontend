// src/components/common/AddBlockButton.tsx - Enhanced version
import React, { useState } from 'react';
import { Block, BlockType } from '@/types/prompts/blocks';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Plus, Copy, Sparkles } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import {
  getBlockTypeIcon,
  getBlockTypeLabel,
  getBlockTypeDescription,
  getAvailableBlockTypesForAdding,
  getSuggestedBlockTypes,
  getBlockCategory,
  getLocalizedContent
} from '@/components/prompts/blocks/blockUtils';

interface AddBlockButtonProps {
  availableBlocks: Record<BlockType, Block[]>;
  onAdd: (
    blockType?: BlockType | null,
    existingBlock?: Block,
    duplicate?: boolean
  ) => void;
  className?: string;
  existingBlocks?: Block[];
  showSuggestions?: boolean;
}

export const AddBlockButton: React.FC<AddBlockButtonProps> = ({
  availableBlocks,
  onAdd,
  className = '',
  existingBlocks = [],
  showSuggestions = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDarkMode = useThemeDetector();

  const availableBlockTypes = getAvailableBlockTypesForAdding();
  const suggestedTypes = showSuggestions ? getSuggestedBlockTypes(existingBlocks) : [];

  // Group block types by category for better organization
  const groupedBlockTypes = availableBlockTypes.reduce((acc, type) => {
    const category = getBlockCategory(type);
    if (!acc[category]) acc[category] = [];
    acc[category].push(type);
    return acc;
  }, {} as Record<string, BlockType[]>);

  // Handle adding a new empty block of specific type
  const handleAddNewBlock = (blockType: BlockType) => {
    onAdd(blockType);
    setIsOpen(false);
  };

  // Handle adding an existing block
  const handleAddExistingBlock = (block: Block, duplicate: boolean = false) => {
    onAdd(block.type, block, duplicate);
    setIsOpen(false);
  };

  // Render block type option
  const renderBlockTypeOption = (blockType: BlockType, isSuggested: boolean = false) => {
    const Icon = getBlockTypeIcon(blockType);
    const label = getBlockTypeLabel(blockType);
    const description = getBlockTypeDescription(blockType);
    
    return (
      <DropdownMenuItem
        key={blockType}
        onClick={() => handleAddNewBlock(blockType)}
        className={cn(
          'jd-flex jd-items-center jd-gap-3 jd-cursor-pointer jd-p-3',
          isSuggested && 'jd-bg-primary/5 jd-border-l-2 jd-border-primary'
        )}
      >
        <div className={cn(
          'jd-p-1.5 jd-rounded-md',
          isDarkMode ? 'jd-bg-gray-700' : 'jd-bg-gray-100'
        )}>
          <Icon className="jd-h-4 jd-w-4" />
        </div>
        <div className="jd-flex-1">
          <div className="jd-font-medium jd-text-sm">{label}</div>
          <div className="jd-text-xs jd-text-muted-foreground">{description}</div>
        </div>
        {isSuggested && (
          <Sparkles className="jd-h-3 jd-w-3 jd-text-primary" />
        )}
      </DropdownMenuItem>
    );
  };

  // Render existing block option
  const renderExistingBlockOption = (block: Block) => {
    const Icon = getBlockTypeIcon(block.type || 'content');
    const title = getLocalizedContent(block.title) || `${getBlockTypeLabel(block.type || 'content')} Block`;
    const content = getLocalizedContent(block.content) || '';
    const preview = content.length > 60 ? content.substring(0, 60) + '...' : content;
    
    return (
      <div key={block.id} className="jd-border-b jd-border-gray-100 last:jd-border-b-0">
        <DropdownMenuItem
          onClick={() => handleAddExistingBlock(block, false)}
          className="jd-flex jd-items-start jd-gap-3 jd-cursor-pointer jd-p-3 jd-hover:jd-bg-gray-50"
        >
          <div className={cn(
            'jd-p-1.5 jd-rounded-md jd-mt-0.5',
            isDarkMode ? 'jd-bg-gray-700' : 'jd-bg-gray-100'
          )}>
            <Icon className="jd-h-4 jd-w-4" />
          </div>
          <div className="jd-flex-1 jd-min-w-0">
            <div className="jd-font-medium jd-text-sm jd-truncate">{title}</div>
            <div className="jd-text-xs jd-text-muted-foreground jd-mt-1 jd-line-clamp-2">
              {preview}
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAddExistingBlock(block, true)}
          className="jd-flex jd-items-center jd-gap-2 jd-cursor-pointer jd-p-2 jd-pl-12 jd-text-xs jd-text-muted-foreground jd-hover:jd-bg-gray-50"
        >
          <Copy className="jd-h-3 jd-w-3" />
          Duplicate this block
        </DropdownMenuItem>
      </div>
    );
  };

  // Get blocks for each category
  const getBlocksForCategory = (category: string): Block[] => {
    const categoryTypes = groupedBlockTypes[category] || [];
    return categoryTypes.flatMap(type => availableBlocks[type] || []);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'jd-flex jd-items-center jd-gap-2 jd-border-dashed jd-border-2',
            'jd-transition-all jd-duration-300 hover:jd-scale-105 hover:jd-shadow-md',
            'jd-min-w-32',
            isDarkMode 
              ? 'jd-bg-gray-800/50 hover:jd-bg-gray-700/50 jd-border-gray-600' 
              : 'jd-bg-white/70 hover:jd-bg-white/90 jd-border-gray-300',
            className
          )}
        >
          <Plus className="jd-h-4 jd-w-4" />
          Add Block
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="jd-w-80 jd-max-h-96 jd-overflow-y-auto" 
        align="center"
        side="top"
      >
        {/* Suggested blocks section */}
        {suggestedTypes.length > 0 && (
          <>
            <DropdownMenuLabel className="jd-flex jd-items-center jd-gap-2 jd-text-primary">
              <Sparkles className="jd-h-4 jd-w-4" />
              Suggested
            </DropdownMenuLabel>
            {suggestedTypes.slice(0, 3).map(type => renderBlockTypeOption(type, true))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Content blocks */}
        {groupedBlockTypes.content && (
          <>
            <DropdownMenuLabel>Content Blocks</DropdownMenuLabel>
            {groupedBlockTypes.content.map(type => renderBlockTypeOption(type))}
            
            {/* Existing content blocks */}
            {getBlocksForCategory('content').length > 0 && (
              <>
                <DropdownMenuLabel className="jd-text-xs jd-text-muted-foreground jd-mt-2">
                  Existing Content Blocks
                </DropdownMenuLabel>
                {getBlocksForCategory('content').slice(0, 3).map(block => renderExistingBlockOption(block))}
              </>
            )}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Multiple value blocks (constraints, examples) */}
        {groupedBlockTypes.multiple && (
          <>
            <DropdownMenuLabel>Constraints & Examples</DropdownMenuLabel>
            {groupedBlockTypes.multiple.map(type => renderBlockTypeOption(type))}
            
            {/* Existing multiple blocks */}
            {getBlocksForCategory('multiple').length > 0 && (
              <>
                <DropdownMenuLabel className="jd-text-xs jd-text-muted-foreground jd-mt-2">
                  Existing Blocks
                </DropdownMenuLabel>
                {getBlocksForCategory('multiple').slice(0, 3).map(block => renderExistingBlockOption(block))}
              </>
            )}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Custom blocks */}
        {groupedBlockTypes.custom && (
          <>
            <DropdownMenuLabel>Custom Blocks</DropdownMenuLabel>
            {groupedBlockTypes.custom.map(type => renderBlockTypeOption(type))}
            
            {/* Existing custom blocks */}
            {getBlocksForCategory('custom').length > 0 && (
              <>
                <DropdownMenuLabel className="jd-text-xs jd-text-muted-foreground jd-mt-2">
                  Your Custom Blocks
                </DropdownMenuLabel>
                {getBlocksForCategory('custom').slice(0, 5).map(block => renderExistingBlockOption(block))}
              </>
            )}
          </>
        )}

        {/* Empty state */}
        {availableBlockTypes.length === 0 && (
          <div className="jd-p-4 jd-text-center jd-text-muted-foreground">
            <div className="jd-text-sm">No additional block types available</div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};