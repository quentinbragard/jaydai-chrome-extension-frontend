// src/components/dialogs/templates/editor/EnhancedInteractivePreviewPanel.tsx
import React, { useState, useEffect } from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { PromptMetadata, DEFAULT_METADATA_FIELDS, METADATA_CONFIGS } from '@/components/templates/metadata/types';
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
  ChevronDown,
  ChevronRight,
  Settings,
  Sparkles,
  Info
} from 'lucide-react';
import { cn } from '@/core/utils/classNames';

interface EnhancedInteractivePreviewPanelProps {
  blocks: Block[];
  metadata?: PromptMetadata;
  onAddBlock: (position: 'start' | 'end', blockType: BlockType, existingBlock?: Block) => void;
  onRemoveBlock: (blockId: number) => void;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onMoveBlock: (blockId: number, direction: 'up' | 'down') => void;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
}

const BLOCK_CONFIGS = {
  content: { icon: FileText, label: 'Content', color: 'jd-bg-blue-100 jd-text-blue-800', description: 'Main content or instructions' },
  context: { icon: MessageSquare, label: 'Context', color: 'jd-bg-green-100 jd-text-green-800', description: 'Background information' },
  role: { icon: User, label: 'Role', color: 'jd-bg-purple-100 jd-text-purple-800', description: 'AI persona or role definition' },
  example: { icon: Layout, label: 'Example', color: 'jd-bg-orange-100 jd-text-orange-800', description: 'Examples to guide responses' },
  format: { icon: Type, label: 'Format', color: 'jd-bg-pink-100 jd-text-pink-800', description: 'Output format specification' },
  audience: { icon: Users, label: 'Audience', color: 'jd-bg-teal-100 jd-text-teal-800', description: 'Target audience definition' }
};

