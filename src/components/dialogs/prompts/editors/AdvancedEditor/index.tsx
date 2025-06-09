// src/components/dialogs/prompts/editors/AdvancedEditor/index.tsx - Complete Fixed Version
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { 
  PromptMetadata, 
  DEFAULT_METADATA, 
  MetadataType, 
  METADATA_CONFIGS,
  SingleMetadataType,
  MultipleMetadataType,
  isMultipleMetadataType 
} from '@/types/prompts/metadata';
import { MetadataSection } from './MetadataSection';
import EditablePromptPreview from '@/components/prompts/EditablePromptPreview';
import { useSimpleMetadata } from '@/hooks/prompts/editors/useSimpleMetadata';
import { blocksApi } from '@/services/api/BlocksApi';
import { Block, BlockType } from '@/types/prompts/blocks';
import { BLOCK_TYPES, getBlockTextColors } from '@/components/prompts/blocks/blockUtils';

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

  // Define helper functions as constants inside component to avoid hoisting issues
  const getMetadataPrefix = useCallback((type: string): string => {
    const prefixes: Record<string, string> = {
      role: 'Ton rôle est de',
      context: 'Le contexte est',
      goal: 'Ton objectif est',
      audience: "L'audience ciblée est",
      output_format: 'Le format attendu est',
      tone_style: 'Le ton et style sont'
    };
    return prefixes[type] || '';
  }, []);

  const escapeHtml = useCallback((str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }, []);

  const getMetadataPrefixHtml = useCallback((type: string): string => {
    const prefix = getMetadataPrefix(type);
    if (!prefix) return '';
    
    // Get the block type from metadata config to determine color
    const metadataConfig = METADATA_CONFIGS[type as MetadataType];
    const blockType = metadataConfig?.blockType || 'custom';
    const colorClass = getBlockTextColors(blockType, isDarkMode);
    
    return `<span class="${colorClass} jd-font-semibold">${escapeHtml(prefix)}</span>`;
  }, [getMetadataPrefix, escapeHtml, isDarkMode]);

  // Load available blocks for each metadata type
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

        // Build block content cache for quick lookup
        const cache: Record<number, string> = {};
        Object.values(blockMap).flat().forEach(block => {
          const content = typeof block.content === 'string' 
            ? block.content 
            : block.content?.en || '';
          cache[block.id] = content;
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

  // Handle block saving
  const handleSaveBlock = useCallback((block: Block) => {
    // Add to available blocks for future use
    Object.entries(METADATA_CONFIGS).forEach(([metaType, cfg]) => {
      if (cfg.blockType === block.type) {
        setAvailableMetadataBlocks(prev => ({
          ...prev,
          [metaType as MetadataType]: [block, ...(prev[metaType as MetadataType] || [])]
        }));
      }
    });

    // Update cache
    const content = typeof block.content === 'string' 
      ? block.content 
      : block.content?.en || '';
    setBlockContentCache(prev => ({
      ...prev,
      [block.id]: content
    }));
  }, []);

  // Enhanced function to build preview with resolved block content (plain text)
  const buildEnhancedPreview = useMemo(() => {
    const parts: string[] = [];

    // Helper function to get block content by ID
    const getBlockContentById = (blockId: number): string => {
      return blockContentCache[blockId] || '';
    };

    // Add primary metadata
    ['role', 'context', 'goal'].forEach(type => {
      const metaType = type as SingleMetadataType;
      
      // Check if it's a block ID or custom value
      const blockId = metadata[metaType];
      const customValue = metadata.values?.[metaType];
      
      let contentText = '';
      if (blockId && blockId !== 0) {
        contentText = getBlockContentById(blockId);
      } else if (customValue?.trim()) {
        contentText = customValue;
      }
      
      if (contentText) {
        const prefix = getMetadataPrefix(metaType);
        parts.push(prefix ? `${prefix} ${contentText}` : contentText);
      }
    });

    // Add secondary metadata
    ['audience', 'output_format', 'tone_style'].forEach(type => {
      if (activeSecondaryMetadata.has(type as MetadataType)) {
        const metaType = type as SingleMetadataType;
        
        const blockId = metadata[metaType];
        const customValue = metadata.values?.[metaType];
        
        let contentText = '';
        if (blockId && blockId !== 0) {
          contentText = getBlockContentById(blockId);
        } else if (customValue?.trim()) {
          contentText = customValue;
        }
        
        if (contentText) {
          const prefix = getMetadataPrefix(metaType);
          parts.push(prefix ? `${prefix} ${contentText}` : contentText);
        }
      }
    });

    // Add multiple metadata (constraints, examples)
    if (metadata.constraints && metadata.constraints.length > 0) {
      metadata.constraints.forEach(item => {
        if (item.value.trim()) {
          parts.push(`Contrainte: ${item.value}`);
        }
      });
    }

    if (metadata.examples && metadata.examples.length > 0) {
      metadata.examples.forEach(item => {
        if (item.value.trim()) {
          parts.push(`Exemple: ${item.value}`);
        }
      });
    }

    // Add main content
    if (content.trim()) {
      parts.push(content);
    }

    return parts.filter(Boolean).join('\n\n');
  }, [metadata, activeSecondaryMetadata, content, blockContentCache, getMetadataPrefix]);

  // Enhanced function to build HTML preview with colors like InsertBlockDialog
  const buildEnhancedPreviewHtml = useMemo(() => {
    const parts: string[] = [];

    // Helper function to get block content by ID
    const getBlockContentById = (blockId: number): string => {
      return blockContentCache[blockId] || '';
    };

    // Add primary metadata with colored prefixes
    ['role', 'context', 'goal'].forEach(type => {
      const metaType = type as SingleMetadataType;
      
      // Check if it's a block ID or custom value
      const blockId = metadata[metaType];
      const customValue = metadata.values?.[metaType];
      
      let contentText = '';
      if (blockId && blockId !== 0) {
        contentText = getBlockContentById(blockId);
      } else if (customValue?.trim()) {
        contentText = customValue;
      }
      
      if (contentText) {
        const prefixHtml = getMetadataPrefixHtml(metaType);
        const escapedContent = escapeHtml(contentText);
        parts.push(prefixHtml ? `${prefixHtml} ${escapedContent}` : escapedContent);
      }
    });

    // Add secondary metadata with colored prefixes
    ['audience', 'output_format', 'tone_style'].forEach(type => {
      if (activeSecondaryMetadata.has(type as MetadataType)) {
        const metaType = type as SingleMetadataType;
        
        const blockId = metadata[metaType];
        const customValue = metadata.values?.[metaType];
        
        let contentText = '';
        if (blockId && blockId !== 0) {
          contentText = getBlockContentById(blockId);
        } else if (customValue?.trim()) {
          contentText = customValue;
        }
        
        if (contentText) {
          const prefixHtml = getMetadataPrefixHtml(metaType);
          const escapedContent = escapeHtml(contentText);
          parts.push(prefixHtml ? `${prefixHtml} ${escapedContent}` : escapedContent);
        }
      }
    });

    // Add multiple metadata with colored prefixes
    if (metadata.constraints && metadata.constraints.length > 0) {
      metadata.constraints.forEach(item => {
        if (item.value.trim()) {
          const colorClass = getBlockTextColors('constraint', isDarkMode);
          const prefixHtml = `<span class="${colorClass} jd-font-semibold">Contrainte:</span>`;
          parts.push(`${prefixHtml} ${escapeHtml(item.value)}`);
        }
      });
    }

    if (metadata.examples && metadata.examples.length > 0) {
      metadata.examples.forEach(item => {
        if (item.value.trim()) {
          const colorClass = getBlockTextColors('example', isDarkMode);
          const prefixHtml = `<span class="${colorClass} jd-font-semibold">Exemple:</span>`;
          parts.push(`${prefixHtml} ${escapeHtml(item.value)}`);
        }
      });
    }

    // Add main content
    if (content.trim()) {
      parts.push(escapeHtml(content));
    }

    return parts.filter(Boolean).join('<br><br>');
  }, [metadata, activeSecondaryMetadata, content, blockContentCache, isDarkMode, getMetadataPrefixHtml, escapeHtml]);

  // Generate final HTML preview with highlighting
  const previewHtml = useMemo(() => {
    const htmlContent = buildEnhancedPreviewHtml;
    // Apply placeholder highlighting to the HTML content
    return htmlContent.replace(/\[([^\]]+)\]/g, 
      '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
    );
  }, [buildEnhancedPreviewHtml]);

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

        {/* 4. PREVIEW SECTION - Always visible like InsertBlockDialog */}
        <div className="jd-flex-shrink-0 jd-pt-4 jd-border-t">
          <div className="jd-space-y-3">
            <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
              <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-green-500 jd-to-teal-600 jd-rounded-full"></span>
              Preview
              <div className="jd-flex jd-items-center jd-gap-1 jd-text-xs jd-text-muted-foreground jd-ml-auto">
                <span className="jd-inline-block jd-w-3 jd-h-3 jd-bg-yellow-300 jd-rounded"></span>
                <span>Placeholders</span>
              </div>
            </h3>
            <EditablePromptPreview
              content={buildEnhancedPreview}
              htmlContent={previewHtml}
              isDark={isDarkMode}
              // No onChange to make it read-only like in InsertBlockDialog preview mode
            />
          </div>
        </div>
      </div>
    </div>
  );
};