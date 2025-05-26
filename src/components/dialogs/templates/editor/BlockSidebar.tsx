// src/components/dialogs/templates/editor/BlockSidebar.tsx
import React from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MoreVertical, 
  ArrowUp, 
  ArrowDown, 
  Trash2,
  FileText,
  User,
  MessageSquare,
  Layout,
  Users,
  Type
} from 'lucide-react';
import { cn } from '@/core/utils/classNames';

interface BlockSidebarProps {
  blocks: Block[];
  selectedBlockId: number | null;
  onBlockSelect: (blockId: number) => void;
  onAddBlock: (position: 'start' | 'end', blockType: BlockType, existingBlock?: Block) => void;
  onRemoveBlock: (blockId: number) => void;
  onMoveBlock: (blockId: number, direction: 'up' | 'down') => void;
}

// Block type configurations
const BLOCK_CONFIGS = {
  content: { icon: FileText, label: 'Content', color: 'bg-blue-100 text-blue-800' },
  context: { icon: MessageSquare, label: 'Context', color: 'bg-green-100 text-green-800' },
  role: { icon: User, label: 'Role', color: 'bg-purple-100 text-purple-800' },
  example: { icon: Layout, label: 'Example', color: 'bg-orange-100 text-orange-800' },
  format: { icon: Type, label: 'Format', color: 'bg-pink-100 text-pink-800' },
  audience: { icon: Users, label: 'Audience', color: 'bg-teal-100 text-teal-800' }
};

export const BlockSidebar: React.FC<BlockSidebarProps> = ({
  blocks,
  selectedBlockId,
  onBlockSelect,
  onAddBlock,
  onRemoveBlock,
  onMoveBlock
}) => {
  const getBlockIcon = (type: BlockType) => {
    const config = BLOCK_CONFIGS[type] || BLOCK_CONFIGS.content;
    const IconComponent = config.icon;
    return <IconComponent className="jd-h-4 jd-w-4" />;
  };

  const getBlockColor = (type: BlockType) => {
    return BLOCK_CONFIGS[type]?.color || BLOCK_CONFIGS.content.color;
  };

  const getBlockLabel = (type: BlockType) => {
    return BLOCK_CONFIGS[type]?.label || 'Content';
  };

  const handleAddBlockClick = (blockType: BlockType) => {
    onAddBlock('end', blockType);
  };

  return (
    <div className="jd-flex jd-flex-col jd-h-full jd-border-r jd-pr-4">
      {/* Header */}
      <div className="jd-flex jd-items-center jd-justify-between jd-mb-4">
        <h3 className="jd-font-semibold jd-text-lg">Blocks</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="jd-h-4 jd-w-4 jd-mr-1" />
              Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(BLOCK_CONFIGS).map(([type, config]) => (
              <DropdownMenuItem
                key={type}
                onSelect={() => handleAddBlockClick(type as BlockType)}
                className="jd-flex jd-items-center jd-gap-2"
              >
                {getBlockIcon(type as BlockType)}
                {config.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Block List */}
      <div className="jd-flex-1 jd-overflow-y-auto jd-space-y-2">
        {blocks.map((block, index) => {
          const isSelected = block.id === selectedBlockId;
          const canMoveUp = index > 0;
          const canMoveDown = index < blocks.length - 1;
          
          return (
            <div
              key={block.id}
              className={cn(
                "jd-group jd-relative jd-p-3 jd-rounded-lg jd-border jd-cursor-pointer jd-transition-all",
                isSelected 
                  ? "jd-border-primary jd-bg-primary/5 jd-shadow-sm" 
                  : "jd-border-border hover:jd-border-primary/50 hover:jd-bg-accent/50"
              )}
              onClick={() => onBlockSelect(block.id)}
            >
              {/* Block Header */}
              <div className="jd-flex jd-items-start jd-justify-between jd-gap-2">
                <div className="jd-flex jd-items-center jd-gap-2 jd-min-w-0 jd-flex-1">
                  {getBlockIcon(block.type)}
                  <div className="jd-min-w-0 jd-flex-1">
                    <div className="jd-flex jd-items-center jd-gap-1 jd-mb-1">
                      <Badge 
                        variant="secondary" 
                        className={cn("jd-text-xs", getBlockColor(block.type))}
                      >
                        {getBlockLabel(block.type)}
                      </Badge>
                    </div>
                    <p className="jd-font-medium jd-text-sm jd-truncate">
                      {block.name || `${getBlockLabel(block.type)} Block`}
                    </p>
                  </div>
                </div>
                
                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="jd-h-6 jd-w-6 jd-p-0 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="jd-h-3 jd-w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => onMoveBlock(block.id, 'up')}
                      disabled={!canMoveUp}
                    >
                      <ArrowUp className="jd-h-4 jd-w-4 jd-mr-2" />
                      Move Up
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onMoveBlock(block.id, 'down')}
                      disabled={!canMoveDown}
                    >
                      <ArrowDown className="jd-h-4 jd-w-4 jd-mr-2" />
                      Move Down
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onRemoveBlock(block.id)}
                      disabled={blocks.length <= 1}
                      className="jd-text-destructive focus:jd-text-destructive"
                    >
                      <Trash2 className="jd-h-4 jd-w-4 jd-mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Block Preview */}
              <div className="jd-mt-2 jd-text-xs jd-text-muted-foreground">
                {typeof block.content === 'string' 
                  ? block.content.substring(0, 60) + (block.content.length > 60 ? '...' : '')
                  : Object.values(block.content)[0]?.substring(0, 60) + '...' || 'No content'
                }
              </div>
              
              {/* Selection Indicator */}
              {isSelected && (
                <div className="jd-absolute jd-left-0 jd-top-0 jd-bottom-0 jd-w-1 jd-bg-primary jd-rounded-l-lg"></div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Footer */}
      <div className="jd-mt-4 jd-pt-4 jd-border-t">
        <p className="jd-text-xs jd-text-muted-foreground jd-text-center">
          {blocks.length} block{blocks.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};