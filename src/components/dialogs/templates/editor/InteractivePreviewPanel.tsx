// src/components/dialogs/templates/editor/InteractivePreviewPanel.tsx
import React, { useState, useEffect } from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { blocksApi } from '@/services/api/BlocksApi';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { toast } from 'sonner';
import { 
  Eye, 
  Copy, 
  Edit3, 
  Save, 
  X, 
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
  Plus,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/core/utils/classNames';

interface InteractivePreviewPanelProps {
  blocks: Block[];
  onAddBlock: (position: 'start' | 'end', blockType: BlockType, existingBlock?: Block) => void;
  onRemoveBlock: (blockId: number) => void;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onMoveBlock: (blockId: number, direction: 'up' | 'down') => void;
}

const BLOCK_CONFIGS = {
  content: { icon: FileText, label: 'Content', color: 'bg-blue-100 text-blue-800', description: 'Main content or instructions' },
  context: { icon: MessageSquare, label: 'Context', color: 'bg-green-100 text-green-800', description: 'Background information' },
  role: { icon: User, label: 'Role', color: 'bg-purple-100 text-purple-800', description: 'AI persona or role definition' },
  example: { icon: Layout, label: 'Example', color: 'bg-orange-100 text-orange-800', description: 'Examples to guide responses' },
  format: { icon: Type, label: 'Format', color: 'bg-pink-100 text-pink-800', description: 'Output format specification' },
  audience: { icon: Users, label: 'Audience', color: 'bg-teal-100 text-teal-800', description: 'Target audience definition' }
};

export const InteractivePreviewPanel: React.FC<InteractivePreviewPanelProps> = ({ 
  blocks, 
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onMoveBlock 
}) => {
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
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

  // Get block content as string
  const getContentAsString = (content: Block['content']): string => {
    if (typeof content === 'string') {
      return content;
    } else if (content && typeof content === 'object') {
      return Object.values(content)[0] || '';
    }
    return '';
  };

  // Generate combined content
  const combinedContent = blocks
    .map(block => getContentAsString(block.content))
    .filter(content => content.trim())
    .join('\n\n');

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(combinedContent);
      toast.success('Content copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };

  // Start editing a block
  const handleEditBlock = (block: Block) => {
    setEditingBlockId(block.id);
    setEditingBlock({ ...block });
  };

  // Save block changes
  const handleSaveBlock = () => {
    if (editingBlock && editingBlockId) {
      onUpdateBlock(editingBlockId, editingBlock);
      setEditingBlockId(null);
      setEditingBlock(null);
      toast.success('Block updated');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingBlockId(null);
    setEditingBlock(null);
  };

  // Handle editing field changes
  const handleEditChange = (field: keyof Block, value: any) => {
    if (editingBlock) {
      setEditingBlock(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  // Load available blocks
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

          response.data.forEach((apiBlock: any) => {
            const locale = getCurrentLanguage();
            const getLocalizedContent = (content: Record<string, string> | string): string => {
              if (typeof content === 'string') return content;
              return content[locale] || content.en || Object.values(content)[0] || '';
            };

            const block: Block = {
              id: apiBlock.id,
              type: apiBlock.type,
              content: getLocalizedContent(apiBlock.content),
              name: apiBlock.title ? getLocalizedContent(apiBlock.title) : `${getBlockLabel(apiBlock.type)} Block`,
              description: apiBlock.description ? getLocalizedContent(apiBlock.description) : ''
            };

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
    const newBlock: Block = {
      id: Date.now() + Math.random(),
      type: blockType,
      content: '',
      name: `New ${getBlockLabel(blockType)} Block`,
      description: ''
    };

    onAddBlock('end', blockType, newBlock);
    setShowAddMenu(false);
  };

  const handleUseExistingBlock = (existingBlock: Block) => {
    onAddBlock('end', existingBlock.type, existingBlock);
    setShowAddMenu(false);
  };

  return (
    <div className="jd-flex jd-flex-col jd-h-full">
      {/* Header */}
      <div className="jd-flex jd-items-center jd-justify-between jd-mb-4">
        <div className="jd-flex jd-items-center jd-gap-2">
          <Eye className="jd-h-5 jd-w-5" />
          <h3 className="jd-font-semibold jd-text-lg">Template Preview</h3>
        </div>
        <div className="jd-flex jd-items-center jd-gap-2">
          {/* Add Block Dropdown */}
          <div className="jd-relative">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="jd-flex jd-items-center jd-gap-1"
            >
              <Plus className="jd-h-4 jd-w-4" />
              Add Block
              <ChevronDown className="jd-h-3 jd-w-3" />
            </Button>

            {showAddMenu && (
              <Card className="jd-absolute jd-top-full jd-right-0 jd-mt-2 jd-w-80 jd-z-10 jd-shadow-lg">
                <CardContent className="jd-p-3">
                  <div className="jd-flex jd-items-center jd-justify-between jd-mb-3">
                    <h4 className="jd-font-medium jd-text-sm">Add Block</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddMenu(false)}
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
                                <Badge variant="outline" className="jd-text-xs">New</Badge>
                              </div>
                              <p className="jd-text-xs jd-text-muted-foreground">{config.description}</p>
                            </div>
                          </div>

                          {/* Existing Blocks */}
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
                                    {getContentAsString(block.content).substring(0, 30) + 
                                     (getContentAsString(block.content).length > 30 ? '...' : '')}
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
          
          <Button onClick={handleCopy} size="sm" variant="outline">
            <Copy className="jd-h-4 jd-w-4 jd-mr-1" />
            Copy All
          </Button>
        </div>
      </div>

      {/* Block Previews */}
      <div className="jd-flex-1 jd-overflow-y-auto jd-space-y-4">
        {blocks.map((block, index) => {
          const content = getContentAsString(block.content);
          const isEditing = editingBlockId === block.id;
          const canMoveUp = index > 0;
          const canMoveDown = index < blocks.length - 1;

          if (!content.trim() && !isEditing) return null;

          return (
            <Card 
              key={block.id} 
              className={cn(
                "jd-transition-all hover:jd-shadow-md jd-group",
                isEditing && "jd-ring-2 jd-ring-primary"
              )}
            >
              <CardHeader className="jd-pb-2">
                <CardTitle className="jd-flex jd-items-center jd-gap-2 jd-text-sm">
                  <Badge variant="secondary" className="jd-text-xs">
                    {index + 1}
                  </Badge>
                  <span>{block.name || `${getBlockLabel(block.type)} Block`}</span>
                  <Badge 
                    variant="outline" 
                    className={cn("jd-text-xs", getBlockColor(block.type))}
                  >
                    {getBlockLabel(block.type)}
                  </Badge>
                  
                  <div className="jd-ml-auto jd-flex jd-items-center jd-gap-1 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity">
                    {!isEditing && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditBlock(block)}
                          className="jd-h-7 jd-w-7 jd-p-0"
                        >
                          <Edit3 className="jd-h-3 jd-w-3" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="jd-h-7 jd-w-7 jd-p-0"
                            >
                              <MoreVertical className="jd-h-3 jd-w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => onMoveBlock(block.id, 'up')}
                              disabled={!canMoveUp}
                            >
                              <ArrowUp className="jd-h-4 jd-w-4 jd-mr-2" />
                              Move Up
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onMoveBlock(block.id, 'down')}
                              disabled={!canMoveDown}
                            >
                              <ArrowDown className="jd-h-4 jd-w-4 jd-mr-2" />
                              Move Down
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onRemoveBlock(block.id)}
                              disabled={blocks.length <= 1}
                              className="jd-text-destructive focus:jd-text-destructive"
                            >
                              <Trash2 className="jd-h-4 jd-w-4 jd-mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                    
                    {isEditing && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSaveBlock}
                          className="jd-h-7 jd-w-7 jd-p-0 jd-text-green-600 hover:jd-text-green-700"
                        >
                          <Save className="jd-h-3 jd-w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="jd-h-7 jd-w-7 jd-p-0 jd-text-red-600 hover:jd-text-red-700"
                        >
                          <X className="jd-h-3 jd-w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="jd-pt-0">
                {isEditing && editingBlock ? (
                  // Edit Mode
                  <div className="jd-space-y-3">
                    <div className="jd-grid jd-grid-cols-2 jd-gap-3">
                      <div>
                        <Label htmlFor="edit-name" className="jd-text-xs">Block Name</Label>
                        <Input
                          id="edit-name"
                          value={editingBlock.name || ''}
                          onChange={(e) => handleEditChange('name', e.target.value)}
                          className="jd-text-xs"
                          size="sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-type" className="jd-text-xs">Type</Label>
                        <Select 
                          value={editingBlock.type} 
                          onValueChange={(value: BlockType) => handleEditChange('type', value)}
                        >
                          <SelectTrigger className="jd-text-xs jd-h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(BLOCK_CONFIGS).map(([type, config]) => (
                              <SelectItem key={type} value={type} className="jd-text-xs">
                                <div className="jd-flex jd-items-center jd-gap-2">
                                  {getBlockIcon(type as BlockType)}
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-content" className="jd-text-xs">Content</Label>
                      <Textarea
                        id="edit-content"
                        value={getContentAsString(editingBlock.content)}
                        onChange={(e) => handleEditChange('content', e.target.value)}
                        className="jd-text-sm jd-min-h-[100px]"
                        rows={4}
                      />
                    </div>
                  </div>
                ) : (
                  // Preview Mode
                  <div 
                    className="jd-bg-muted/50 jd-p-3 jd-rounded-md jd-border-l-4 jd-border-primary/20 jd-cursor-pointer hover:jd-bg-muted/70 jd-transition-colors"
                    onClick={() => handleEditBlock(block)}
                  >
                    <pre className="jd-whitespace-pre-wrap jd-text-sm jd-font-mono">
                      {content}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Combined Preview */}
        {blocks.length > 1 && (
          <Card className="jd-border-primary/20 jd-bg-primary/5">
            <CardHeader className="jd-pb-2">
              <CardTitle className="jd-flex jd-items-center jd-gap-2 jd-text-sm jd-text-primary">
                <Badge className="jd-text-xs">Final</Badge>
                <span>Combined Output</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="jd-pt-0">
              <div className="jd-bg-background jd-p-4 jd-rounded-md jd-border">
                <pre className="jd-whitespace-pre-wrap jd-text-sm">
                  {combinedContent}
                </pre>
              </div>
              <div className="jd-flex jd-justify-between jd-items-center jd-mt-3 jd-text-xs jd-text-muted-foreground">
                <span>{combinedContent.length} characters</span>
                <span>{combinedContent.split('\n').length} lines</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};