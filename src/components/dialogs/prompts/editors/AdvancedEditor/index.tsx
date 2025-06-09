// src/components/dialogs/prompts/editors/AdvancedEditor/index.tsx
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { PromptMetadata, DEFAULT_METADATA, MetadataType, METADATA_CONFIGS } from '@/types/prompts/metadata';
import { MetadataSection } from './MetadataSection';
import { SeparatedPreviewSection } from './SeparatedPreviewSection';
import { buildCompletePromptPreview } from '@/components/prompts/promptUtils';
import { highlightPlaceholders } from '@/utils/templates/placeholderHelpers';
import { useSimpleMetadata } from '@/hooks/prompts/editors/useSimpleMetadata';
import { blocksApi } from '@/services/api/BlocksApi';
import { Block, BlockType } from '@/types/prompts/blocks';
import { BLOCK_TYPES } from '@/components/prompts/blocks/blockUtils';

interface AdvancedEditorProps {
  content: string;
  metadata?: PromptMetadata;
  onContentChange: (value: string) => void;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
  isProcessing?: boolean;
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  content,
  metadata = DEFAULT_METADATA,
  onContentChange,
  onUpdateMetadata,
  isProcessing = false
}) => {
  const isDarkMode = useThemeDetector();
  const [showPreview, setShowPreview] = useState(false);
  
  // ✅ Add state for available metadata blocks
  const [availableMetadataBlocks, setAvailableMetadataBlocks] = useState<Record<MetadataType, Block[]>>({} as Record<MetadataType, Block[]>);
  const [blocksLoading, setBlocksLoading] = useState(true);

  const {
    expandedMetadata,
    setExpandedMetadata,
    activeSecondaryMetadata,
    metadataCollapsed,
    setMetadataCollapsed,
    secondaryMetadataCollapsed,
    setSecondaryMetadataCollapsed,
    handleSingleMetadataChange,
    handleCustomChange,
    handleAddMetadataItem,
    handleRemoveMetadataItem,
    handleUpdateMetadataItem,
    handleReorderMetadataItems,
    addSecondaryMetadata,
    removeSecondaryMetadata
  } = useSimpleMetadata({ metadata, onUpdateMetadata });

  // ✅ Load available blocks for each metadata type
  useEffect(() => {
    const fetchBlocks = async () => {
      setBlocksLoading(true);
      try {
        const blockMap: Record<BlockType, Block[]> = {} as any;
        
        // Load blocks for each block type
        await Promise.all(
          BLOCK_TYPES.map(async (blockType) => {
            try {
              const response = await blocksApi.getBlocksByType(blockType);
              blockMap[blockType] = response.success ? response.data : [];
            } catch (error) {
              console.warn(`Failed to load blocks for type ${blockType}:`, error);
              blockMap[blockType] = [];
            }
          })
        );

        // Map block types to metadata types
        const metadataBlocks: Record<MetadataType, Block[]> = {} as any;
        Object.keys(METADATA_CONFIGS).forEach((type) => {
          const metadataType = type as MetadataType;
          const blockType = METADATA_CONFIGS[metadataType].blockType;
          metadataBlocks[metadataType] = blockMap[blockType] || [];
        });

        setAvailableMetadataBlocks(metadataBlocks);
      } catch (error) {
        console.error('Error loading metadata blocks:', error);
      } finally {
        setBlocksLoading(false);
      }
    };

    fetchBlocks();
  }, []);

  // ✅ Handle block saving
  const handleSaveBlock = (block: Block) => {
    // Add to available blocks for future use
    Object.entries(METADATA_CONFIGS).forEach(([metaType, cfg]) => {
      if (cfg.blockType === block.type) {
        setAvailableMetadataBlocks(prev => ({
          ...prev,
          [metaType as MetadataType]: [block, ...(prev[metaType as MetadataType] || [])]
        }));
      }
    });
  };

  if (isProcessing || blocksLoading) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full" />
        <span className="jd-ml-3 jd-text-gray-600">
          {isProcessing ? 'Loading template...' : 'Loading blocks...'}
        </span>
      </div>
    );
  }

  const previewHtml = highlightPlaceholders(
    buildCompletePromptPreview(metadata, [{ id: 1, type: 'custom', content }])
  );

  return (
    <div
      className={cn(
        'jd-h-full jd-flex jd-flex-col jd-relative jd-overflow-hidden jd-space-y-6',
        isDarkMode
          ? 'jd-bg-gradient-to-br jd-from-gray-900 jd-via-gray-800 jd-to-gray-900'
          : 'jd-bg-gradient-to-br jd-from-slate-50 jd-via-white jd-to-slate-100'
      )}
    >
      <div className="jd-relative jd-z-10 jd-flex-1 jd-flex jd-flex-col jd-space-y-6 jd-p-6 jd-overflow-y-auto">
        
        {/* 1. PRIMARY METADATA SECTION */}
        <div className="jd-flex-shrink-0">
          <MetadataSection
            availableMetadataBlocks={availableMetadataBlocks}
            metadata={metadata}
            expandedMetadata={expandedMetadata}
            setExpandedMetadata={setExpandedMetadata}
            activeSecondaryMetadata={activeSecondaryMetadata}
            metadataCollapsed={metadataCollapsed}
            setMetadataCollapsed={setMetadataCollapsed}
            secondaryMetadataCollapsed={secondaryMetadataCollapsed}
            setSecondaryMetadataCollapsed={setSecondaryMetadataCollapsed}
            onSingleMetadataChange={handleSingleMetadataChange}
            onCustomChange={handleCustomChange}
            onAddMetadataItem={handleAddMetadataItem}
            onRemoveMetadataItem={handleRemoveMetadataItem}
            onUpdateMetadataItem={handleUpdateMetadataItem}
            onReorderMetadataItems={handleReorderMetadataItems}
            onAddSecondaryMetadata={addSecondaryMetadata}
            onRemoveSecondaryMetadata={removeSecondaryMetadata}
            onSaveBlock={handleSaveBlock}
            showPrimary={true}   // ✅ Show primary metadata
            showSecondary={false} // ❌ Don't show secondary here
          />
        </div>

        {/* 2. MAIN CONTENT SECTION */}
        <div className="jd-flex-shrink-0">
          <div className="jd-space-y-3">
            <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
              <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-blue-500 jd-to-purple-600 jd-rounded-full"></span>
              Main Content
            </h3>
            <div className="jd-relative">
              <Textarea
                value={content}
                onChange={e => onContentChange(e.target.value)}
                className="!jd-min-h-[250px] jd-text-sm jd-resize-none jd-transition-all jd-duration-200 focus:jd-ring-2 focus:jd-ring-primary/50"
                placeholder="Enter your main prompt content here..."
                onKeyDown={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
              />
              {content && (
                <div className="jd-absolute jd-bottom-2 jd-right-3 jd-text-xs jd-text-muted-foreground jd-bg-background/80 jd-px-2 jd-py-1 jd-rounded">
                  {content.length} characters
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. SECONDARY METADATA SECTION */}
        <div className="jd-flex-shrink-0">
          <MetadataSection
            availableMetadataBlocks={availableMetadataBlocks}
            metadata={metadata}
            expandedMetadata={expandedMetadata}
            setExpandedMetadata={setExpandedMetadata}
            activeSecondaryMetadata={activeSecondaryMetadata}
            metadataCollapsed={metadataCollapsed}
            setMetadataCollapsed={setMetadataCollapsed}
            secondaryMetadataCollapsed={secondaryMetadataCollapsed}
            setSecondaryMetadataCollapsed={setSecondaryMetadataCollapsed}
            onSingleMetadataChange={handleSingleMetadataChange}
            onCustomChange={handleCustomChange}
            onAddMetadataItem={handleAddMetadataItem}
            onRemoveMetadataItem={handleRemoveMetadataItem}
            onUpdateMetadataItem={handleUpdateMetadataItem}
            onReorderMetadataItems={handleReorderMetadataItems}
            onAddSecondaryMetadata={addSecondaryMetadata}
            onRemoveSecondaryMetadata={removeSecondaryMetadata}
            onSaveBlock={handleSaveBlock}
            showPrimary={false}  // ❌ Don't show primary here
            showSecondary={true} // ✅ Show secondary metadata
          />
        </div>

        {/* 4. PREVIEW TOGGLE */}
        <div className="jd-flex-shrink-0 jd-pt-4 jd-border-t">
          <button
            className={cn(
              'jd-px-4 jd-py-2 jd-rounded-lg jd-transition-all jd-duration-200',
              'jd-text-sm jd-font-medium jd-shadow-sm',
              showPreview
                ? 'jd-bg-primary jd-text-primary-foreground hover:jd-bg-primary/90'
                : 'jd-bg-secondary jd-text-secondary-foreground hover:jd-bg-secondary/80'
            )}
            onClick={() => setShowPreview(prev => !prev)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        {/* 5. PREVIEW SECTION (when enabled) */}
        {showPreview && (
          <SeparatedPreviewSection 
            beforeHtml="" 
            contentHtml={previewHtml} 
            afterHtml="" 
          />
        )}
      </div>
    </div>
  );
};