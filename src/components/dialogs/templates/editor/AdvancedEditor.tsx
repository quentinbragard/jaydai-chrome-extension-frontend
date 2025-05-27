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
import { Plus, FileText, User, MessageSquare, Target, Users, Type, Layout } from 'lucide-react';

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

const METADATA_ICONS: Record<MetadataType, React.ComponentType<any>> = {
  role: User,
  context: MessageSquare,
  goal: Target,
  audience: Users,
  format: Type,
  example: Layout
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
  const [previewExpanded, setPreviewExpanded] = useState(false);
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
          🎯 Prompt Essentials
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
            ⚙️ Additional Elements
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
            variant="outline"
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
              <BlockCard
                block={block}
                index={index}
                total={blocks.length}
                onMove={onMoveBlock}
                onRemove={onRemoveBlock}
                onUpdate={onUpdateBlock}
              />
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