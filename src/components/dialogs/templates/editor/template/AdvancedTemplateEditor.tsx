// src/components/dialogs/templates/editor/template/AdvancedTemplateEditor.tsx
import React, { useState } from 'react';
import { Block, BlockType } from '@/types/prompts/blocks';
import { PromptMetadata } from '@/types/prompts/metadata';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MetadataCard } from '../components/MetadataCard';
import { BlockCard } from '../components/BlockCard';
import { PreviewSection } from '../components/PreviewSection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getMessage } from '@/core/utils/i18n';
import { ALL_METADATA_TYPES, METADATA_CONFIGS } from '@/types/prompts/metadata';
import { User, MessageSquare, Target, Users, Type, Layout } from 'lucide-react';
import {
  formatMetadataForPreview,
  formatBlockForPreview,
} from '../../utils/promptUtils';
import { highlightPlaceholders } from '@/utils/templates/placeholderUtils';


const METADATA_ICONS: Record<string, React.ComponentType<any>> = {
  role: User,
  context: MessageSquare,  
  goal: Target,
  audience: Users,
  format: Type,
  example: Layout
};

// Primary metadata that appears by default
const PRIMARY_METADATA = ['role', 'context', 'goal'] as const;

interface AdvancedTemplateEditorProps {
  blocks: Block[];
  metadata: PromptMetadata;
  onAddBlock: (position: 'start' | 'end', blockType?: BlockType | null, existingBlock?: Block) => void;
  onRemoveBlock: (blockId: number) => void;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onReorderBlocks: (blocks: Block[]) => void;
  onUpdateMetadata: (metadata: PromptMetadata) => void;
  isProcessing: boolean;
}

/**
 * Advanced template editor with metadata and blocks
 * Simplified version for template creation
 */
