// src/components/dialogs/templates/editor/AdvancedEditor.tsx
import React, { useState, useEffect } from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { PromptMetadata, DEFAULT_METADATA, METADATA_CONFIGS, MetadataType } from '@/components/templates/metadata/types';
import { blocksApi } from '@/services/api/BlocksApi';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  ChevronDown, 
  ChevronUp,
  Eye,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileText,
  User,
  MessageSquare,
  Target,
  Users,
  Type,
  Layout
} from 'lucide-react';
import { cn } from "@/core/utils/classNames";

interface AdvancedEditorProps {
  blocks: Block[];
  metadata?: PromptMetadata;
  onAddBlock: (position: 'start' | 'end', blockType: BlockType, existingBlock?: Block) => void;
  onRemoveBlock: (blockId: number) => void;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onMoveBlock: (blockId: number, direction: 'up' | 'down') => void;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
  isProcessing: boolean;
}

// Primary metadata elements that appear on the first row
const PRIMARY_METADATA: MetadataType[] = ['role', 'context', 'goal'];

// All available metadata types for the secondary row
const ALL_METADATA_TYPES: MetadataType[] = Object.keys(METADATA_CONFIGS) as MetadataType[];

// Icons for metadata types
const METADATA_ICONS: Record<MetadataType, React.ComponentType<any>> = {
  role: User,
  context: MessageSquare,
  goal: Target,
  audience: Users,
  format: Type,
  example: Layout
};

