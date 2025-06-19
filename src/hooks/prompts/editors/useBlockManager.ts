// src/hooks/prompts/editors/useBlockManager.ts - Fixed Version
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Block, BlockType } from '@/types/prompts/blocks';
import { 
  PromptMetadata, 
  MetadataType, 
  SingleMetadataType,
  MultipleMetadataType,
  METADATA_CONFIGS,
  isMultipleMetadataType 
} from '@/types/prompts/metadata';
import { blocksApi } from '@/services/api/BlocksApi';
import { BLOCK_TYPES } from '@/utils/prompts/blockUtils';
import { getCurrentLanguage } from '@/core/utils/i18n';
import {
  buildCompletePreviewWithBlocks,
  buildCompletePreview,
  buildCompletePreviewWithBlocksAndRanges
} from '@/utils/templates/promptPreviewUtils';
import type { BlockRangeMap } from '@/types/prompts/metadata';

interface UseBlockManagerReturn {
  // Loading state
  isLoading: boolean;
  
  // Available blocks
  availableMetadataBlocks: Record<MetadataType, Block[]>;
  availableBlocksByType: Record<BlockType, Block[]>;
  
  // Block content cache for quick lookup
  blockContentCache: Record<number, string>;
  
  // Final content management
  finalContent: string;
  hasModifications: boolean;
  modifiedBlocks: Record<number, string>;
  blockRanges: BlockRangeMap;
  
  // Utility functions
  resolveMetadataToContent: (metadata: PromptMetadata) => PromptMetadata;
  buildFinalPromptContent: (metadata: PromptMetadata, content: string, modifications?: Record<number, string>) => string;
  buildFinalPromptHtml: (metadata: PromptMetadata, content: string, isDark: boolean, modifications?: Record<number, string>) => string;
  
  // Final content management functions
  updateFinalContent: (newContent: string) => void;
  applyModifications: (modifications: Record<number, string>) => void;
  resetModifications: () => void;
  getEffectiveBlockContent: (blockId: number) => string;
  
  // Block management
  addNewBlock: (block: Block) => void;
  refreshBlocks: () => Promise<void>;
  
  // For create dialog - creating new blocks from modifications
  createBlocksFromModifications: () => Promise<Record<number, Block>>;
}

interface UseBlockManagerProps {
  metadata: PromptMetadata;
  content: string;
  onFinalContentChange?: (content: string, ranges: BlockRangeMap) => void;
  onBlockModification?: (blockId: number, newContent: string) => void;
  dialogType?: 'create' | 'customize';
}

