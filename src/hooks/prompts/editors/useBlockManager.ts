// src/hooks/prompts/editors/useBlockManager.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
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

interface UseBlockManagerReturn {
  // Loading state
  isLoading: boolean;
  
  // Available blocks
  availableMetadataBlocks: Record<MetadataType, Block[]>;
  availableBlocksByType: Record<BlockType, Block[]>;
  
  // Block content cache for quick lookup
  blockContentCache: Record<number, string>;
  
  // Utility functions
  resolveMetadataToContent: (metadata: PromptMetadata) => PromptMetadata;
  buildFinalPromptContent: (metadata: PromptMetadata, content: string) => string;
  buildFinalPromptHtml: (metadata: PromptMetadata, content: string, isDark: boolean) => string;
  
  // Block management
  addNewBlock: (block: Block) => void;
  refreshBlocks: () => Promise<void>;
}

export function useBlockManager(): UseBlockManagerReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [availableMetadataBlocks, setAvailableMetadataBlocks] = useState<Record<MetadataType, Block[]>>({} as Record<MetadataType, Block[]>);
  const [availableBlocksByType, setAvailableBlocksByType] = useState<Record<BlockType, Block[]>>({} as Record<BlockType, Block[]>);
  const [blockContentCache, setBlockContentCache] = useState<Record<number, string>>({});

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
      if (blockId && blockId !== 0 && blockContentCache[blockId]) {
        resolved.values![type] = blockContentCache[blockId];
      }
    });

    // Resolve multiple metadata types
    if (metadata.constraints) {
      resolved.constraints = metadata.constraints.map(item => ({
        ...item,
        value: item.blockId && blockContentCache[item.blockId] 
          ? blockContentCache[item.blockId] 
          : item.value
      }));
    }

    if (metadata.examples) {
      resolved.examples = metadata.examples.map(item => ({
        ...item,
        value: item.blockId && blockContentCache[item.blockId] 
          ? blockContentCache[item.blockId] 
          : item.value
      }));
    }

    return resolved;
  }, [blockContentCache]);

  // Build final prompt content with resolved metadata
  const buildFinalPromptContent = useCallback((metadata: PromptMetadata, content: string): string => {
    const resolvedMetadata = resolveMetadataToContent(metadata);
    const parts: string[] = [];

    // Add resolved metadata values
    const metadataOrder: SingleMetadataType[] = ['role', 'context', 'goal', 'audience', 'output_format', 'tone_style'];
    
    metadataOrder.forEach(type => {
      const value = resolvedMetadata.values?.[type];
      if (value?.trim()) {
        const prefix = getMetadataPrefix(type);
        parts.push(prefix ? `${prefix} ${value}` : value);
      }
    });

    // Add constraints
    if (resolvedMetadata.constraints) {
      resolvedMetadata.constraints.forEach((constraint, index) => {
        if (constraint.value.trim()) {
          parts.push(`Contrainte: ${constraint.value}`);
        }
      });
    }

    // Add examples
    if (resolvedMetadata.examples) {
      resolvedMetadata.examples.forEach((example, index) => {
        if (example.value.trim()) {
          parts.push(`Exemple: ${example.value}`);
        }
      });
    }

    // Add main content
    if (content?.trim()) {
      parts.push(content.trim());
    }


    return parts.filter(Boolean).join('\n\n');
  }, [resolveMetadataToContent]);

  // Build final prompt HTML with resolved metadata
  const buildFinalPromptHtml = useCallback((metadata: PromptMetadata, content: string, isDark: boolean): string => {
    const resolvedMetadata = resolveMetadataToContent(metadata);
    // Use existing utility from promptPreviewUtils
    return buildCompletePreviewHtml(resolvedMetadata, content, isDark);
  }, [resolveMetadataToContent]);

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
    resolveMetadataToContent,
    buildFinalPromptContent,
    buildFinalPromptHtml,
    addNewBlock,
    refreshBlocks: fetchBlocks
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