// Block type icons
const BLOCK_ICONS: Record<BlockType, React.ComponentType<any>> = {
  content: FileText,
  context: MessageSquare,
  role: User,
  example: Layout,
  format: Type,
  audience: Users
};

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  blocks,
  metadata = DEFAULT_METADATA,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onMoveBlock,
  onUpdateMetadata,
  isProcessing
}) => {
  const [availableBlocks, setAvailableBlocks] = useState<Record<MetadataType, Block[]>>({} as Record<MetadataType, Block[]>);
  const [customValues, setCustomValues] = useState<Record<MetadataType, string>>({} as Record<MetadataType, string>);
  const [expandedMetadata, setExpandedMetadata] = useState<MetadataType | null>(null);
  const [showSecondaryMetadata, setShowSecondaryMetadata] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeSecondaryMetadata, setActiveSecondaryMetadata] = useState<Set<MetadataType>>(new Set());

  // Load available blocks for each metadata type
  useEffect(() => {
    const fetchBlocks = async () => {
      const result: Record<MetadataType, Block[]> = {} as any;
      await Promise.all(
        ALL_METADATA_TYPES.map(async (type) => {
          const config = METADATA_CONFIGS[type];
          if (config) {
            const res = await blocksApi.getBlocksByType(config.blockType);
            result[type] = res.success ? res.data : [];
          }
        })
      );
      setAvailableBlocks(result);
    };
    fetchBlocks();
  }, []);

  const handleMetadataChange = (type: MetadataType, value: string) => {
    if (!onUpdateMetadata) return;
    
    if (value === 'custom') {
      onUpdateMetadata({ ...metadata, [type]: 0 });
      setExpandedMetadata(type);
    } else {
      onUpdateMetadata({ ...metadata, [type]: Number(value) });
      setExpandedMetadata(null);
    }
  };

  const handleCustomChange = (type: MetadataType, value: string) => {
    setCustomValues((prev) => ({ ...prev, [type]: value }));
  };

  const getBlockContent = (blockId: number, type: MetadataType): string => {
    const block = availableBlocks[type]?.find((b) => b.id === blockId);
    if (!block) return '';
    if (typeof block.content === 'string') return block.content;
    const lang = getCurrentLanguage();
    return block.content[lang] || block.content.en || '';
  };

  const addSecondaryMetadata = (type: MetadataType) => {
    setActiveSecondaryMetadata(prev => new Set([...prev, type]));
    if (!onUpdateMetadata) return;
    onUpdateMetadata({ ...metadata, [type]: 0 });
  };

  const removeSecondaryMetadata = (type: MetadataType) => {
    setActiveSecondaryMetadata(prev => {
      const newSet = new Set(prev);
      newSet.delete(type);
      return newSet;
    });
    if (!onUpdateMetadata) return;
    const newMetadata = { ...metadata };
    delete newMetadata[type];
    onUpdateMetadata(newMetadata);
  };

  // Generate final content for preview
  const generatePreviewContent = () => {
    const parts: string[] = [];
    
    // Add metadata content
    ALL_METADATA_TYPES.forEach((type) => {
      const id = metadata[type];
      const custom = customValues[type];
      if (id && id !== 0) {
        const content = getBlockContent(id, type);
        if (content) parts.push(content);
      } else if (custom) {
        parts.push(custom);
      }
    });
    
    // Add block content
    blocks.forEach((block) => {
      const content = typeof block.content === 'string' 
        ? block.content 
        : block.content[getCurrentLanguage()] || block.content.en || '';
      if (content) parts.push(content);
    });
    
    return parts.filter(Boolean).join('\n\n');
  };

  const MetadataCard: React.FC<{ 
    type: MetadataType; 
    isPrimary?: boolean; 
    onRemove?: () => void 
  }> = ({ type, isPrimary = false, onRemove }) => {
    const config = METADATA_CONFIGS[type];
    const Icon = METADATA_ICONS[type];
    const isExpanded = expandedMetadata === type;
    const selectedId = metadata[type] || 0;
    const customValue = customValues[type] || '';
    
    return (
      <Card 
        className={cn(
          "jd-transition-all jd-duration-200 jd-cursor-pointer hover:jd-shadow-md",
          isPrimary ? "jd-border-2 jd-border-primary/20" : "jd-border jd-border-muted",
          isExpanded && "jd-ring-2 jd-ring-primary/50 jd-shadow-lg"
        )}
      >
        <CardContent className="jd-p-4">
          <div className="jd-flex jd-items-center jd-justify-between jd-mb-2">
            <div className="jd-flex jd-items-center jd-gap-2">
              <Icon className={cn("jd-h-4 jd-w-4", isPrimary ? "jd-text-primary" : "jd-text-muted-foreground")} />
              <span className={cn("jd-font-medium", isPrimary ? "jd-text-primary" : "jd-text-foreground")}>
                {config.emoji} {config.label}
              </span>
            </div>
            <div className="jd-flex jd-items-center jd-gap-1">
              {!isPrimary && onRemove && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground jd-hover:jd-text-destructive"
                >
                  <Trash2 className="jd-h-3 jd-w-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpandedMetadata(isExpanded ? null : type)}
                className="jd-h-6 jd-w-6 jd-p-0"
              >
                {isExpanded ? <ChevronUp className="jd-h-3 jd-w-3" /> : <ChevronDown className="jd-h-3 jd-w-3" />}
              </Button>
            </div>
          </div>
          
          {isExpanded ? (
            <div className="jd-space-y-3">
              <Select 
                value={selectedId ? String(selectedId) : '0'} 
                onValueChange={(v) => handleMetadataChange(type, v)}
              >
                <SelectTrigger className="jd-w-full">
                  <SelectValue placeholder="Select or create custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  {availableBlocks[type]?.map((block) => (
                    <SelectItem key={block.id} value={String(block.id)}>
                      <div className="jd-flex jd-items-center jd-gap-2">
                        <span className="jd-font-medium jd-truncate jd-max-w-32">
                          {block.name || `${type} block`}
                        </span>
                        <span className="jd-text-xs jd-text-muted-foreground jd-truncate jd-max-w-48">
                          {typeof block.content === 'string'
                            ? block.content.substring(0, 40) + '...'
                            : (block.content[getCurrentLanguage()] || '').substring(0, 40) + '...'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <div className="jd-flex jd-items-center jd-gap-2">
                      <Plus className="jd-h-3 jd-w-3" />
                      Create custom {type}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {(!selectedId || selectedId === 0) && (
                <Textarea
                  value={customValue}
                  onChange={(e) => handleCustomChange(type, e.target.value)}
                  placeholder={`Enter custom ${type} content...`}
                  rows={3}
                  className="resize-none"
                />
              )}
            </div>
          ) : (
            <div className="jd-text-sm jd-text-muted-foreground">
              {selectedId && selectedId !== 0 
                ? availableBlocks[type]?.find(b => b.id === selectedId)?.name || `${type} block`
                : customValue 
                  ? customValue.substring(0, 50) + (customValue.length > 50 ? '...' : '')
                  : `Click to set ${type}`
              }
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const BlockCard: React.FC<{ block: Block; index: number }> = ({ block, index }) => {
    const Icon = BLOCK_ICONS[block.type];
    const content = typeof block.content === 'string' 
      ? block.content 
      : block.content[getCurrentLanguage()] || block.content.en || '';
    
    return (
      <Card className="jd-transition-all jd-duration-200 jd-hover:jd-shadow-md">
        <CardContent className="jd-p-4">
          <div className="jd-flex jd-items-center jd-justify-between jd-mb-2">
            <div className="jd-flex jd-items-center jd-gap-2">
              <Icon className="jd-h-4 jd-w-4 jd-text-muted-foreground" />
              <span className="jd-font-medium">{block.name || `${block.type} Block`}</span>
              <Badge variant="outline" className="jd-text-xs">
                {block.type}
              </Badge>
            </div>
            <div className="jd-flex jd-items-center jd-gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMoveBlock(block.id, 'up')}
                disabled={index === 0}
                className="jd-h-6 jd-w-6 jd-p-0"
              >
                <ArrowUp className="jd-h-3 jd-w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMoveBlock(block.id, 'down')}
                disabled={index === blocks.length - 1}
                className="jd-h-6 jd-w-6 jd-p-0"
              >
                <ArrowDown className="jd-h-3 jd-w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveBlock(block.id)}
                className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground jd-hover:jd-text-destructive"
              >
                <Trash2 className="jd-h-3 jd-w-3" />
              </Button>
            </div>
          </div>
          
          <Textarea
            value={content}
            onChange={(e) => onUpdateBlock(block.id, { content: e.target.value })}
            className="jd-resize-none jd-min-h-[80px]"
            placeholder={`Enter ${block.type} content...`}
          />
        </CardContent>
      </Card>
    );
  };

  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="jd-h-full jd-flex jd-flex-col jd-space-y-6 jd-p-4">
      {/* Primary Metadata Row */}
      <div className="jd-space-y-4">
        <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
          🎯 Prompt Essentials
        </h3>
        <div className="jd-grid jd-grid-cols-3 jd-gap-4">
          {PRIMARY_METADATA.map((type) => (
            <MetadataCard key={type} type={type} isPrimary />
          ))}
        </div>
        
        {/* Add Secondary Metadata Button */}
        <div className="jd-flex jd-justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSecondaryMetadata(!showSecondaryMetadata)}
            className="jd-flex jd-items-center jd-gap-2"
          >
            <Plus className="jd-h-4 jd-w-4" />
            Add More Elements
          </Button>
        </div>
      </div>

      {/* Secondary Metadata Row */}
      {showSecondaryMetadata && (
        <div className="jd-space-y-4">
          <h4 className="jd-text-sm jd-font-medium jd-text-muted-foreground jd-flex jd-items-center jd-gap-2">
            ⚙️ Additional Elements
          </h4>
          
          {activeSecondaryMetadata.size > 0 && (
            <div className="jd-grid jd-grid-cols-2 jd-gap-3">
              {Array.from(activeSecondaryMetadata).map((type) => (
                <MetadataCard 
                  key={type} 
                  type={type} 
                  onRemove={() => removeSecondaryMetadata(type)}
                />
              ))}
            </div>
          )}
          
          <div className="jd-flex jd-flex-wrap jd-gap-2">
            {ALL_METADATA_TYPES
              .filter(type => !PRIMARY_METADATA.includes(type) && !activeSecondaryMetadata.has(type))
              .map((type) => {
                const config = METADATA_CONFIGS[type];
                return (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => addSecondaryMetadata(type)}
                    className="jd-flex jd-items-center jd-gap-1 jd-text-xs"
                  >
                    <Plus className="jd-h-3 jd-w-3" />
                    {config.emoji} {config.label}
                  </Button>
                );
              })}
          </div>
        </div>
      )}

      {/* Blocks Section */}
      <div className="jd-space-y-4 jd-flex-1">
        <div className="jd-flex jd-items-center jd-justify-between">
          <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
            📝 Content Blocks
          </h3>
          <Button
            onClick={() => onAddBlock('start', 'content')}
            size="sm"
            className="jd-flex jd-items-center jd-gap-2"
          >
            <Plus className="jd-h-4 jd-w-4" />
            Add Block Above
          </Button>
        </div>
        
        <div className="jd-space-y-3 jd-flex-1 jd-overflow-y-auto">
          {blocks.map((block, index) => (
            <div key={block.id}>
              <BlockCard block={block} index={index} />
              {index === blocks.length - 1 && (
                <div className="jd-flex jd-justify-center jd-mt-3">
                  <Button
                    onClick={() => onAddBlock('end', 'content')}
                    variant="outline"
                    size="sm"
                    className="jd-flex jd-items-center jd-gap-2"
                  >
                    <Plus className="jd-h-4 jd-w-4" />
                    Add Block Below
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          {blocks.length === 0 && (
            <div className="jd-text-center jd-py-8 jd-text-muted-foreground">
              <FileText className="jd-h-12 jd-w-12 jd-mx-auto jd-mb-2 jd-text-muted-foreground/50" />
              <p>No content blocks yet</p>
              <Button
                onClick={() => onAddBlock('end', 'content')}
                size="sm"
                className="jd-mt-2"
              >
                <Plus className="jd-h-4 jd-w-4 jd-mr-2" />
                Add Your First Block
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Button */}
      <div className="jd-border-t jd-pt-4">
        <Button
          onClick={() => setShowPreview(!showPreview)}
          variant={showPreview ? "default" : "outline"}
          className="jd-w-full jd-flex jd-items-center jd-justify-center jd-gap-2"
        >
          <Eye className="jd-h-4 jd-w-4" />
          {showPreview ? 'Hide Preview' : 'Preview Full Prompt'}
        </Button>
        
        {showPreview && (
          <Card className="jd-mt-4">
            <CardContent className="jd-p-4">
              <h4 className="jd-font-medium jd-mb-2">🔍 Preview</h4>
              <div className="jd-bg-muted/50 jd-rounded-lg jd-p-4 jd-max-h-60 jd-overflow-y-auto">
                <pre className="jd-whitespace-pre-wrap jd-text-sm jd-font-mono">
                  {generatePreviewContent() || "Your prompt will appear here..."}
                </pre>
              </div>
              <div className="jd-flex jd-justify-between jd-items-center jd-mt-2 jd-text-xs jd-text-muted-foreground">
                <span>{generatePreviewContent().length} characters</span>
                <span>{generatePreviewContent().split('\n').length} lines</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};