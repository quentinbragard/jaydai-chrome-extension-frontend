// src/components/dialogs/templates/editor/AdvancedEditor.tsx
import React, { useState, useEffect } from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { PromptMetadata, DEFAULT_METADATA, METADATA_CONFIGS, MetadataType } from '@/components/templates/metadata/types';
import { blocksApi } from '@/services/api/BlocksApi';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { Button } from '@/components/ui/button';
import { MetadataCard } from './components/MetadataCard';
import { BlockCard } from './components/BlockCard';
import { PreviewSection } from './components/PreviewSection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, User, MessageSquare, Target, Users, Type, Layout } from 'lucide-react';

interface AdvancedEditorProps {
  blocks: Block[];
  metadata?: PromptMetadata;
  onAddBlock: (position: 'start' | 'end', blockType: BlockType, existingBlock?: Block) => void;
  onRemoveBlock: (blockId: number) => void;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onMoveBlock: (blockId: number, direction: 'up' | 'down') => void;
  onReorderBlocks: (blocks: Block[]) => void;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
  isProcessing: boolean;
}

// Primary metadata elements that appear on the first row
const PRIMARY_METADATA: MetadataType[] = ['role', 'context', 'goal'];

// All available metadata types for the secondary row
const ALL_METADATA_TYPES: MetadataType[] = Object.keys(METADATA_CONFIGS) as MetadataType[];

const METADATA_ICONS: Record<MetadataType, React.ComponentType<any>> = {
  role: User,
  context: MessageSquare,
  goal: Target,
  audience: Users,
  format: Type,
  example: Layout
};

// Available block types for adding new blocks
const BLOCK_TYPES: BlockType[] = ['content', 'context', 'role', 'example', 'format', 'audience'];

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  content: 'Content',
  context: 'Context',
  role: 'Role',
  example: 'Example',
  format: 'Format',
  audience: 'Audience'
};

