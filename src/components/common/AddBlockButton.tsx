// src/components/common/AddBlockButton.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Plus, Sparkles } from 'lucide-react';
import { BlockType, Block } from '@/types/prompts/blocks';
import { 
  BLOCK_TYPE_LABELS, 
  getBlockTypeIcon, 
  getBlockIconColors,
  BLOCK_TYPES 
} from '@/utils/prompts/blockUtils';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';
import { cn } from '@/core/utils/classNames';
import { getMessage } from '@/core/utils/i18n';

interface AddBlockButtonProps {
  availableBlocks: Record<BlockType, Block[]>;
  onAdd: (
    blockType: BlockType | null, 
    existingBlock?: Block, 
    duplicate?: boolean
  ) => void;
  className?: string;
}

export const AddBlockButton: React.FC<AddBlockButtonProps> = ({ 
  availableBlocks, 
  onAdd, 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDark = useThemeDetector();
  const { openInsertBlock } = useDialogActions();

  const handleAddNewBlock = (blockType: BlockType) => {
    onAdd(blockType);
    setIsOpen(false);
  };

  const handleAddExistingBlock = (block: Block, duplicate = false) => {
    onAdd(block.type, block, duplicate);
    setIsOpen(false);
  };

  // Filter out metadata block types that shouldn't be directly addable
  const addableBlockTypes = BLOCK_TYPES.filter(type => 
    !['role', 'context', 'goal', 'audience', 'tone_style', 'output_format'].includes(type)
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'jd-flex jd-items-center jd-gap-2 jd-transition-all jd-duration-300',
            'hover:jd-scale-105 hover:jd-shadow-md',
            'jd-border-dashed jd-border-2',
            isDark 
              ? 'jd-bg-gray-800/50 hover:jd-bg-gray-700/50 jd-border-gray-600' 
              : 'jd-bg-white/70 hover:jd-bg-white/90 jd-border-gray-300',
            className
          )}
        >
          <Plus className="jd-h-4 jd-w-4" />
          {getMessage('addBlock', undefined, 'Add Block')}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="jd-w-80 jd-max-h-96 jd-overflow-y-auto" 
        align="center"
        side="top"
      >
        <DropdownMenuLabel className="jd-flex jd-items-center jd-gap-2">
          <Sparkles className="jd-h-4 jd-w-4" />
          {getMessage('addBlock', undefined, 'Add Block')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Create New Blocks Section */}
        <DropdownMenuLabel className="jd-text-xs jd-text-muted-foreground">
          {getMessage('createNewBlock', undefined, 'Create New Block')}
        </DropdownMenuLabel>
        {addableBlockTypes.map(blockType => {
          const Icon = getBlockTypeIcon(blockType);
          const iconBg = getBlockIconColors(blockType, isDark);
          
          return (
            <DropdownMenuItem
              key={blockType}
              onClick={() => handleAddNewBlock(blockType)}
              className="jd-flex jd-items-center jd-gap-3 jd-py-2 jd-cursor-pointer"
            >
              <div className={cn('jd-p-1.5 jd-rounded-md', iconBg)}>
                <Icon className="jd-h-3 jd-w-3" />
              </div>
              <div className="jd-flex jd-flex-col">
                <span className="jd-text-sm jd-font-medium">
                  {BLOCK_TYPE_LABELS[blockType]}
                </span>
                <span className="jd-text-xs jd-text-muted-foreground">
                  {getMessage(
                    'createNewSpecificBlock',
                    [blockType],
                    `Create new ${blockType} block`
                  )}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
        
        {/* Existing Blocks Section */}
        {Object.entries(availableBlocks).some(([_type, blocks]) => blocks.length > 0) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="jd-text-xs jd-text-muted-foreground">
              {getMessage('addExistingBlock', undefined, 'Add Existing Block')}
            </DropdownMenuLabel>
            
            {Object.entries(availableBlocks).map(([blockType, blocks]) => {
              if (blocks.length === 0) return null;
              
              const Icon = getBlockTypeIcon(blockType as BlockType);
              const iconBg = getBlockIconColors(blockType as BlockType, isDark);
              
              return blocks.slice(0, 3).map(block => { // Limit to 3 blocks per type to prevent overflow
                const title = typeof block.title === 'string' 
                  ? block.title 
                  : block.title?.en || 'Untitled';
                const content = typeof block.content === 'string' 
                  ? block.content 
                  : block.content?.en || '';
                
                return (
                  <DropdownMenuItem
                    key={block.id}
                    onClick={() => handleAddExistingBlock(block)}
                    className="jd-flex jd-items-start jd-gap-3 jd-py-2 jd-cursor-pointer"
                  >
                    <div className={cn('jd-p-1.5 jd-rounded-md jd-flex-shrink-0', iconBg)}>
                      <Icon className="jd-h-3 jd-w-3" />
                    </div>
                    <div className="jd-flex jd-flex-col jd-min-w-0 jd-flex-1">
                      <span className="jd-text-sm jd-font-medium jd-truncate">
                        {title}
                      </span>
                      <span className="jd-text-xs jd-text-muted-foreground jd-line-clamp-2 jd-leading-tight">
                        {content.substring(0, 80)}{content.length > 80 ? '...' : ''}
                      </span>
                    </div>
                  </DropdownMenuItem>
                );
              });
            })}
            
            {/* Show "View More" option if there are many blocks */}
            {Object.values(availableBlocks).some(blocks => blocks.length > 3) && (
              <DropdownMenuItem
                onClick={() => {
                  openInsertBlock();
                  setIsOpen(false);
                }}
                className="jd-flex jd-items-center jd-gap-2 jd-py-2 jd-cursor-pointer jd-text-primary"
              >
                <Plus className="jd-h-4 jd-w-4" />
                <span className="jd-text-sm">
                  {getMessage('browseAllBlocks', undefined, 'Browse all blocks...')}
                </span>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Additional utility component for inline block creation in dialogs
export const InlineBlockForm: React.FC<{
  onSave: (blockData: { type: BlockType; title: string; content: string }) => void;
  onCancel: () => void;
  initialType?: BlockType;
}> = ({ onSave, onCancel, initialType = 'custom' }) => {
  const [type, setType] = useState<BlockType>(initialType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const isDark = useThemeDetector();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSave({
        type,
        title:
          title.trim() ||
          getMessage(
            'blockTitlePlaceholder',
            [BLOCK_TYPE_LABELS[type]],
            `${BLOCK_TYPE_LABELS[type]} Block`
          ),
        content: content.trim()
      });
    }
  };

  const Icon = getBlockTypeIcon(type);
  const iconBg = getBlockIconColors(type, isDark);

  return (
    <form onSubmit={handleSubmit} className="jd-space-y-3 jd-p-4 jd-border jd-rounded-lg jd-bg-muted/20">
      <div className="jd-flex jd-items-center jd-gap-2 jd-mb-3">
        <div className={cn('jd-p-1.5 jd-rounded-md', iconBg)}>
          <Icon className="jd-h-4 jd-w-4" />
        </div>
        <h3 className="jd-font-medium jd-text-sm">
          {getMessage('createNewBlock', undefined, 'Create New Block')}
        </h3>
      </div>

      <div className="jd-grid jd-grid-cols-2 jd-gap-3">
        <div>
          <label className="jd-text-xs jd-font-medium jd-mb-1 jd-block">
            {getMessage('blockTypeLabel', undefined, 'Type')}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as BlockType)}
            className="jd-w-full jd-h-8 jd-px-2 jd-text-xs jd-border jd-rounded"
          >
            {BLOCK_TYPES.filter(t => !['role', 'context', 'goal'].includes(t)).map(blockType => (
              <option key={blockType} value={blockType}>
                {BLOCK_TYPE_LABELS[blockType]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="jd-text-xs jd-font-medium jd-mb-1 jd-block">
            {getMessage('blockTitleLabel', undefined, 'Title')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={getMessage(
              'blockTitlePlaceholder',
              [BLOCK_TYPE_LABELS[type]],
              `${BLOCK_TYPE_LABELS[type]} Block`
            )}
            className="jd-w-full jd-h-8 jd-px-2 jd-text-xs jd-border jd-rounded"
          />
        </div>
      </div>

      <div>
        <label className="jd-text-xs jd-font-medium jd-mb-1 jd-block">
          {getMessage('content', undefined, 'Content')}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={getMessage(
            'blockContentPlaceholder',
            [type],
            `Enter ${type} content...`
          )}
          className="jd-w-full jd-h-20 jd-p-2 jd-text-xs jd-border jd-rounded jd-resize-none"
          required
        />
      </div>

      <div className="jd-flex jd-gap-2 jd-pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="jd-flex-1 jd-h-8 jd-text-xs"
        >
          {getMessage('cancel', undefined, 'Cancel')}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim()}
          className="jd-flex-1 jd-h-8 jd-text-xs"
        >
          {getMessage('createBlock', undefined, 'Create Block')}
        </Button>
      </div>
    </form>
  );
};