// src/hooks/prompts/editors/useBlockManager.ts - Simplified Version
import { useState, useEffect, useCallback, useRef } from 'react';
import { Block, BlockType } from '@/types/prompts/blocks';
import { 
  PromptMetadata, 
  MetadataType, 
  METADATA_CONFIGS
} from '@/types/prompts/metadata';
import { blocksApi } from '@/services/api/BlocksApi';
import { BLOCK_TYPES } from '@/utils/prompts/blockUtils';
import { extractBlockIdsFromTemplateMetadata } from '@/utils/prompts/metadataBlockExtractor';

interface UseBlockManagerReturn {
  // Loading state
  isLoading: boolean;
  
  // Available blocks
  availableMetadataBlocks: Record<MetadataType, Block[]>;
  availableBlocksByType: Record<BlockType, Block[]>;
  
  // Block content cache for quick lookup
  blockContentCache: Record<number, string>;
  
  // Block management
  addNewBlock: (block: Block) => void;
  refreshBlocks: () => Promise<void>;
}

interface UseBlockManagerProps {
  metadata?: PromptMetadata;
  content?: string;
  /**
   * When false, block loading is skipped. This allows dialogs to
   * postpone fetching data until they are actually opened.
   */
  enabled?: boolean;
}

export function useBlockManager(props?: UseBlockManagerProps): UseBlockManagerReturn {
  const { enabled = true, metadata } = props || {};

  const [isLoading, setIsLoading] = useState(true);
  const [availableMetadataBlocks, setAvailableMetadataBlocks] = useState<Record<MetadataType, Block[]>>({} as Record<MetadataType, Block[]>);
  const [availableBlocksByType, setAvailableBlocksByType] = useState<Record<BlockType, Block[]>>({} as Record<BlockType, Block[]>);
  const [blockContentCache, setBlockContentCache] = useState<Record<number, string>>({});

  // Fetch all blocks
  const fetchBlocks = useCallback(async (metadataBlockIds?: number[]) => {
    setIsLoading(true);
    try {
      const blockMap: Record<BlockType, Block[]> = {} as any;
      
      try {
        // Get all published blocks
        const publishedResponse = await blocksApi.getBlocks({ published: true });
        let allBlocks: Block[] = [];
        
        if (publishedResponse.success && publishedResponse.data) {
          allBlocks = [...publishedResponse.data];
        }

        // If we have specific metadata block IDs, fetch those too (including unpublished)
        if (metadataBlockIds && metadataBlockIds.length > 0) {
          const metadataBlocksResponse = await blocksApi.getBlocksByIds(metadataBlockIds);
          
          if (metadataBlocksResponse.success && metadataBlocksResponse.data) {
            // Merge with published blocks, avoiding duplicates
            const existingIds = new Set(allBlocks.map(b => b.id));
            const newBlocks = metadataBlocksResponse.data.filter(b => !existingIds.has(b.id));
            allBlocks = [...allBlocks, ...newBlocks];
          }
        }

        // Group blocks by type
        allBlocks.forEach(block => {
          if (!blockMap[block.type]) {
            blockMap[block.type] = [];
          }
          blockMap[block.type].push(block);
        });
      } catch (error) {
        console.error('Failed to load blocks:', error);
      }

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

  // Initial fetch and re-fetch when dialog is opened
  const prevMetadataIdsRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    // Extract block IDs from metadata if available. We allow re-fetching when
    // the set of IDs changes (e.g. when metadata is loaded on dialog open).
    const metadataBlockIds = metadata
      ? extractBlockIdsFromTemplateMetadata(metadata)
      : undefined;

    const idKey = (metadataBlockIds || []).sort((a, b) => a - b).join(',');
    if (idKey === prevMetadataIdsRef.current) return;
    prevMetadataIdsRef.current = idKey;

    fetchBlocks(metadataBlockIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBlocks, enabled, metadata]);

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
    addNewBlock,
    refreshBlocks: fetchBlocks
  };
}