const BLOCK_TYPE_ICONS: Record<BlockType, React.ComponentType<any>> = {
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
  onReorderBlocks,
  onUpdateMetadata,
  isProcessing
}) => {
  const [availableBlocks, setAvailableBlocks] = useState<Record<MetadataType, Block[]>>({} as Record<MetadataType, Block[]>);
  const [customValues, setCustomValues] = useState<Record<MetadataType, string>>({} as Record<MetadataType, string>);
  const [expandedMetadata, setExpandedMetadata] = useState<MetadataType | null>(null);
  const [showSecondaryMetadata, setShowSecondaryMetadata] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [activeSecondaryMetadata, setActiveSecondaryMetadata] = useState<Set<MetadataType>>(new Set());
  const [showAddBlockDropdown, setShowAddBlockDropdown] = useState(false);
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType | null>(null);
  const [availableBlocksByType, setAvailableBlocksByType] = useState<Record<BlockType, Block[]>>({} as Record<BlockType, Block[]>);
  const [draggedBlockId, setDraggedBlockId] = useState<number | null>(null);

  // Load available blocks for each metadata type and block type
  useEffect(() => {
    const fetchBlocks = async () => {
      // Fetch blocks for metadata types
      const metadataBlocks: Record<MetadataType, Block[]> = {} as any;
      await Promise.all(
        ALL_METADATA_TYPES.map(async (type) => {
          const config = METADATA_CONFIGS[type];
          if (config) {
            const res = await blocksApi.getBlocksByType(config.blockType);
            metadataBlocks[type] = res.success ? res.data : [];
          }
        })
      );
      setAvailableBlocks(metadataBlocks);

      // Fetch blocks for each block type
      const blocksByType: Record<BlockType, Block[]> = {} as any;
      await Promise.all(
        BLOCK_TYPES.map(async (blockType) => {
          const res = await blocksApi.getBlocksByType(blockType);
          blocksByType[blockType] = res.success ? res.data : [];
        })
      );
      setAvailableBlocksByType(blocksByType);
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

  const handleAddBlockFromDropdown = (blockType: BlockType, existingBlock?: Block) => {
    onAddBlock('end', blockType, existingBlock);
    setShowAddBlockDropdown(false);
    setSelectedBlockType(null);
  };

  const handleDragStart = (id: number) => {
    setDraggedBlockId(id);
  };

  const handleDragOver = (id: number) => {
    if (draggedBlockId === null || draggedBlockId === id) return;
    const draggedIndex = blocks.findIndex(b => b.id === draggedBlockId);
    const overIndex = blocks.findIndex(b => b.id === id);
    if (draggedIndex === -1 || overIndex === -1) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(overIndex, 0, moved);
    onReorderBlocks(newBlocks);
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
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

  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="jd-h-full jd-flex jd-flex-col jd-space-y-6 jd-p-4 jd-bg-gradient-to-br jd-from-slate-50 jd-to-slate-100 dark:jd-from-gray-800/60 dark:jd-to-gray-900/60">
      {/* Primary Metadata Row */}
      <div className="jd-space-y-4">
        <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
          <Target className="jd-h-5 jd-w-5 jd-text-primary" />
          Prompt Essentials
        </h3>
        <div className="jd-grid jd-grid-cols-3 jd-gap-4">
          {PRIMARY_METADATA.map((type) => (
            <MetadataCard
              key={type}
              type={type}
              icon={METADATA_ICONS[type]}
              availableBlocks={availableBlocks[type] || []}
              expanded={expandedMetadata === type}
              selectedId={metadata[type] || 0}
              customValue={customValues[type] || ''}
              isPrimary
              onSelect={(v) => handleMetadataChange(type, v)}
              onCustomChange={(v) => handleCustomChange(type, v)}
              onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
            />
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
            <Layout className="jd-h-4 jd-w-4" />
            Additional Elements
          </h4>
          
          {activeSecondaryMetadata.size > 0 && (
            <div className="jd-grid jd-grid-cols-2 jd-gap-3">
              {Array.from(activeSecondaryMetadata).map((type) => (
                <MetadataCard
                  key={type}
                  type={type}
                  icon={METADATA_ICONS[type]}
                  availableBlocks={availableBlocks[type] || []}
                  expanded={expandedMetadata === type}
                  selectedId={metadata[type] || 0}
                  customValue={customValues[type] || ''}
                  onSelect={(v) => handleMetadataChange(type, v)}
                  onCustomChange={(v) => handleCustomChange(type, v)}
                  onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
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
                const Icon = METADATA_ICONS[type];
                return (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => addSecondaryMetadata(type)}
                    className="jd-flex jd-items-center jd-gap-1 jd-text-xs"
                  >
                    <Plus className="jd-h-3 jd-w-3" />
                    <Icon className="jd-h-3 jd-w-3" />
                    {config.label}
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
            <FileText className="jd-h-5 jd-w-5 jd-text-primary" />
            Content Blocks
          </h3>
          <div className="jd-flex jd-items-center jd-gap-2">
            <Button
              onClick={() => onAddBlock('start', 'content')}
              variant="outline"
              size="sm"
              className="jd-flex jd-items-center jd-gap-2"
            >
              <Plus className="jd-h-4 jd-w-4" />
              Add Block Above
            </Button>
          </div>
        </div>
        
        <div className="jd-space-y-3 jd-flex-1 jd-overflow-y-auto">
          {blocks.map((block, index) => (
            <div key={block.id}>
              <BlockCard
                block={block}
                index={index}
                total={blocks.length}
                onMove={onMoveBlock}
                onRemove={onRemoveBlock}
                onUpdate={onUpdateBlock}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              />
              {index === blocks.length - 1 && (
                <div className="jd-flex jd-justify-center jd-mt-3 jd-relative">
                  {!showAddBlockDropdown ? (
                    <Button
                      onClick={() => setShowAddBlockDropdown(true)}
                      variant="outline"
                      size="sm"
                      className="jd-flex jd-items-center jd-gap-2"
                    >
                      <Plus className="jd-h-4 jd-w-4" />
                      Add Block Below
                    </Button>
                  ) : (
                    <div className="jd-flex jd-flex-col jd-gap-2 jd-p-4 jd-border jd-rounded-lg jd-bg-white jd-shadow-lg jd-min-w-64">
                      <div className="jd-flex jd-items-center jd-justify-between">
                        <span className="jd-font-medium jd-text-sm">Add Block</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAddBlockDropdown(false);
                            setSelectedBlockType(null);
                          }}
                          className="jd-h-6 jd-w-6 jd-p-0"
                        >
                          ×
                        </Button>
                      </div>
                      
                      <Select
                        value={selectedBlockType || ''}
                        onValueChange={(value) => setSelectedBlockType(value as BlockType)}
                      >
                        <SelectTrigger className="jd-w-full">
                          <SelectValue placeholder="Select block type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOCK_TYPES.map((blockType) => {
                            const Icon = BLOCK_TYPE_ICONS[blockType];
                            return (
                              <SelectItem key={blockType} value={blockType}>
                                <div className="jd-flex jd-items-center jd-gap-2">
                                  <Icon className="jd-h-4 jd-w-4" />
                                  {BLOCK_TYPE_LABELS[blockType]}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      {selectedBlockType && (
                        <div className="jd-space-y-2">
                          <div className="jd-text-xs jd-text-muted-foreground">
                            Choose from existing blocks or create new:
                          </div>
                          
                          <Button
                            onClick={() => handleAddBlockFromDropdown(selectedBlockType)}
                            variant="outline"
                            size="sm"
                            className="jd-w-full jd-justify-start"
                          >
                            <Plus className="jd-h-3 jd-w-3 jd-mr-2" />
                            Create new {BLOCK_TYPE_LABELS[selectedBlockType].toLowerCase()} block
                          </Button>

                          {availableBlocksByType[selectedBlockType]?.length > 0 && (
                            <div className="jd-space-y-1">
                              <div className="jd-text-xs jd-text-muted-foreground">
                                Or use existing:
                              </div>
                              {availableBlocksByType[selectedBlockType].slice(0, 3).map((block) => (
                                <Button
                                  key={block.id}
                                  onClick={() => handleAddBlockFromDropdown(selectedBlockType, block)}
                                  variant="ghost"
                                  size="sm"
                                  className="jd-w-full jd-justify-start jd-text-left jd-h-auto jd-p-2"
                                >
                                  <div className="jd-flex jd-flex-col jd-items-start">
                                    <span className="jd-font-medium jd-text-xs">
                                      {block.name || `${selectedBlockType} block`}
                                    </span>
                                    <span className="jd-text-xs jd-text-muted-foreground jd-truncate jd-max-w-full">
                                      {typeof block.content === 'string' 
                                        ? block.content.substring(0, 40) + '...'
                                        : Object.values(block.content)[0]?.substring(0, 40) + '...' || ''
                                      }
                                    </span>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {blocks.length === 0 && (
            <div className="jd-text-center jd-py-8 jd-text-muted-foreground">
              <FileText className="jd-h-12 jd-w-12 jd-mx-auto jd-mb-2 jd-text-muted-foreground/50" />
              <p>No content blocks yet</p>
              <Button
                onClick={() => setShowAddBlockDropdown(true)}
                variant="outline"
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

      <PreviewSection
        content={generatePreviewContent()}
        expanded={previewExpanded}
        onToggle={() => setPreviewExpanded(!previewExpanded)}
      />
    </div>
  );
};