export function useBlockManager(props?: UseBlockManagerProps): UseBlockManagerReturn {
  const {
    metadata = {} as PromptMetadata,
    content = '',
    onFinalContentChange,
    onBlockModification,
    dialogType = 'customize'
  } = props || {};

  const [isLoading, setIsLoading] = useState(true);
  const [availableMetadataBlocks, setAvailableMetadataBlocks] = useState<Record<MetadataType, Block[]>>({} as Record<MetadataType, Block[]>);
  const [availableBlocksByType, setAvailableBlocksByType] = useState<Record<BlockType, Block[]>>({} as Record<BlockType, Block[]>);
  const [blockContentCache, setBlockContentCache] = useState<Record<number, string>>({});
  
  // Final content state management
  const [modifiedBlocks, setModifiedBlocks] = useState<Record<number, string>>({});
  const [finalContent, setFinalContent] = useState('');
  const [blockRanges, setBlockRanges] = useState<BlockRangeMap>({});
  
  // **FIX: Prevent multiple updates with refs**
  const isUpdatingFinalContentRef = useRef(false);
  const lastComputedContentRef = useRef('');

  // Compute effective block map (original + modifications)
  const effectiveBlockMap = useMemo(() => {
    return {
      ...blockContentCache,
      ...modifiedBlocks
    };
  }, [blockContentCache, modifiedBlocks]);

  // Check if there are any modifications
  const hasModifications = useMemo(() => {
    return Object.keys(modifiedBlocks).length > 0;
  }, [modifiedBlocks]);

  // Fetch all blocks
  const fetchBlocks = useCallback(async () => {
    setIsLoading(true);
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

      // Group blocks by metadata type
      const metadataBlocks: Record<MetadataType, Block[]> = {} as any;
      Object.keys(METADATA_CONFIGS).forEach((type) => {
        const metadataType = type as MetadataType;
        const blockType = METADATA_CONFIGS[metadataType].blockType;
        metadataBlocks[metadataType] = blockMap[blockType] || [];
      });

      setAvailableBlocksByType(blockMap);
      setAvailableMetadataBlocks(metadataBlocks);

      // Build content cache for quick lookup
      const cache: Record<number, string> = {};
      Object.values(blockMap).flat().forEach(block => {
        const blockContent = typeof block.content === 'string' 
          ? block.content 
          : block.content?.en || '';
        cache[block.id] = blockContent;
      });
      setBlockContentCache(cache);

    } catch (error) {
      console.error('Error loading blocks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // **FIX: Update final content when metadata, content, or modifications change (with debouncing)**
  useEffect(() => {
    if (isUpdatingFinalContentRef.current) {
      console.log('useBlockManager: Already updating final content, skipping');
      return;
    }
    
    const { text: newFinalContent, ranges } = buildCompletePreviewWithBlocksAndRanges(
      metadata,
      content,
      { ...blockContentCache, ...modifiedBlocks }
    );
    
    // **FIX: Only update if content actually changed**
    if (newFinalContent !== lastComputedContentRef.current) {
      console.log('useBlockManager: Final content changed', {
        old: lastComputedContentRef.current.substring(0, 50) + '...',
        new: newFinalContent.substring(0, 50) + '...'
      });
      
      lastComputedContentRef.current = newFinalContent;
      setFinalContent(newFinalContent);
      setBlockRanges(ranges);
      
      // **FIX: Debounce the external notification**
      if (onFinalContentChange) {
        isUpdatingFinalContentRef.current = true;

        const timeoutId = setTimeout(() => {
          onFinalContentChange?.(newFinalContent, ranges);
          isUpdatingFinalContentRef.current = false;
        }, 50); // Small delay to prevent rapid-fire updates
        
        return () => {
          clearTimeout(timeoutId);
          isUpdatingFinalContentRef.current = false;
        };
      }
    }
  }, [metadata, content, modifiedBlocks, blockContentCache, onFinalContentChange]);

  // Resolve metadata block IDs to actual content
  const resolveMetadataToContent = useCallback((metadata: PromptMetadata): PromptMetadata => {
    const resolved: PromptMetadata = {
      ...metadata,
      values: { ...(metadata.values || {}) }
    };

    // Resolve single metadata types
    const singleTypes: SingleMetadataType[] = [
      'role', 'context', 'goal', 'audience', 'output_format', 'tone_style'
    ];

    singleTypes.forEach(type => {
      const blockId = metadata[type];
      if (blockId && blockId !== 0) {
        const effectiveContent = effectiveBlockMap[blockId];
        if (effectiveContent) {
          resolved.values![type] = effectiveContent;
        }
      }
    });

    // Resolve multiple metadata types
    if (metadata.constraints) {
      resolved.constraints = metadata.constraints.map(item => ({
        ...item,
        value: item.blockId && effectiveBlockMap[item.blockId] 
          ? effectiveBlockMap[item.blockId] 
          : item.value
      }));
    }

    if (metadata.examples) {
      resolved.examples = metadata.examples.map(item => ({
        ...item,
        value: item.blockId && effectiveBlockMap[item.blockId] 
          ? effectiveBlockMap[item.blockId] 
          : item.value
      }));
    }

    return resolved;
  }, [effectiveBlockMap]);

  // Build final prompt content with resolved metadata
  const buildFinalPromptContent = useCallback((
    metadata: PromptMetadata, 
    content: string, 
    modifications?: Record<number, string>
  ): string => {
    const blockMap = modifications ? { ...blockContentCache, ...modifications } : effectiveBlockMap;
    
    if (Object.keys(blockMap).length > 0) {
      return buildCompletePreviewWithBlocks(metadata, content, blockMap);
    }
    return buildCompletePreview(metadata, content);
  }, [blockContentCache, effectiveBlockMap]);

  // Build final prompt HTML with resolved metadata
  const buildFinalPromptHtml = useCallback((
    metadata: PromptMetadata, 
    content: string, 
    isDark: boolean, 
    modifications?: Record<number, string>
  ): string => {
    const blockMap = modifications ? { ...blockContentCache, ...modifications } : effectiveBlockMap;
    
    // Use existing utility from promptPreviewUtils
    const resolvedMetadata = resolveMetadataToContent(metadata);
    return buildCompletePreviewHtml(resolvedMetadata, content, isDark);
  }, [blockContentCache, effectiveBlockMap, resolveMetadataToContent]);

  // Final content management functions
  const updateFinalContent = useCallback((newContent: string) => {
    console.log('useBlockManager: updateFinalContent called');
    setFinalContent(newContent);
    lastComputedContentRef.current = newContent;
    // Note: Don't call onFinalContentChange here to avoid loops
  }, []);

  const applyModifications = useCallback((modifications: Record<number, string>) => {
    console.log('useBlockManager: applyModifications called', modifications);
    
    setModifiedBlocks(prev => ({
      ...prev,
      ...modifications
    }));

    // Notify parent about individual block modifications
    Object.entries(modifications).forEach(([blockId, content]) => {
      onBlockModification?.(parseInt(blockId, 10), content);
    });
  }, [onBlockModification]);

  const resetModifications = useCallback(() => {
    console.log('useBlockManager: resetModifications called');
    setModifiedBlocks({});
  }, []);

  const getEffectiveBlockContent = useCallback((blockId: number): string => {
    return effectiveBlockMap[blockId] || '';
  }, [effectiveBlockMap]);

  // Create new blocks from modifications (for create dialog)
  const createBlocksFromModifications = useCallback(async (): Promise<Record<number, Block>> => {
    if (dialogType !== 'create' || Object.keys(modifiedBlocks).length === 0) {
      return {};
    }

    console.log('useBlockManager: Creating blocks from modifications', modifiedBlocks);
    const newBlocks: Record<number, Block> = {};

    try {
      // Create new blocks for each modification
      for (const [originalBlockId, newContent] of Object.entries(modifiedBlocks)) {
        const originalBlockIdNum = parseInt(originalBlockId, 10);
        const originalBlock = await blocksApi.getBlock(originalBlockIdNum);

        if (originalBlock.success && originalBlock.data) {
          // Create a new block with modified content and is_published = false
          const newBlockData = {
            title: `${originalBlock.data.title} (Modified)`,
            content: newContent,
            type: originalBlock.data.type,
            is_published: false,
            parent_block_id: originalBlockIdNum
          };

          const createResponse = await blocksApi.createBlock(newBlockData);
          if (createResponse.success) {
            newBlocks[originalBlockIdNum] = createResponse.data;
          }
        }
      }
    } catch (error) {
      console.error('Error creating blocks from modifications:', error);
    }

    return newBlocks;
  }, [dialogType, modifiedBlocks]);

  // Add a new block to the cache
  const addNewBlock = useCallback((block: Block) => {
    // Add to appropriate type collections
    setAvailableBlocksByType(prev => ({
      ...prev,
      [block.type]: [block, ...(prev[block.type] || [])]
    }));

    // Add to metadata blocks if applicable
    Object.entries(METADATA_CONFIGS).forEach(([metaType, cfg]) => {
      if (cfg.blockType === block.type) {
        setAvailableMetadataBlocks(prev => ({
          ...prev,
          [metaType as MetadataType]: [block, ...(prev[metaType as MetadataType] || [])]
        }));
      }
    });

    // Add to content cache
    const blockContent = typeof block.content === 'string' 
      ? block.content 
      : block.content?.en || '';
    setBlockContentCache(prev => ({
      ...prev,
      [block.id]: blockContent
    }));
  }, []);

  return {
    isLoading,
    availableMetadataBlocks,
    availableBlocksByType,
    blockContentCache,
    
    // Final content state
    finalContent,
    blockRanges,
    hasModifications,
    modifiedBlocks,
    
    // Utility functions
    resolveMetadataToContent,
    buildFinalPromptContent,
    buildFinalPromptHtml,
    
    // Final content management
    updateFinalContent,
    applyModifications,
    resetModifications,
    getEffectiveBlockContent,
    
    // Block management
    addNewBlock,
    refreshBlocks: fetchBlocks,
    
    // Create dialog specific
    createBlocksFromModifications
  };
}

// Helper function to get metadata prefixes
function getMetadataPrefix(type: SingleMetadataType): string {
  const prefixes: Record<SingleMetadataType, string> = {
    role: 'Ton rôle est de',
    context: 'Le contexte est',
    goal: 'Ton objectif est',
    audience: "L'audience ciblée est",
    output_format: 'Le format attendu est',
    tone_style: 'Le ton et style sont'
  };
  return prefixes[type] || '';
}

// Import the existing utility
import { buildCompletePreviewHtml } from '@/utils/templates/promptPreviewUtils';