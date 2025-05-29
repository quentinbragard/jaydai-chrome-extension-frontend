// src/components/dialogs/prompts/editors/AdvancedEditor.tsx
import React, { useState, useEffect } from 'react';
import { Block, BlockType } from '@/types/prompts/blocks';
import { PromptMetadata, DEFAULT_METADATA, METADATA_CONFIGS, MetadataType } from '@/types/prompts/metadata';
import { blocksApi } from '@/services/api/BlocksApi';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { formatMetadataForPreview, formatBlockForPreview } from '@/components/prompts/promptUtils';
import { highlightPlaceholders } from '@/utils/templates/placeholderUtils';
import { Button } from '@/components/ui/button';
import { MetadataCard } from '@/components/prompts/blocks/MetadataCard';
import { BlockCard } from '@/components/prompts/blocks/BlockCard';
import { PreviewSection } from '@/components/prompts/PreviewSection';
import { Plus, FileText, User, MessageSquare, Target, Users, Type, Layout, Sparkles, Wand2, Palette } from 'lucide-react';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { cn } from '@/core/utils/classNames';
import { buildPromptPartHtml } from '../../../prompts/blocks/blockUtils';

interface AdvancedEditorProps {
  blocks: Block[];
  metadata?: PromptMetadata;
  onAddBlock: (position: 'start' | 'end', blockType?: BlockType | null, existingBlock?: Block) => void;
  onRemoveBlock: (blockId: number) => void;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onReorderBlocks: (blocks: Block[]) => void;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
  isProcessing: boolean;
}

// Primary metadata elements that appear on the first row
const PRIMARY_METADATA: MetadataType[] = ['role', 'context', 'goal'];

// Secondary metadata elements available for additional configuration
const SECONDARY_METADATA: MetadataType[] = ['audience', 'tone_style', 'output_format', 'format', 'example'];

// All available metadata types for the secondary row
const ALL_METADATA_TYPES: MetadataType[] = Object.keys(METADATA_CONFIGS) as MetadataType[];