export const AdvancedTemplateEditor: React.FC<AdvancedTemplateEditorProps> = ({
  blocks,
  metadata,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onReorderBlocks,
  onUpdateMetadata,
  isProcessing
}) => {
  const [expandedMetadata, setExpandedMetadata] = useState<string | null>(null);
  const [activeSecondaryMetadata, setActiveSecondaryMetadata] = useState<Set<string>>(new Set());
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<number | null>(null);

  // Handle metadata changes
  const handleMetadataChange = (type: string, value: string) => {
    if (!onUpdateMetadata) return;

    const newMetadata = { ...metadata };
    if (value === 'custom' || value === '0') {
      newMetadata[type] = 0;
      if (!newMetadata.values) newMetadata.values = {};
      newMetadata.values[type] = '';
    } else {
      newMetadata[type] = Number(value);
    }
    onUpdateMetadata(newMetadata);
  };

  const handleCustomMetadataChange = (type: string, value: string) => {
    if (!onUpdateMetadata) return;
    const newMetadata = { ...metadata };
    if (!newMetadata.values) newMetadata.values = {};
    newMetadata.values[type] = value;
    onUpdateMetadata(newMetadata);
  };

  // Add/remove secondary metadata
  const addSecondaryMetadata = (type: string) => {
    setActiveSecondaryMetadata(prev => new Set([...prev, type]));
    if (!onUpdateMetadata) return;
    const newMetadata = { ...metadata };
    newMetadata[type] = 0;
    if (!newMetadata.values) newMetadata.values = {};
    newMetadata.values[type] = '';
    onUpdateMetadata(newMetadata);
  };

  const removeSecondaryMetadata = (type: string) => {
    setActiveSecondaryMetadata(prev => {
      const newSet = new Set(prev);
      newSet.delete(type);
      return newSet;
    });
    if (!onUpdateMetadata) return;
    const newMetadata = { ...metadata };
    delete newMetadata[type];
    if (newMetadata.values) {
      delete newMetadata.values[type];
    }
    onUpdateMetadata(newMetadata);
  };

  // Block drag and drop
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

  // Generate preview content
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
      const content = getBlockContent(block);
      if (content) parts.push(buildPromptPartHtml(block.type, content));
    });

    return parts.filter(Boolean).join('<br><br>');
  };

  return (
    <div className="jd-h-full jd-flex jd-flex-col jd-gap-4">
      <ScrollArea className="jd-flex-1">
        <div className="jd-space-y-6 jd-pr-4">
          {/* Primary Metadata */}
          <div>
            <h3 className="jd-text-sm jd-font-semibold jd-mb-3 jd-flex jd-items-center jd-gap-2">
              <Target className="jd-h-4 jd-w-4" />
              {getMessage('promptEssentials', undefined, 'Prompt Essentials')}
            </h3>
            <div className="jd-grid jd-grid-cols-3 jd-gap-3">
              {PRIMARY_METADATA.map((type) => (
                <MetadataCard
                  key={type}
                  type={type}
                  icon={METADATA_ICONS[type]}
                  availableBlocks={[]} // In creation mode, we start with empty blocks
                  expanded={expandedMetadata === type}
                  selectedId={metadata[type] || 0}
                  customValue={metadata.values?.[type] || ''}
                  isPrimary
                  onSelect={(v) => handleMetadataChange(type, v)}
                  onCustomChange={(v) => handleCustomMetadataChange(type, v)}
                  onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
                />
              ))}
            </div>
          </div>

          {/* Secondary Metadata */}
          <div>
            <h4 className="jd-text-sm jd-font-medium jd-text-muted-foreground jd-mb-3 jd-flex jd-items-center jd-gap-2">
              <Layout className="jd-h-4 jd-w-4" />
              {getMessage('additionalElements', undefined, 'Additional Elements')}
            </h4>
            
            {activeSecondaryMetadata.size > 0 && (
              <div className="jd-grid jd-grid-cols-2 jd-gap-3 jd-mb-3">
                {Array.from(activeSecondaryMetadata).map((type) => (
                  <MetadataCard
                    key={type}
                    type={type}
                    icon={METADATA_ICONS[type]}
                    availableBlocks={[]}
                    expanded={expandedMetadata === type}
                    selectedId={metadata[type] || 0}
                    customValue={metadata.values?.[type] || ''}
                    onSelect={(v) => handleMetadataChange(type, v)}
                    onCustomChange={(v) => handleCustomMetadataChange(type, v)}
                    onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
                    onRemove={() => removeSecondaryMetadata(type)}
                  />
                ))}
              </div>
            )}
            
            <div className="jd-flex jd-flex-wrap jd-gap-2">
              {ALL_METADATA_TYPES
                .filter(type => !PRIMARY_METADATA.includes(type as any) && !activeSecondaryMetadata.has(type))
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

          {/* Content Blocks */}
          <div>
            <h3 className="jd-text-sm jd-font-semibold jd-mb-3">
              {getMessage('contentBlocks', undefined, 'Content Blocks')}
            </h3>
            
            <div className="jd-space-y-3">
              {blocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  onRemove={onRemoveBlock}
                  onUpdate={onUpdateBlock}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                />
              ))}
              
              {blocks.length === 0 && (
                <div className="jd-text-center jd-py-8 jd-border-2 jd-border-dashed jd-rounded-lg jd-text-muted-foreground">
                  <p className="jd-mb-2">{getMessage('noContentBlocks', undefined, 'No content blocks yet')}</p>
                  <Button
                    onClick={() => onAddBlock('end')}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="jd-h-4 jd-w-4 jd-mr-2" />
                    {getMessage('addFirstBlock', undefined, 'Add Your First Block')}
                  </Button>
                </div>
              )}
              
              {blocks.length > 0 && (
                <div className="jd-flex jd-justify-center">
                  <Button
                    onClick={() => onAddBlock('end')}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="jd-h-4 jd-w-4 jd-mr-2" />
                    {getMessage('addBlock', undefined, 'Add Block')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Preview */}
      <PreviewSection
        content={generatePreviewContent()}
        htmlContent={generatePreviewHtml()}
        expanded={previewExpanded}
        onToggle={() => setPreviewExpanded(!previewExpanded)}
        isHtml
      />
    </div>
  );
};