export const EnhancedInteractivePreviewPanel: React.FC<EnhancedInteractivePreviewPanelProps> = ({ 
  blocks = [], 
  metadata,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onMoveBlock,
  onUpdateMetadata
}) => {
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showMetadataPanel, setShowMetadataPanel] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState(new Set(['core']));

  // Ensure metadata has proper structure with safety checks
  const safeMetadata: PromptMetadata = React.useMemo(() => {
    if (!metadata || !metadata.fields) {
      return { fields: DEFAULT_METADATA_FIELDS || [] };
    }
    return metadata;
  }, [metadata]);

  // Safe content extraction
  const getContentAsString = React.useCallback((content: Block['content']): string => {
    try {
      if (typeof content === 'string') {
        return content;
      } else if (content && typeof content === 'object') {
        const values = Object.values(content);
        return values[0] || '';
      }
      return '';
    } catch (error) {
      console.error('Error extracting block content:', error);
      return '';
    }
  }, []);

  // Safe block type helpers
  const getBlockIcon = React.useCallback((type: BlockType) => {
    const config = BLOCK_CONFIGS[type] || BLOCK_CONFIGS.content;
    const IconComponent = config.icon;
    return <IconComponent className="jd-h-4 jd-w-4" />;
  }, []);

  const getBlockColor = React.useCallback((type: BlockType) => {
    return BLOCK_CONFIGS[type]?.color || BLOCK_CONFIGS.content.color;
  }, []);

  const getBlockLabel = React.useCallback((type: BlockType) => {
    return BLOCK_CONFIGS[type]?.label || 'Content';
  }, []);

  // Generate combined content with safety checks
  const generateFinalContent = React.useCallback(() => {
    try {
      const blockContent = blocks
        .map(block => getContentAsString(block.content))
        .filter(content => content && content.trim())
        .join('\n\n');

      const metadataInstructions = (safeMetadata.fields || [])
        .filter(field => field && field.value && field.value.trim())
        .map(field => {
          try {
            const config = METADATA_CONFIGS[field.type];
            return config ? `${config.label}: ${field.value}` : `${field.label}: ${field.value}`;
          } catch (error) {
            console.error('Error processing metadata field:', error);
            return '';
          }
        })
        .filter(instruction => instruction)
        .join('\n');

      if (metadataInstructions) {
        return `${metadataInstructions}\n\n${blockContent}`;
      }
      return blockContent;
    } catch (error) {
      console.error('Error generating final content:', error);
      return 'Error generating content';
    }
  }, [blocks, safeMetadata.fields, getContentAsString]);

  const finalContent = generateFinalContent();

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalContent);
      toast.success('Content copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };

  // Block editing functions with safety checks
  const handleEditBlock = (block: Block) => {
    try {
      setEditingBlockId(block.id);
      setEditingBlock({ ...block });
    } catch (error) {
      console.error('Error starting block edit:', error);
      toast.error('Failed to edit block');
    }
  };

  const handleSaveBlock = () => {
    try {
      if (editingBlock && editingBlockId && onUpdateBlock) {
        onUpdateBlock(editingBlockId, editingBlock);
        setEditingBlockId(null);
        setEditingBlock(null);
        toast.success('Block updated');
      }
    } catch (error) {
      console.error('Error saving block:', error);
      toast.error('Failed to save block');
    }
  };

  const handleCancelEdit = () => {
    setEditingBlockId(null);
    setEditingBlock(null);
  };

  const handleEditChange = (field: keyof Block, value: any) => {
    try {
      if (editingBlock) {
        setEditingBlock(prev => prev ? { ...prev, [field]: value } : null);
      }
    } catch (error) {
      console.error('Error updating block field:', error);
    }
  };

  // Metadata handling with safety checks
  const handleMetadataFieldUpdate = (fieldId: string, value: string) => {
    try {
      if (onUpdateMetadata && safeMetadata.fields) {
        const updatedFields = safeMetadata.fields.map(field =>
          field.id === fieldId ? { ...field, value } : field
        );
        onUpdateMetadata({ fields: updatedFields });
      }
    } catch (error) {
      console.error('Error updating metadata field:', error);
      toast.error('Failed to update metadata');
    }
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Safe add block function
  const handleAddBlockType = (blockType: BlockType) => {
    try {
      if (onAddBlock) {
        const newBlock: Block = {
          id: Date.now() + Math.random(),
          type: blockType,
          content: '',
          name: `New ${getBlockLabel(blockType)} Block`,
          description: ''
        };

        onAddBlock('end', blockType, newBlock);
        setShowAddMenu(false);
      }
    } catch (error) {
      console.error('Error adding block:', error);
      toast.error('Failed to add block');
    }
  };

  // Group metadata configs by category with safety checks
  const categorizedConfigs = React.useMemo(() => {
    try {
      return Object.entries(METADATA_CONFIGS || {}).reduce((acc, [type, config]) => {
        if (config && config.category) {
          const category = config.category;
          if (!acc[category]) acc[category] = [];
          acc[category].push({ type, config });
        }
        return acc;
      }, {} as Record<string, Array<{ type: string; config: any }>>);
    } catch (error) {
      console.error('Error categorizing metadata configs:', error);
      return {};
    }
  }, []);

  // Safety check for rendering
  if (!blocks) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-text-center">
          <p className="jd-text-gray-500">No content available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jd-flex jd-flex-col jd-h-full jd-space-y-6 jd-bg-gray-50 jd-p-6">
      {/* Header */}
      <div className="jd-flex jd-items-center jd-justify-between">
        <div className="jd-flex jd-items-center jd-gap-2">
          <Sparkles className="jd-h-6 jd-w-6 jd-text-primary" />
          <h3 className="jd-font-bold jd-text-xl jd-text-gray-900">Enhanced Prompt Builder</h3>
        </div>
        <div className="jd-flex jd-items-center jd-gap-2">
          <Button onClick={handleCopy} size="sm" variant="outline" className="jd-shadow-sm">
            <Copy className="jd-h-4 jd-w-4 jd-mr-2" />
            Copy Final
          </Button>
        </div>
      </div>

      <div className="jd-grid jd-grid-cols-12 jd-gap-6 jd-flex-1 jd-overflow-hidden">
        {/* Main Content Area */}
        <div className="jd-col-span-8 jd-space-y-6 jd-overflow-y-auto">
          {/* Metadata Panel */}
          <Card className="jd-border-0 jd-shadow-sm jd-bg-white">
            <CardHeader className="jd-pb-4">
              <div className="jd-flex jd-items-center jd-justify-between">
                <CardTitle className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2 jd-text-gray-900">
                  <Settings className="jd-h-5 jd-w-5 jd-text-primary" />
                  Prompt Settings
                  <Badge variant="secondary" className="jd-text-xs">
                    {safeMetadata.fields?.filter(f => f && f.value && f.value.trim()).length || 0} active
                  </Badge>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMetadataPanel(!showMetadataPanel)}
                  className="jd-h-8 jd-w-8 jd-p-0"
                >
                  {showMetadataPanel ? <ChevronDown className="jd-h-4 jd-w-4" /> : <ChevronRight className="jd-h-4 jd-w-4" />}
                </Button>
              </div>
            </CardHeader>
            
            {showMetadataPanel && (
              <CardContent className="jd-pt-0 jd-space-y-6">
                {Object.entries(categorizedConfigs).map(([categoryName, items]) => (
                  <div key={categoryName}>
                    <button
                      onClick={() => toggleCategory(categoryName)}
                      className="jd-flex jd-items-center jd-gap-2 jd-text-sm jd-font-medium jd-text-gray-700 jd-uppercase jd-tracking-wide jd-mb-3 hover:jd-text-gray-900 jd-transition-colors"
                    >
                      {expandedCategories.has(categoryName) ? 
                        <ChevronDown className="jd-h-3 jd-w-3" /> : 
                        <ChevronRight className="jd-h-3 jd-w-3" />
                      }
                      {categoryName.replace('_', ' ')}
                    </button>
                    
                    {expandedCategories.has(categoryName) && (
                      <div className="jd-ml-4 jd-space-y-4">
                        <div className="jd-grid jd-grid-cols-2 jd-gap-4">
                          {safeMetadata.fields
                            ?.filter(field => {
                              try {
                                const config = METADATA_CONFIGS[field?.type];
                                return config && config.category === categoryName;
                              } catch {
                                return false;
                              }
                            })
                            .map((field) => {
                              try {
                                const config = METADATA_CONFIGS[field.type];
                                if (!config) return null;
                                
                                return (
                                  <div key={field.id} className="jd-group jd-space-y-2">
                                    <Label className="jd-text-sm jd-flex jd-items-center jd-gap-2 jd-font-medium jd-text-gray-700">
                                      <span className="jd-text-lg">{config.icon}</span>
                                      {field.label}
                                    </Label>
                                    <Input
                                      value={field.value || ''}
                                      onChange={(e) => handleMetadataFieldUpdate(field.id, e.target.value)}
                                      placeholder={field.placeholder}
                                      className="jd-border-gray-200 focus:jd-border-primary focus:jd-ring-primary"
                                    />
                                  </div>
                                );
                              } catch (error) {
                                console.error('Error rendering metadata field:', error);
                                return null;
                              }
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Content Blocks Section */}
          <Card className="jd-border-0 jd-shadow-sm jd-bg-white">
            <CardHeader className="jd-pb-4">
              <div className="jd-flex jd-items-center jd-justify-between">
                <CardTitle className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2 jd-text-gray-900">
                  <Layout className="jd-h-5 jd-w-5 jd-text-primary" />
                  Content Blocks
                  <Badge variant="secondary" className="jd-text-xs">
                    {blocks.length}
                  </Badge>
                </CardTitle>
                
                <div className="jd-relative">
                  <Button 
                    size="sm" 
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="jd-flex jd-items-center jd-gap-2 jd-shadow-sm"
                  >
                    <Plus className="jd-h-4 jd-w-4" />
                    Add Block
                    <ChevronDown className="jd-h-3 jd-w-3" />
                  </Button>

                  {showAddMenu && (
                    <Card className="jd-absolute jd-top-full jd-right-0 jd-mt-2 jd-w-80 jd-z-10 jd-shadow-lg jd-border-0">
                      <CardContent className="jd-p-4">
                        <div className="jd-flex jd-items-center jd-justify-between jd-mb-3">
                          <h4 className="jd-font-medium jd-text-sm">Add Content Block</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowAddMenu(false)}
                            className="jd-h-6 jd-w-6 jd-p-0"
                          >
                            <X className="jd-h-3 jd-w-3" />
                          </Button>
                        </div>
                        
                        <div className="jd-grid jd-grid-cols-2 jd-gap-2">
                          {Object.entries(BLOCK_CONFIGS).map(([type, config]) => (
                            <Button
                              key={type}
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddBlockType(type as BlockType)}
                              className="jd-h-auto jd-p-3 jd-flex jd-flex-col jd-items-center jd-gap-2 hover:jd-bg-primary/5 jd-border-gray-200"
                            >
                              <config.icon className="jd-h-5 jd-w-5 jd-text-gray-600" />
                              <span className="jd-text-xs jd-font-medium">{config.label}</span>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="jd-pt-0 jd-space-y-4">
              {blocks.length === 0 ? (
                <div className="jd-text-center jd-py-8">
                  <p className="jd-text-gray-500">No blocks available. Add a block to get started.</p>
                </div>
              ) : (
                blocks.map((block, index) => {
                  try {
                    const content = getContentAsString(block.content);
                    const isEditing = editingBlockId === block.id;
                    const canMoveUp = index > 0;
                    const canMoveDown = index < blocks.length - 1;

                    return (
                      <Card key={block.id} className={cn(
                        "jd-group jd-transition-all jd-duration-200 jd-border-l-4 jd-border-l-transparent hover:jd-border-l-primary/30 hover:jd-shadow-md",
                        isEditing && "jd-ring-2 jd-ring-primary jd-border-l-primary"
                      )}>
                        <CardHeader className="jd-pb-3">
                          <div className="jd-flex jd-items-center jd-gap-3">
                            <Badge variant="secondary" className={cn("jd-text-xs", getBlockColor(block.type))}>
                              {getBlockIcon(block.type)}
                              <span className="jd-ml-1">{getBlockLabel(block.type)}</span>
                            </Badge>
                            
                            <Input
                              value={isEditing ? editingBlock?.name || '' : block.name || ''}
                              onChange={(e) => isEditing ? 
                                setEditingBlock(prev => ({ ...prev, name: e.target.value })) :
                                onUpdateBlock && onUpdateBlock(block.id, { name: e.target.value })
                              }
                              className="jd-h-8 jd-text-sm jd-font-medium jd-border-none jd-bg-transparent jd-px-0 focus-visible:jd-ring-0"
                            />
                            
                            <div className="jd-ml-auto jd-flex jd-items-center jd-gap-1 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity">
                              {!isEditing ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditBlock(block)}
                                    className="jd-h-7 jd-w-7 jd-p-0"
                                  >
                                    <Edit3 className="jd-h-3 jd-w-3" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="jd-h-7 jd-w-7 jd-p-0"
                                      >
                                        <MoreVertical className="jd-h-3 jd-w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem 
                                        onClick={() => onMoveBlock && onMoveBlock(block.id, 'up')}
                                        disabled={!canMoveUp}
                                      >
                                        <ArrowUp className="jd-h-4 jd-w-4 jd-mr-2" />
                                        Move Up
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => onMoveBlock && onMoveBlock(block.id, 'down')}
                                        disabled={!canMoveDown}
                                      >
                                        <ArrowDown className="jd-h-4 jd-w-4 jd-mr-2" />
                                        Move Down
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => onRemoveBlock && onRemoveBlock(block.id)}
                                        disabled={blocks.length <= 1}
                                        className="jd-text-destructive focus:jd-text-destructive"
                                      >
                                        <Trash2 className="jd-h-4 jd-w-4 jd-mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSaveBlock}
                                    className="jd-h-7 jd-w-7 jd-p-0 jd-text-green-600 hover:jd-text-green-700"
                                  >
                                    <Save className="jd-h-3 jd-w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    className="jd-h-7 jd-w-7 jd-p-0 jd-text-red-600 hover:jd-text-red-700"
                                  >
                                    <X className="jd-h-3 jd-w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="jd-pt-0">
                          {isEditing ? (
                            <div className="jd-space-y-3">
                              <div>
                                <Label className="jd-text-xs">Content</Label>
                                <Textarea
                                  value={getContentAsString(editingBlock?.content || '')}
                                  onChange={(e) => handleEditChange('content', e.target.value)}
                                  className="jd-mt-1 jd-min-h-[100px] jd-text-sm jd-border-gray-200 focus:jd-border-primary focus:jd-ring-primary"
                                  rows={4}
                                />
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="jd-min-h-[80px] jd-p-4 jd-bg-gray-50 jd-rounded-lg jd-cursor-pointer hover:jd-bg-gray-100 jd-transition-colors jd-border-l-2 jd-border-l-primary/20"
                              onClick={() => handleEditBlock(block)}
                            >
                              <pre className="jd-whitespace-pre-wrap jd-text-sm jd-font-mono jd-text-gray-700">
                                {content || 'Click to add content...'}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  } catch (error) {
                    console.error('Error rendering block:', error);
                    return (
                      <Card key={`error-${index}`} className="jd-border-red-200">
                        <CardContent className="jd-p-4">
                          <p className="jd-text-red-600 jd-text-sm">Error rendering block</p>
                        </CardContent>
                      </Card>
                    );
                  }
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Sidebar */}
        <div className="jd-col-span-4">
          <div className="jd-sticky jd-top-0 jd-space-y-4">
            <Card className="jd-border-0 jd-shadow-sm jd-bg-white">
              <CardHeader className="jd-pb-4">
                <CardTitle className="jd-flex jd-items-center jd-gap-2 jd-text-lg jd-font-semibold jd-text-gray-900">
                  <Eye className="jd-h-5 jd-w-5 jd-text-primary" />
                  Final Preview
                  <Badge variant="secondary" className="jd-text-xs">
                    {finalContent.length} chars
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="jd-pt-0">
                <div className="jd-bg-gray-50 jd-p-4 jd-rounded-lg jd-border jd-max-h-96 jd-overflow-y-auto">
                  <pre className="jd-whitespace-pre-wrap jd-text-sm jd-text-gray-700 jd-leading-relaxed">
                    {finalContent || 'No content to preview'}
                  </pre>
                </div>
                
                <div className="jd-flex jd-items-center jd-justify-between jd-mt-4 jd-text-xs jd-text-gray-500">
                  <span>{finalContent.split('\n').length} lines</span>
                  <span>{finalContent.split(' ').length} words</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="jd-border-0 jd-shadow-sm jd-bg-white">
              <CardHeader className="jd-pb-3">
                <CardTitle className="jd-text-sm jd-font-semibold jd-text-gray-900">Summary</CardTitle>
              </CardHeader>
              <CardContent className="jd-pt-0 jd-space-y-3">
                <div className="jd-flex jd-items-center jd-justify-between jd-text-sm">
                  <span className="jd-text-gray-600">Active Settings</span>
                  <Badge variant="outline" className="jd-text-xs">
                    {safeMetadata.fields?.filter(f => f && f.value && f.value.trim()).length || 0}
                  </Badge>
                </div>
                <div className="jd-flex jd-items-center jd-justify-between jd-text-sm">
                  <span className="jd-text-gray-600">Content Blocks</span>
                  <Badge variant="outline" className="jd-text-xs">
                    {blocks.length}
                  </Badge>
                </div>
                <div className="jd-flex jd-items-center jd-justify-between jd-text-sm">
                  <span className="jd-text-gray-600">Total Length</span>
                  <Badge variant="outline" className="jd-text-xs">
                    {finalContent.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};