const METADATA_ICONS: Record<MetadataType, React.ComponentType<any>> = {
  role: User,
  context: MessageSquare,
  goal: Target,
  audience: Users,
  format: Type,
  example: Layout,
  output_format: Type,
  tone_style: Palette
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
  const [availableBlocks, setAvailableBlocks] = useState<Record<MetadataType, Block[]>>({} as Record<MetadataType, Block[]>);
  const [customValues, setCustomValues] = useState<Record<MetadataType, string>>(
    (metadata.values || {}) as Record<MetadataType, string>
  );
  const [customNames, setCustomNames] = useState<Record<MetadataType, string>>({} as Record<MetadataType, string>);
  const [expandedMetadata, setExpandedMetadata] = useState<MetadataType | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [activeSecondaryMetadata, setActiveSecondaryMetadata] = useState<Set<MetadataType>>(new Set());
  const [draggedBlockId, setDraggedBlockId] = useState<number | null>(null);

  const isDarkMode = useThemeDetector();

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
    };
    fetchBlocks();
  }, []);

  const handleMetadataChange = (type: MetadataType, value: string) => {
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

  const handleCustomChange = (type: MetadataType, value: string) => {
    setCustomValues((prev) => ({ ...prev, [type]: value }));
    if (!onUpdateMetadata) return;
    const newValues = { ...(metadata.values || {}), [type]: value };
    const newMetadata = { ...metadata, [type]: 0, values: newValues };
    onUpdateMetadata(newMetadata);
  };

  const handleCustomNameChange = (type: MetadataType, value: string) => {
    setCustomNames(prev => ({ ...prev, [type]: value }));
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
    const newMetadata = {
      ...metadata,
      [type]: 0,
      values: { ...(metadata.values || {}), [type]: '' }
    };
    onUpdateMetadata(newMetadata);
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
    const newValues = { ...(metadata.values || {}) };
    delete newValues[type];
    newMetadata.values = newValues;
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
    // Update block id and mark as saved
    onUpdateBlock(tempId, { id: saved.id, isNew: false });

    Object.entries(METADATA_CONFIGS).forEach(([metaType, cfg]) => {
      if (cfg.blockType === saved.type) {
        setAvailableBlocks(prev => ({
          ...prev,
          [metaType as MetadataType]: [saved, ...(prev[metaType as MetadataType] || [])]
        }));
      }
    });
  };

  const handleMetadataBlockSaved = (saved: Block) => {
    Object.entries(METADATA_CONFIGS).forEach(([metaType, cfg]) => {
      if (cfg.blockType === saved.type) {
        setAvailableBlocks(prev => ({
          ...prev,
          [metaType as MetadataType]: [saved, ...(prev[metaType as MetadataType] || [])]
        }));
      }
    });
  };

  // Generate final content for preview
  const generatePreviewContent = () => {
    const parts: string[] = [];

    // Add metadata content
    ALL_METADATA_TYPES.forEach((type) => {
      const value = metadata.values?.[type];
      if (value) {
        parts.push(formatMetadataForPreview(type, value));
      }
    });

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

    ALL_METADATA_TYPES.forEach((type) => {
      const value = metadata.values?.[type];
      if (value) {
        const blockType = METADATA_CONFIGS[type].blockType;
        parts.push(buildPromptPartHtml(blockType, value));
      }
    });

    blocks.forEach((block) => {
      const content = typeof block.content === 'string'
        ? block.content
        : block.content[getCurrentLanguage()] || block.content.en || '';
      if (content) parts.push(buildPromptPartHtml(block.type, content));
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

  return (
    <div
      className={cn(
        'jd-h-full jd-flex jd-flex-col jd-space-y-6 jd-p-6 jd-relative jd-overflow-hidden',
        // Enhanced gradient background with animated mesh
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
      <div className="jd-relative jd-z-10">
        {/* Primary Metadata Row */}
        <div className="jd-space-y-4">
          <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
            <div className={cn(
              'jd-p-2 jd-rounded-lg',
              isDarkMode ? 'jd-bg-purple-800/30 jd-text-purple-400' : 'jd-bg-purple-100 jd-text-purple-700'
            )}>
              <Sparkles className="jd-h-5 jd-w-5" />
            </div>
            Prompt Essentials
          </h3>
          <div className="jd-grid jd-grid-cols-3 jd-gap-4">
            {PRIMARY_METADATA.map((type) => (
              <div key={type} className="jd-transform jd-transition-all jd-duration-300 hover:jd-scale-105">
                <MetadataCard
                  type={type}
                  icon={METADATA_ICONS[type]}
                  availableBlocks={availableBlocks[type] || []}
                  expanded={expandedMetadata === type}
                  selectedId={metadata[type] || 0}
                  customValue={customValues[type] || ''}
                  customName={customNames[type] || ''}
                  isPrimary
                  onSelect={(v) => handleMetadataChange(type, v)}
                  onCustomChange={(v) => handleCustomChange(type, v)}
                  onCustomNameChange={(v) => handleCustomNameChange(type, v)}
                  onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
                  onSaveBlock={handleMetadataBlockSaved}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Metadata Row */}
        <div className="jd-space-y-4">
          <h4 className="jd-text-sm jd-font-medium jd-text-muted-foreground jd-flex jd-items-center jd-gap-2">
            <div className={cn(
              'jd-p-1.5 jd-rounded-lg',
              isDarkMode ? 'jd-bg-indigo-800/30 jd-text-indigo-400' : 'jd-bg-indigo-100 jd-text-indigo-700'
            )}>
              <Layout className="jd-h-4 jd-w-4" />
            </div>
            Additional Elements
          </h4>
          
          {activeSecondaryMetadata.size > 0 && (
            <div className="jd-grid jd-grid-cols-2 jd-gap-3">
              {Array.from(activeSecondaryMetadata).map((type) => (
                <div key={type} className="jd-transform jd-transition-all jd-duration-300 hover:jd-scale-105">
                  <MetadataCard
                    type={type}
                    icon={METADATA_ICONS[type]}
                    availableBlocks={availableBlocks[type] || []}
                    expanded={expandedMetadata === type}
                    selectedId={metadata[type] || 0}
                    customValue={customValues[type] || ''}
                    customName={customNames[type] || ''}
                    onSelect={(v) => handleMetadataChange(type, v)}
                    onCustomChange={(v) => handleCustomChange(type, v)}
                    onCustomNameChange={(v) => handleCustomNameChange(type, v)}
                    onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
                    onRemove={() => removeSecondaryMetadata(type)}
                    onSaveBlock={handleMetadataBlockSaved}
                  />
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
        </div>

        {/* Blocks Section */}
        <div className="jd-space-y-4 jd-flex-1">
          <div className="jd-flex jd-items-center jd-justify-between">
            <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
              <div className={cn(
                'jd-p-2 jd-rounded-lg',
                isDarkMode ? 'jd-bg-blue-800/30 jd-text-blue-400' : 'jd-bg-blue-100 jd-text-blue-700'
              )}>
                <FileText className="jd-h-5 jd-w-5" />
              </div>
              Content Blocks
            </h3>
          </div>
          
          <div className="jd-space-y-3 jd-flex-1 jd-overflow-y-auto jd-max-h-[400px] jd-pr-2">
            {blocks.map((block, index) => (
              <div key={block.id} className="jd-animate-in jd-slide-in-from-bottom-2 jd-duration-300">
                <BlockCard
                  block={block}
                  onRemove={onRemoveBlock}
                  onUpdate={onUpdateBlock}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onSave={(saved) => handleBlockSaved(block.id, saved)}
                />
                {index === blocks.length - 1 && (
                  <div className="jd-flex jd-justify-center jd-mt-3">
                    <Button
                      onClick={() => onAddBlock('end')}
                      variant="outline"
                      size="sm"
                      className={cn(
                        'jd-flex jd-items-center jd-gap-2',
                        'jd-transition-all jd-duration-300',
                        'hover:jd-scale-105 hover:jd-shadow-md',
                        isDarkMode 
                          ? 'jd-bg-gray-800/50 hover:jd-bg-gray-700/50' 
                          : 'jd-bg-white/70 hover:jd-bg-white/90'
                      )}
                    >
                      <Plus className="jd-h-4 jd-w-4" />
                      Add Block
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {blocks.length === 0 && (
              <div className={cn(
                'jd-text-center jd-py-12 jd-rounded-lg jd-border-2 jd-border-dashed',
                'jd-transition-all jd-duration-300',
                isDarkMode 
                  ? 'jd-bg-gray-800/30 jd-border-gray-700' 
                  : 'jd-bg-white/50 jd-border-gray-300'
              )}>
                <div className={cn(
                  'jd-p-4 jd-rounded-full jd-inline-flex jd-mb-4',
                  isDarkMode ? 'jd-bg-gray-700/50' : 'jd-bg-gray-100'
                )}>
                  <Wand2 className="jd-h-12 jd-w-12 jd-text-muted-foreground" />
                </div>
                <p className="jd-text-muted-foreground jd-mb-4">No content blocks yet</p>
                <Button
                  onClick={() => onAddBlock('end')}
                  variant="outline"
                  size="sm"
                  className="jd-transition-all jd-duration-300 hover:jd-scale-105"
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
          htmlContent={generatePreviewHtml()}
          expanded={previewExpanded}
          onToggle={() => setPreviewExpanded(!previewExpanded)}
          isHtml
        />
      </div>
    </div>
  );
};