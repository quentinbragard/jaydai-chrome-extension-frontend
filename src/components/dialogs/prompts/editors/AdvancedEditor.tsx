// src/components/dialogs/prompts/editors/AdvancedEditor.tsx - Enhanced version with more content space
import React, { useState, useEffect } from 'react';
import { Block, BlockType } from '@/types/prompts/blocks';
import { 
  PromptMetadata, 
  DEFAULT_METADATA, 
  METADATA_CONFIGS, 
  MetadataType,
  SingleMetadataType,
  MultipleMetadataType,
  MetadataItem,
  PRIMARY_METADATA,
  SECONDARY_METADATA,
  isMultipleMetadataType,
  generateMetadataItemId
} from '@/types/prompts/metadata';
import { blocksApi } from '@/services/api/BlocksApi';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { formatMetadataForPreview, formatBlockForPreview } from '@/components/prompts/promptUtils';
import { highlightPlaceholders } from '@/utils/templates/placeholderUtils';
import { Button } from '@/components/ui/button';
import { MetadataCard } from '@/components/prompts/blocks/MetadataCard';
import { MultipleMetadataCard } from '@/components/prompts/blocks/MultipleMetadataCard';
import { BlockCard } from '@/components/prompts/blocks/BlockCard';
import { PreviewSection } from '@/components/prompts/PreviewSection';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FileText, User, MessageSquare, Target, Users, Type, Layout, Sparkles, Wand2, Palette, Ban, ChevronDown, ChevronUp } from 'lucide-react';
import { AddBlockButton } from '@/components/common/AddBlockButton';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { cn } from '@/core/utils/classNames';
import { buildPromptPartHtml, BLOCK_TYPES } from '../../../prompts/blocks/blockUtils';

interface AdvancedEditorProps {
  blocks: Block[];
  metadata?: PromptMetadata;
  onAddBlock: (
    position: 'start' | 'end',
    blockType?: BlockType | null,
    existingBlock?: Block,
    duplicate?: boolean
  ) => void;
  onRemoveBlock: (blockId: number) => void;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onReorderBlocks: (blocks: Block[]) => void;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
  isProcessing: boolean;
}

