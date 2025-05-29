import React from 'react';
import { Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  BLOCK_TYPES,
  getBlockTypeIcon,
  getBlockTypeLabel,
  getLocalizedContent,
  isMetadataBlock
} from '@/components/prompts/blocks/blockUtils';
import { Block, BlockType } from '@/types/prompts/blocks';
import { cn } from '@/core/utils/classNames';

interface AddBlockButtonProps {
  availableBlocks: Record<BlockType, Block[]>;
  onAdd: (type: BlockType, existing?: Block, duplicate?: boolean) => void;
  className?: string;
}

export const AddBlockButton: React.FC<AddBlockButtonProps> = ({
  availableBlocks,
  onAdd,
  className
}) => {
  const types = BLOCK_TYPES.filter(t => !isMetadataBlock(t));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'jd-flex jd-items-center jd-gap-1 jd-text-sm jd-bg-background jd-border jd-border-input jd-rounded-md jd-px-2 jd-py-1 hover:jd-bg-accent hover:jd-text-accent-foreground',
            className
          )}
        >
          <Plus className="jd-h-4 jd-w-4" /> Add Block
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="jd-max-h-80 jd-overflow-y-auto">
        {types.map(type => {
          const Icon = getBlockTypeIcon(type);
          const blocks = availableBlocks[type] || [];
          return (
            <DropdownMenuSub key={type}>
              <DropdownMenuSubTrigger className="jd-flex jd-items-center jd-gap-2">
                <Icon className="jd-h-4 jd-w-4" />
                {getBlockTypeLabel(type)}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="jd-max-h-72 jd-overflow-y-auto">
                {blocks.length > 0 && (
                  <>
                    <DropdownMenuLabel>Use Existing</DropdownMenuLabel>
                    {blocks.map(b => (
                      <DropdownMenuItem
                        key={b.id}
                        onSelect={() => onAdd(type, b, false)}
                      >
                        {getLocalizedContent(b.title) || 'Block'}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>New from Existing</DropdownMenuLabel>
                    {blocks.map(b => (
                      <DropdownMenuItem
                        key={`copy-${b.id}`}
                        onSelect={() => onAdd(type, b, true)}
                      >
                        {getLocalizedContent(b.title) || 'Block'}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onSelect={() => onAdd(type, undefined, true)}>
                  New {getBlockTypeLabel(type)}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
