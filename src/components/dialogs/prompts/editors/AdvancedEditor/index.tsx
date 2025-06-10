// src/components/dialogs/prompts/editors/AdvancedEditor/index.tsx - Completely Fixed Version
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { 
  PromptMetadata,
  DEFAULT_METADATA,
  MetadataType,
  METADATA_CONFIGS
} from '@/types/prompts/metadata';
import { MetadataSection } from './MetadataSection';
import EditablePromptPreview from '@/components/prompts/EditablePromptPreview';
import { useSimpleMetadata } from '@/hooks/prompts/editors/useSimpleMetadata';
import { blocksApi } from '@/services/api/BlocksApi';
import { Block, BlockType } from '@/types/prompts/blocks';
import { BLOCK_TYPES } from '@/components/prompts/blocks/blockUtils';
import {
  buildCompletePreviewWithBlocks,
  buildCompletePreviewHtmlWithBlocks
} from '@/utils/templates/promptPreviewUtils';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

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
  
  // State for available metadata blocks
  const [availableMetadataBlocks, setAvailableMetadataBlocks] = useState<Record<MetadataType, Block[]>>({} as Record<MetadataType, Block[]>);
  const [blocksLoading, setBlocksLoading] = useState(true);
  const [blockContentCache, setBlockContentCache] = useState<Record<number, string>>({});

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

  // Load available blocks for each metadata type
  useEffect(() => {
    const fetchBlocks = async () => {
      setBlocksLoading(true);
      try {
        const blockMap: Record<BlockType, Block[]> = {} as any;
        
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

        const metadataBlocks: Record<MetadataType, Block[]> = {} as any;
        Object.keys(METADATA_CONFIGS).forEach((type) => {
          const metadataType = type as MetadataType;
          const blockType = METADATA_CONFIGS[metadataType].blockType;
          metadataBlocks[metadataType] = blockMap[blockType] || [];
        });

        setAvailableMetadataBlocks(metadataBlocks);

        const cache: Record<number, string> = {};
        Object.values(blockMap).flat().forEach(block => {
          const blockContent = typeof block.content === 'string' 
            ? block.content 
            : block.content?.en || '';
          cache[block.id] = blockContent;
        });
        setBlockContentCache(cache);

      } catch (error) {
        console.error('Error loading metadata blocks:', error);
      } finally {
        setBlocksLoading(false);
      }
    };

    fetchBlocks();
  }, []);

  const handleSaveBlock = useCallback((block: Block) => {
    Object.entries(METADATA_CONFIGS).forEach(([metaType, cfg]) => {
      if (cfg.blockType === block.type) {
        setAvailableMetadataBlocks(prev => ({
          ...prev,
          [metaType as MetadataType]: [block, ...(prev[metaType as MetadataType] || [])]
        }));
      }
    });

    const blockContent = typeof block.content === 'string' 
      ? block.content 
      : block.content?.en || '';
    setBlockContentCache(prev => ({
      ...prev,
      [block.id]: blockContent
    }));
  }, []);

  const buildEnhancedPreview = useMemo(
    () => buildCompletePreviewWithBlocks(metadata, content, blockContentCache),
    [metadata, content, blockContentCache]
  );

  const previewHtml = useMemo(
    () =>
      buildCompletePreviewHtmlWithBlocks(
        metadata,
        content,
        blockContentCache,
        isDarkMode
      ),
    [metadata, content, blockContentCache, isDarkMode]
  );

  const togglePreview = () => {
    setShowPreview(prev => !prev);
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
            showPrimary={true}
            showSecondary={false}
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
                className="!jd-min-h-[200px] jd-text-sm jd-resize-none jd-transition-all jd-duration-200 focus:jd-ring-2 focus:jd-ring-primary/50"
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
            showPrimary={false}
            showSecondary={true}
          />
        </div>

        {/* 4. PREVIEW TOGGLE BUTTON */}
        <div className="jd-flex-shrink-0 jd-pt-4 jd-border-t">
          <Button
            onClick={togglePreview}
            variant="outline"
            className={cn(
              'jd-w-full jd-transition-all jd-duration-300 jd-group',
              'hover:jd-shadow-lg hover:jd-scale-[1.02]',
              showPreview 
                ? 'jd-bg-primary jd-text-primary-foreground hover:jd-bg-primary/90' 
                : 'jd-bg-background hover:jd-bg-muted'
            )}
          >
            <div className="jd-flex jd-items-center jd-gap-2">
              {showPreview ? (
                <>
                  <EyeOff className="jd-h-4 jd-w-4 jd-transition-transform group-hover:jd-scale-110" />
                  <span>Hide Preview</span>
                  <ChevronUp className="jd-h-4 jd-w-4 jd-transition-transform group-hover:jd-rotate-180" />
                </>
              ) : (
                <>
                  <Eye className="jd-h-4 jd-w-4 jd-transition-transform group-hover:jd-scale-110" />
                  <span>Show Preview</span>
                  <ChevronDown className="jd-h-4 jd-w-4 jd-transition-transform group-hover:jd-rotate-180" />
                </>
              )}
              <div className="jd-flex jd-items-center jd-gap-1 jd-text-xs jd-ml-auto">
                <span className="jd-inline-block jd-w-3 jd-h-3 jd-bg-yellow-300 jd-rounded"></span>
                <span>Placeholders</span>
              </div>
            </div>
          </Button>
        </div>

        {/* 5. ANIMATED PREVIEW SECTION */}
        <div 
          className={cn(
            'jd-overflow-hidden jd-transition-all jd-duration-500 jd-ease-in-out',
            showPreview ? 'jd-max-h-[500px] jd-opacity-100' : 'jd-max-h-0 jd-opacity-0'
          )}
        >
          <div className={cn(
            'jd-transform jd-transition-all jd-duration-500 jd-ease-in-out',
            showPreview ? 'jd-translate-y-0' : 'jd--translate-y-4'
          )}>
            <div className="jd-space-y-3 jd-pt-4">
              <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
                <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-green-500 jd-to-teal-600 jd-rounded-full jd-animate-pulse"></span>
                Preview
              </h3>
              <div className="jd-border jd-rounded-lg jd-p-1 jd-bg-gradient-to-r jd-from-green-500/20 jd-to-teal-500/20">
                <EditablePromptPreview
                  content={buildEnhancedPreview}
                  htmlContent={previewHtml}
                  isDark={isDarkMode}
                  enableAdvancedEditing={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
