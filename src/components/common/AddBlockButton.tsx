import React from 'react';
import { Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { cn } from '@/core/utils/classNames';
import { Block } from '@/types/prompts/blocks';

interface AddBlockButtonProps {
  blocks: Block[];
  onAdd: (block: Block) => void;
  className?: string;
}

/**
 * Button used to insert a block into a template.
 */
export const AddBlockButton: React.FC<AddBlockButtonProps> = ({
  blocks,
  onAdd,
  className
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'jd-bg-background jd-border jd-border-input jd-rounded-full jd-shadow jd-w-6 jd-h-6 jd-flex jd-items-center jd-justify-center jd-text-muted-foreground hover:jd-bg-accent hover:jd-text-accent-foreground',
            className
          )}
        >
          <Plus className="jd-h-4 jd-w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {blocks.map((block) => (
          <DropdownMenuItem key={block.id} onSelect={() => onAdd(block)}>
            {block.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
