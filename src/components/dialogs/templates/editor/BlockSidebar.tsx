// src/components/dialogs/templates/editor/BlockSidebar.tsx
import React, { useState, useEffect } from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { blocksApi, BlockResponse } from '@/services/api/BlocksApi';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { toast } from 'sonner';
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
  Type,
  ChevronDown,
  ChevronUp,
  X
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
  content: { icon: FileText, label: 'Content', color: 'bg-blue-100 text-blue-800', description: 'Main content or instructions' },
  context: { icon: MessageSquare, label: 'Context', color: 'bg-green-100 text-green-800', description: 'Background information' },
  role: { icon: User, label: 'Role', color: 'bg-purple-100 text-purple-800', description: 'AI persona or role definition' },
  example: { icon: Layout, label: 'Example', color: 'bg-orange-100 text-orange-800', description: 'Examples to guide responses' },
  format: { icon: Type, label: 'Format', color: 'bg-pink-100 text-pink-800', description: 'Output format specification' },
  audience: { icon: Users, label: 'Audience', color: 'bg-teal-100 text-teal-800', description: 'Target audience definition' }
};

export const BlockSidebar: React.FC<BlockSidebarProps> = ({
  blocks,
  selectedBlockId,
  onBlockSelect,
  onAddBlock,
  onRemoveBlock,
  onMoveBlock
}) => {
  const [showBlockTypeSelector, setShowBlockTypeSelector] = useState(false);
  const [availableBlocks, setAvailableBlocks] = useState<Record<BlockType, Block[]>>({
    content: [],
    context: [],
    role: [],
    example: [],
    format: [],
    audience: []
  });

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

  // Convert API response to Block format
  const convertApiBlockToBlock = (apiBlock: BlockResponse): Block => {
    const locale = getCurrentLanguage();
    
    const getLocalizedContent = (content: Record<string, string> | string): string => {
      if (typeof content === 'string') return content;
      return content[locale] || content.en || Object.values(content)[0] || '';
    };

    return {
      id: apiBlock.id,
      type: apiBlock.type,
      content: getLocalizedContent(apiBlock.content),
      name: apiBlock.title ? getLocalizedContent(apiBlock.title) : `${getBlockLabel(apiBlock.type)} Block`,
      description: apiBlock.description ? getLocalizedContent(apiBlock.description) : ''
    };
  };

  // Load all available blocks when component mounts
  useEffect(() => {
    const loadAllBlocks = async () => {
      try {
        const response = await blocksApi.getBlocks();
        if (response.success && response.data) {
          const blocksByType: Record<BlockType, Block[]> = {
            content: [],
            context: [],
            role: [],
            example: [],
            format: [],
            audience: []
          };

          response.data.forEach((apiBlock: BlockResponse) => {
            const block = convertApiBlockToBlock(apiBlock);
            if (blocksByType[block.type]) {
              blocksByType[block.type].push(block);
            }
          });

          setAvailableBlocks(blocksByType);
        }
      } catch (error) {
        console.error('Error loading blocks:', error);
      }
    };

    loadAllBlocks();
  }, []);

  const handleAddBlockType = (blockType: BlockType) => {
    // Create a simple new block
    const newBlock: Block = {
      id: Date.now() + Math.random(),
      type: blockType,
      content: '',
      name: `New ${getBlockLabel(blockType)} Block`,
      description: ''
    };

    onAddBlock('end', blockType, newBlock);
    setShowBlockTypeSelector(false);
  };

  const handleUseExistingBlock = (existingBlock: Block) => {
    onAddBlock('end', existingBlock.type, existingBlock);
    setShowBlockTypeSelector(false);
  };

  return (
    <div className="jd-flex jd-flex-col jd-h-full jd-border-r jd-pr-4">
      {/* Header */}
      <div className="jd-flex jd-items-center jd-justify-between jd-mb-4">
        <h3 className="jd-font-semibold jd-text-lg">Blocks</h3>
        <div className="jd-relative">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowBlockTypeSelector(!showBlockTypeSelector)}
            className="jd-flex jd-items-center jd-gap-1"
          >
            <Plus className="jd-h-4 jd-w-4" />
            Add
            {showBlockTypeSelector ? (
              <ChevronUp className="jd-h-3 jd-w-3" />
            ) : (
              <ChevronDown className="jd-h-3 jd-w-3" />
            )}
          </Button>

          {/* Block Type Selector */}
          {showBlockTypeSelector && (
            <Card className="jd-absolute jd-top-full jd-right-0 jd-mt-2 jd-w-80 jd-z-10 jd-shadow-lg">
              <CardContent className="jd-p-3">
                <div className="jd-flex jd-items-center jd-justify-between jd-mb-3">
                  <h4 className="jd-font-medium jd-text-sm">Add Block</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowBlockTypeSelector(false)}
                    className="jd-h-6 jd-w-6 jd-p-0"
                  >
                    <X className="jd-h-3 jd-w-3" />
                  </Button>
                </div>
                
                <div className="jd-space-y-3">
                  {Object.entries(BLOCK_CONFIGS).map(([type, config]) => {
                    const blockType = type as BlockType;
                    const existingBlocksOfType = availableBlocks[blockType] || [];
                    
                    return (
                      <div key={type} className="jd-space-y-2">
                        {/* Block Type Header */}
                        <div 
                          className="jd-flex jd-items-center jd-gap-2 jd-p-2 jd-rounded jd-border jd-cursor-pointer hover:jd-bg-accent jd-transition-colors"
                          onClick={() => handleAddBlockType(blockType)}
                        >
                          {getBlockIcon(blockType)}
                          <div className="jd-flex-1">
                            <div className="jd-flex jd-items-center jd-gap-2">
                              <span className="jd-font-medium jd-text-sm">{config.label}</span>
                              <Badge variant="outline" className="jd-text-xs">
                                New
                              </Badge>
                            </div>
                            <p className="jd-text-xs jd-text-muted-foreground">{config.description}</p>
                          </div>
                        </div>

                        {/* Existing Blocks of This Type */}
                        {existingBlocksOfType.length > 0 && (
                          <div className="jd-ml-6 jd-space-y-1">
                            <p className="jd-text-xs jd-text-muted-foreground jd-mb-1">
                              Existing {config.label.toLowerCase()} blocks:
                            </p>
                            {existingBlocksOfType.slice(0, 3).map((block) => (
                              <div
                                key={block.id}
                                className="jd-flex jd-items-center jd-gap-2 jd-p-1.5 jd-rounded jd-text-xs jd-cursor-pointer hover:jd-bg-accent/50 jd-transition-colors"
                                onClick={() => handleUseExistingBlock(block)}
                              >
                                <Badge 
                                  variant="secondary" 
                                  className={cn("jd-text-xs", getBlockColor(blockType))}
                                >
                                  {block.name?.substring(0, 12) || 'Untitled'}
                                </Badge>
                                <span className="jd-text-muted-foreground jd-truncate">
                                  {typeof block.content === 'string' 
                                    ? block.content.substring(0, 30) + (block.content.length > 30 ? '...' : '')
                                    : 'No preview'
                                  }
                                </span>
                              </div>
                            ))}
                            {existingBlocksOfType.length > 3 && (
                              <p className="jd-text-xs jd-text-muted-foreground jd-italic">
                                +{existingBlocksOfType.length - 3} more available
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
                      onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, 'up'); }}
                      disabled={!canMoveUp}
                    >
                      <ArrowUp className="jd-h-4 jd-w-4 jd-mr-2" />
                      Move Up
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, 'down'); }}
                      disabled={!canMoveDown}
                    >
                      <ArrowDown className="jd-h-4 jd-w-4 jd-mr-2" />
                      Move Down
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onRemoveBlock(block.id); }}
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