const METADATA_ICONS: Record<MetadataType, React.ComponentType<any>> = {
  role: User,
  context: MessageSquare,
  goal: Target,
  audience: Users,
  output_format: Type,
  example: Layout,
  tone_style: Palette,
  constraint: Ban
};

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  blocks,
  metadata = DEFAULT_METADATA,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onReorderBlocks,
  onUpdateMetadata,
  isProcessing
}) => {
  const [availableMetadataBlocks, setAvailableMetadataBlocks] = useState<Record<MetadataType, Block[]>>({} as Record<MetadataType, Block[]>);
  const [availableBlocksByType, setAvailableBlocksByType] = useState<Record<BlockType, Block[]>>({} as Record<BlockType, Block[]>);
  const [customValues, setCustomValues] = useState<Record<SingleMetadataType, string>>(
    (metadata.values || {}) as Record<SingleMetadataType, string>
  );
  const [expandedMetadata, setExpandedMetadata] = useState<MetadataType | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [activeSecondaryMetadata, setActiveSecondaryMetadata] = useState<Set<MetadataType>>(new Set());
  const [draggedBlockId, setDraggedBlockId] = useState<number | null>(null);
  
  // New state for collapsible sections
  const [metadataCollapsed, setMetadataCollapsed] = useState(false);
  const [secondaryMetadataCollapsed, setSecondaryMetadataCollapsed] = useState(false);

  const isDarkMode = useThemeDetector();

  // Load available blocks for each metadata type and block type
  useEffect(() => {
    const fetchBlocks = async () => {
      const blockMap: Record<BlockType, Block[]> = {} as any;
      await Promise.all(
        BLOCK_TYPES.map(async (bt) => {
          const res = await blocksApi.getBlocksByType(bt);
          blockMap[bt] = res.success ? res.data : [];
        })
      );

      const metadataBlocks: Record<MetadataType, Block[]> = {} as any;
      Object.keys(METADATA_CONFIGS).forEach((type) => {
        const metadataType = type as MetadataType;
        const bt = METADATA_CONFIGS[metadataType].blockType;
        metadataBlocks[metadataType] = blockMap[bt] || [];
      });

      setAvailableBlocksByType(blockMap);
      setAvailableMetadataBlocks(metadataBlocks);
    };
    fetchBlocks();
  }, []);

  // Initialize active secondary metadata based on existing metadata
  useEffect(() => {
    const activeTypes = new Set<MetadataType>();

    SECONDARY_METADATA.forEach(type => {
      if (isMultipleMetadataType(type)) {
        const items = metadata[type as MultipleMetadataType];
        if (items !== undefined) {
          activeTypes.add(type);
        }
      } else {
        const hasId = (metadata as any)[type] !== undefined;
        const hasValue = metadata.values && metadata.values[type as SingleMetadataType] !== undefined;
        if (hasId || hasValue) {
          activeTypes.add(type);
        }
      }
    });

    setActiveSecondaryMetadata(activeTypes);
  }, [metadata]);

  // Handle single metadata changes
  const handleSingleMetadataChange = (type: SingleMetadataType, value: string) => {
    if (!onUpdateMetadata) return;

    if (value === 'custom') {
      const newMetadata = {
        ...metadata,
        [type]: 0,
        values: { ...(metadata.values || {}), [type]: customValues[type] || '' }
      };
      onUpdateMetadata(newMetadata);
      setExpandedMetadata(type);
    } else {
      const id = Number(value);
      const content = getBlockContent(id, type);
      const newValues = { ...(metadata.values || {}) };
      if (content) newValues[type] = content; else delete newValues[type];
      const newMetadata = { ...metadata, [type]: id, values: newValues };
      onUpdateMetadata(newMetadata);
      setExpandedMetadata(null);
    }
  };

  const handleCustomChange = (type: SingleMetadataType, value: string) => {
    setCustomValues((prev) => ({ ...prev, [type]: value }));
    if (!onUpdateMetadata) return;
    const newValues = { ...(metadata.values || {}), [type]: value };
    const newMetadata = { ...metadata, [type]: 0, values: newValues };
    onUpdateMetadata(newMetadata);
  };

  // Handle multiple metadata changes
  const handleAddMetadataItem = (type: MultipleMetadataType) => {
    if (!onUpdateMetadata) return;
    
    const currentItems = metadata[type] || [];
    const newItem: MetadataItem = {
      id: generateMetadataItemId(),
      value: ''
    };
    
    const newMetadata = {
      ...metadata,
      [type]: [...currentItems, newItem]
    };
    onUpdateMetadata(newMetadata);
  };

  const handleRemoveMetadataItem = (type: MultipleMetadataType, itemId: string) => {
    if (!onUpdateMetadata) return;
    
    const currentItems = metadata[type] || [];
    const newItems = currentItems.filter(item => item.id !== itemId);
    
    const newMetadata = {
      ...metadata,
      [type]: newItems
    };
    onUpdateMetadata(newMetadata);
  };

  const handleUpdateMetadataItem = (type: MultipleMetadataType, itemId: string, updates: Partial<MetadataItem>) => {
    if (!onUpdateMetadata) return;
    
    const currentItems = metadata[type] || [];
    const newItems = currentItems.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    
    const newMetadata = {
      ...metadata,
      [type]: newItems
    };
    onUpdateMetadata(newMetadata);
  };

  const handleReorderMetadataItems = (type: MultipleMetadataType, newItems: MetadataItem[]) => {
    if (!onUpdateMetadata) return;
    
    const newMetadata = {
      ...metadata,
      [type]: newItems
    };
    onUpdateMetadata(newMetadata);
  };

  const getBlockContent = (blockId: number, type: MetadataType): string => {
    const block = availableMetadataBlocks[type]?.find((b) => b.id === blockId);
    if (!block) return '';
    if (typeof block.content === 'string') return block.content;
    const lang = getCurrentLanguage();
    return block.content[lang] || block.content.en || '';
  };

  const addSecondaryMetadata = (type: MetadataType) => {
    setActiveSecondaryMetadata(prev => new Set([...prev, type]));
    if (!onUpdateMetadata) return;
    
    if (isMultipleMetadataType(type)) {
      // Initialize with empty array for multiple metadata
      const newMetadata = {
        ...metadata,
        [type]: []
      };
      onUpdateMetadata(newMetadata);
    } else {
      // Initialize with default values for single metadata
      const newMetadata = {
        ...metadata,
        [type]: 0,
        values: { ...(metadata.values || {}), [type]: '' }
      };
      onUpdateMetadata(newMetadata);
    }
  };

  const removeSecondaryMetadata = (type: MetadataType) => {
    setActiveSecondaryMetadata(prev => {
      const newSet = new Set(prev);
      newSet.delete(type);
      return newSet;
    });
    if (!onUpdateMetadata) return;
    
    const newMetadata = { ...metadata };
    delete newMetadata[type as keyof PromptMetadata];
    
    if (!isMultipleMetadataType(type)) {
      const newValues = { ...(metadata.values || {}) };
      delete newValues[type as SingleMetadataType];
      newMetadata.values = newValues;
    }
    
    onUpdateMetadata(newMetadata);
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

  const handleBlockSaved = (tempId: number, saved: Block) => {
    onUpdateBlock(tempId, { id: saved.id, isNew: false });

    setAvailableBlocksByType(prev => ({
      ...prev,
      [saved.type]: [saved, ...(prev[saved.type] || [])]
    }));

    Object.entries(METADATA_CONFIGS).forEach(([metaType, cfg]) => {
      if (cfg.blockType === saved.type) {
        setAvailableMetadataBlocks(prev => ({
          ...prev,
          [metaType as MetadataType]: [saved, ...(prev[metaType as MetadataType] || [])]
        }));
      }
    });
  };

  const handleMetadataBlockSaved = (saved: Block) => {
    setAvailableBlocksByType(prev => ({
      ...prev,
      [saved.type]: [saved, ...(prev[saved.type] || [])]
    }));

    Object.entries(METADATA_CONFIGS).forEach(([metaType, cfg]) => {
      if (cfg.blockType === saved.type) {
        setAvailableMetadataBlocks(prev => ({
          ...prev,
          [metaType as MetadataType]: [saved, ...(prev[metaType as MetadataType] || [])]
        }));
      }
    });
  };

  // Generate final content for preview
  const generatePreviewContent = () => {
    const parts: string[] = [];

    // Add single metadata content
    PRIMARY_METADATA.forEach((type) => {
      const value = metadata.values?.[type];
      if (value) {
        parts.push(formatMetadataForPreview(type, value));
      }
    });

    // Add secondary single metadata
    SECONDARY_METADATA.forEach((type) => {
      if (!isMultipleMetadataType(type)) {
        const value = metadata.values?.[type as SingleMetadataType];
        if (value) {
          parts.push(formatMetadataForPreview(type as SingleMetadataType, value));
        }
      }
    });

    // Add multiple metadata content
    if (metadata.constraints) {
      metadata.constraints.forEach((constraint, index) => {
        if (constraint.value) {
          parts.push(formatMetadataForPreview('constraint' as any, `${index + 1}. ${constraint.value}`));
        }
      });
    }

    if (metadata.examples) {
      metadata.examples.forEach((example, index) => {
        if (example.value) {
          parts.push(formatMetadataForPreview('example' as any, `Example ${index + 1}: ${example.value}`));
        }
      });
    }

    // Add block content
    blocks.forEach((block) => {
      const formatted = formatBlockForPreview(block);
      if (formatted) parts.push(formatted);
    });

    const html = parts.filter(Boolean).join('<br><br>');
    return highlightPlaceholders(html);
  };

  const generatePreviewHtml = () => {
    const parts: string[] = [];

    // Add single metadata HTML
    PRIMARY_METADATA.forEach((type) => {
      const value = metadata.values?.[type];
      if (value) {
        const blockType = METADATA_CONFIGS[type].blockType;
        parts.push(buildPromptPartHtml(blockType, value, isDarkMode));
      }
    });

    // Add secondary single metadata HTML
    SECONDARY_METADATA.forEach((type) => {
      if (!isMultipleMetadataType(type)) {
        const value = metadata.values?.[type as SingleMetadataType];
        if (value) {
          const blockType = METADATA_CONFIGS[type].blockType;
          parts.push(buildPromptPartHtml(blockType, value, isDarkMode));
        }
      }
    });

    // Add constraints HTML
    if (metadata.constraints) {
      metadata.constraints.forEach((constraint, index) => {
        if (constraint.value) {
          parts.push(buildPromptPartHtml('constraint', `${index + 1}. ${constraint.value}`, isDarkMode));
        }
      });
    }

    // Add examples HTML
    if (metadata.examples) {
      metadata.examples.forEach((example, index) => {
        if (example.value) {
          parts.push(buildPromptPartHtml('example', `Example ${index + 1}: ${example.value}`, isDarkMode));
        }
      });
    }

    // Add blocks HTML
    blocks.forEach((block) => {
      const content = typeof block.content === 'string'
        ? block.content
        : block.content[getCurrentLanguage()] || block.content.en || '';
      if (content) parts.push(buildPromptPartHtml(block.type, content, isDarkMode));
    });

    return parts.filter(Boolean).join('<br><br>');
  };

  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full"></div>
      </div>
    );
  }

  const contentBlock = blocks[0];
  const otherBlocks = blocks.slice(1);

  return (
    <div
      className={cn(
        'jd-h-full jd-flex jd-flex-col jd-relative jd-overflow-hidden jd-space-y-4',
        isDarkMode
          ? 'jd-bg-gradient-to-br jd-from-gray-900 jd-via-gray-800 jd-to-gray-900'
          : 'jd-bg-gradient-to-br jd-from-slate-50 jd-via-white jd-to-slate-100'
      )}
    >
      {/* Animated background mesh */}
      <div className="jd-absolute jd-inset-0 jd-opacity-10">
        <div className={cn(
          'jd-absolute jd-inset-0',
          isDarkMode
            ? 'jd-bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] jd-from-purple-900 jd-via-transparent jd-to-transparent'
            : 'jd-bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] jd-from-purple-200 jd-via-transparent jd-to-transparent'
        )}></div>
        <div className={cn(
          'jd-absolute jd-inset-0',
          isDarkMode
            ? 'jd-bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] jd-from-blue-900 jd-via-transparent jd-to-transparent'
            : 'jd-bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] jd-from-blue-200 jd-via-transparent jd-to-transparent'
        )}></div>
      </div>

      {/* Content wrapper with backdrop blur */}
      <div className="jd-relative jd-z-10 jd-flex-1 jd-flex jd-flex-col jd-space-y-4 jd-p-6 jd-overflow-hidden">
        
        {/* Primary Metadata Row - Collapsible */}
        <div className="jd-flex-shrink-0">
          <div className="jd-flex jd-items-center jd-justify-between jd-mb-3">
            <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
              Prompt Essentials
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMetadataCollapsed(!metadataCollapsed)}
              className="jd-h-6 jd-w-6 jd-p-0"
            >
              {metadataCollapsed ? <ChevronDown className="jd-h-4 jd-w-4" /> : <ChevronUp className="jd-h-4 jd-w-4" />}
            </Button>
          </div>
          
          {!metadataCollapsed && (
            <div className="jd-grid jd-grid-cols-3 jd-gap-4">
              {PRIMARY_METADATA.map((type) => (
                <div key={type} className="jd-transform jd-transition-all jd-duration-300 hover:jd-scale-105">
                  <MetadataCard
                    type={type}
                    icon={METADATA_ICONS[type]}
                    availableBlocks={availableMetadataBlocks[type] || []}
                    expanded={expandedMetadata === type}
                    selectedId={metadata[type] || 0}
                    customValue={customValues[type] || ''}
                    isPrimary
                    onSelect={(v) => handleSingleMetadataChange(type, v)}
                    onCustomChange={(v) => handleCustomChange(type, v)}
                    onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
                    onSaveBlock={handleMetadataBlockSaved}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Secondary Metadata Row - Collapsible */}
        <div className="jd-flex-shrink-0">
          <div className="jd-flex jd-items-center jd-justify-between jd-mb-3">
            <h4 className="jd-text-sm jd-font-medium jd-text-muted-foreground jd-flex jd-items-center jd-gap-2">
              Additional Elements
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSecondaryMetadataCollapsed(!secondaryMetadataCollapsed)}
              className="jd-h-6 jd-w-6 jd-p-0"
            >
              {secondaryMetadataCollapsed ? <ChevronDown className="jd-h-4 jd-w-4" /> : <ChevronUp className="jd-h-4 jd-w-4" />}
            </Button>
          </div>
          
          {!secondaryMetadataCollapsed && (
            <>
              {activeSecondaryMetadata.size > 0 && (
                <div className="jd-grid jd-grid-cols-2 jd-gap-3 jd-mb-3">
                  {Array.from(activeSecondaryMetadata).map((type) => (
                    <div key={type} className="jd-transform jd-transition-all jd-duration-300 hover:jd-scale-105">
                      {isMultipleMetadataType(type) ? (
                        <MultipleMetadataCard
                          type={type}
                          icon={METADATA_ICONS[type]}
                          availableBlocks={availableMetadataBlocks[type] || []}
                          items={metadata[type] || []}
                          expanded={expandedMetadata === type}
                          onAddItem={() => handleAddMetadataItem(type)}
                          onRemoveItem={(itemId) => handleRemoveMetadataItem(type, itemId)}
                          onUpdateItem={(itemId, updates) => handleUpdateMetadataItem(type, itemId, updates)}
                          onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
                          onRemove={() => removeSecondaryMetadata(type)}
                          onSaveBlock={handleMetadataBlockSaved}
                          onReorderItems={(newItems) => handleReorderMetadataItems(type, newItems)}
                        />
                      ) : (
                        <MetadataCard
                          type={type as SingleMetadataType}
                          icon={METADATA_ICONS[type]}
                          availableBlocks={availableMetadataBlocks[type] || []}
                          expanded={expandedMetadata === type}
                          selectedId={metadata[type as SingleMetadataType] || 0}
                          customValue={customValues[type as SingleMetadataType] || ''}
                          onSelect={(v) => handleSingleMetadataChange(type as SingleMetadataType, v)}
                          onCustomChange={(v) => handleCustomChange(type as SingleMetadataType, v)}
                          onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
                          onRemove={() => removeSecondaryMetadata(type)}
                          onSaveBlock={handleMetadataBlockSaved}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="jd-flex jd-flex-wrap jd-gap-2">
                {SECONDARY_METADATA
                  .filter(type => !activeSecondaryMetadata.has(type))
                  .map((type) => {
                    const config = METADATA_CONFIGS[type];
                    const Icon = METADATA_ICONS[type];
                    return (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        onClick={() => addSecondaryMetadata(type)}
                        className={cn(
                          'jd-flex jd-items-center jd-gap-1 jd-text-xs',
                          'jd-transition-all jd-duration-300',
                          'hover:jd-scale-105 hover:jd-shadow-md',
                          isDarkMode 
                            ? 'jd-bg-gray-800/50 hover:jd-bg-gray-700/50' 
                            : 'jd-bg-white/70 hover:jd-bg-white/90'
                        )}
                      >
                        <Plus className="jd-h-3 jd-w-3" />
                        <Icon className="jd-h-3 jd-w-3" />
                        {config.label}
                      </Button>
                    );
                  })}
              </div>
            </>
          )}
        </div>

        {/* Prompt Content Section - Now takes more space */}
        <div className="jd-flex-1 jd-flex jd-flex-col jd-min-h-0 jd-border-t jd-pt-4">
          <div className="jd-flex jd-items-center jd-justify-between jd-mb-4">
            <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
              Prompt Content
            </h3>
          </div>

          <div className="jd-flex-1 jd-flex jd-flex-col jd-min-h-0 jd-space-y-4">
            {contentBlock && (
              <div className="jd-flex-1 jd-flex jd-flex-col jd-min-h-0">
                <h4 className="jd-text-sm jd-font-medium jd-mb-2">Main Content</h4>
                <Textarea
                  value={typeof contentBlock.content === 'string' ? contentBlock.content : contentBlock.content[getCurrentLanguage()] || contentBlock.content.en || ''}
                  onChange={e => onUpdateBlock(contentBlock.id, { content: e.target.value })}
                  className="jd-flex-1 jd-min-h-[200px] jd-text-sm jd-resize-none"
                  placeholder="Enter main prompt content..."
                />
              </div>
            )}

            {otherBlocks.length > 0 && (
              <div className="jd-flex jd-flex-col jd-space-y-3 jd-max-h-[300px] jd-overflow-y-auto jd-pr-2">
                {otherBlocks.map((block, index) => (
                  <div key={block.id} className="jd-animate-in jd-slide-in-from-bottom-2 jd-duration-300">
                    <BlockCard
                      block={block}
                      availableBlocks={availableBlocksByType[block.type || 'content'] || []}
                      onRemove={onRemoveBlock}
                      onUpdate={onUpdateBlock}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onSave={(saved) => handleBlockSaved(block.id, saved)}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="jd-flex jd-justify-center jd-py-2">
              <AddBlockButton
                availableBlocks={availableBlocksByType}
                onAdd={(type, existing, duplicate) =>
                  onAddBlock('end', type, existing, duplicate)
                }
              />
            </div>
          </div>
        </div>

        {/* Preview Section - More compact */}
        <div className="jd-flex-shrink-0">
          <PreviewSection
            content={generatePreviewContent()}
            htmlContent={generatePreviewHtml()}
            expanded={previewExpanded}
            onToggle={() => setPreviewExpanded(!previewExpanded)}
            isHtml
          />
        </div>
      </div>
    </div>
  );
};