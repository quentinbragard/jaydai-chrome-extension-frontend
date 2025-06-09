// src/components/dialogs/prompts/editors/AdvancedEditor/hooks/useAdvancedEditorLogic.ts
// FIXED: Proper separation of metadata blocks vs content blocks

import { useState, useEffect, useCallback } from 'react';
import { Block, BlockType } from '@/types/prompts/blocks';
import {
  PromptMetadata,
  MetadataType,
  SingleMetadataType,
  MultipleMetadataType,
  MetadataItem,
  PRIMARY_METADATA,
  SECONDARY_METADATA,
  METADATA_CONFIGS,
  isMultipleMetadataType,
  generateMetadataItemId
} from '@/types/prompts/metadata';
import { blocksApi } from '@/services/api/BlocksApi';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { formatMetadataForPreview, formatBlockForPreview } from '@/components/prompts/promptUtils';
import { highlightPlaceholders } from '@/utils/templates/placeholderUtils';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { buildPromptPartHtml, BLOCK_TYPES } from '@/components/prompts/blocks/blockUtils';

const PRIMARY_ORDER: SingleMetadataType[] = ['role', 'context', 'goal'];

interface UseAdvancedEditorLogicProps {
  metadata: PromptMetadata;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
  blocks: Block[];
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onReorderBlocks: (blocks: Block[]) => void;
}

export function useAdvancedEditorLogic({
  metadata,
  onUpdateMetadata,
  blocks,
  onUpdateBlock,
  onReorderBlocks
}: UseAdvancedEditorLogicProps) {
  const isDarkMode = useThemeDetector();

  // Available blocks state
  const [availableMetadataBlocks, setAvailableMetadataBlocks] = useState<Record<MetadataType, Block[]>>({} as Record<MetadataType, Block[]>);
  const [availableBlocksByType, setAvailableBlocksByType] = useState<Record<BlockType, Block[]>>({} as Record<BlockType, Block[]>);

  // UI state
  const [expandedMetadata, setExpandedMetadata] = useState<MetadataType | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [activeSecondaryMetadata, setActiveSecondaryMetadata] = useState<Set<MetadataType>>(new Set());
  const [metadataCollapsed, setMetadataCollapsed] = useState(false);
  const [secondaryMetadataCollapsed, setSecondaryMetadataCollapsed] = useState(false);

  // Drag and drop state
  const [draggedBlockId, setDraggedBlockId] = useState<number | null>(null);

  // Custom values for single metadata types
  const [customValues, setCustomValues] = useState<Record<SingleMetadataType, string>>(
    (metadata.values || {}) as Record<SingleMetadataType, string>
  );

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

  // FIXED: Metadata handlers - these update ONLY metadata, NOT content blocks
  const handleSingleMetadataChange = useCallback((type: SingleMetadataType, value: string) => {
    if (!onUpdateMetadata) return;

    if (value === 'custom') {
      const newMetadata = {
        ...metadata,
        [type]: 0, // 0 indicates custom value, not a block ID
        values: { ...(metadata.values || {}), [type]: customValues[type] || '' }
      };
      onUpdateMetadata(newMetadata);
      setExpandedMetadata(type);
    } else {
      const blockId = Number(value);
      const content = getBlockContent(blockId, type);
      const newValues = { ...(metadata.values || {}) };
      
      if (content) {
        newValues[type] = content;
      } else {
        delete newValues[type];
      }
      
      const newMetadata = { 
        ...metadata, 
        [type]: blockId, // Store the block ID for metadata reference
        values: newValues 
      };
      onUpdateMetadata(newMetadata);
      setExpandedMetadata(null);
    }
  }, [metadata, onUpdateMetadata, customValues]);

  const handleCustomChange = useCallback((type: SingleMetadataType, value: string) => {
    setCustomValues((prev) => ({ ...prev, [type]: value }));
    if (!onUpdateMetadata) return;
    
    const newValues = { ...(metadata.values || {}), [type]: value };
    const newMetadata = { 
      ...metadata, 
      [type]: 0, // 0 indicates custom value
      values: newValues 
    };
    onUpdateMetadata(newMetadata);
  }, [metadata, onUpdateMetadata]);

  // FIXED: Multiple metadata handlers - these also update ONLY metadata
  const handleAddMetadataItem = useCallback((type: MultipleMetadataType) => {
    if (!onUpdateMetadata) return;
    
    const currentItems = metadata[type] || [];
    const newItem: MetadataItem = {
      id: generateMetadataItemId(),
      value: '',
      blockId: undefined // Will be set when user selects a block
    };
    
    const newMetadata = {
      ...metadata,
      [type]: [...currentItems, newItem]
    };
    onUpdateMetadata(newMetadata);
  }, [metadata, onUpdateMetadata]);

  const handleRemoveMetadataItem = useCallback((type: MultipleMetadataType, itemId: string) => {
    if (!onUpdateMetadata) return;
    
    const currentItems = metadata[type] || [];
    const newItems = currentItems.filter(item => item.id !== itemId);
    
    const newMetadata = {
      ...metadata,
      [type]: newItems
    };
    onUpdateMetadata(newMetadata);
  }, [metadata, onUpdateMetadata]);

  const handleUpdateMetadataItem = useCallback((type: MultipleMetadataType, itemId: string, updates: Partial<MetadataItem>) => {
    if (!onUpdateMetadata) return;
    
    const currentItems = metadata[type] || [];
    const newItems = currentItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        
        // If a block ID was selected, get the content from that block
        if (updates.blockId && updates.blockId !== 0) {
          const blockContent = getBlockContentById(updates.blockId, type);
          if (blockContent) {
            updatedItem.value = blockContent;
          }
        }
        
        return updatedItem;
      }
      return item;
    });
    
    const newMetadata = {
      ...metadata,
      [type]: newItems
    };
    onUpdateMetadata(newMetadata);
  }, [metadata, onUpdateMetadata]);

  const handleReorderMetadataItems = useCallback((type: MultipleMetadataType, newItems: MetadataItem[]) => {
    if (!onUpdateMetadata) return;
    
    const newMetadata = {
      ...metadata,
      [type]: newItems
    };
    onUpdateMetadata(newMetadata);
  }, [metadata, onUpdateMetadata]);

  const addSecondaryMetadata = useCallback((type: MetadataType) => {
    setActiveSecondaryMetadata(prev => new Set([...prev, type]));
    if (!onUpdateMetadata) return;
    
    if (isMultipleMetadataType(type)) {
      const newMetadata = {
        ...metadata,
        [type]: []
      };
      onUpdateMetadata(newMetadata);
    } else {
      const newMetadata = {
        ...metadata,
        [type]: 0,
        values: { ...(metadata.values || {}), [type]: '' }
      };
      onUpdateMetadata(newMetadata);
    }
  }, [metadata, onUpdateMetadata]);

  const removeSecondaryMetadata = useCallback((type: MetadataType) => {
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
  }, [metadata, onUpdateMetadata]);

  // Content block drag and drop handlers (these handle ONLY content blocks)
  const handleDragStart = useCallback((id: number) => {
    setDraggedBlockId(id);
  }, []);

  const handleDragOver = useCallback((id: number) => {
    if (draggedBlockId === null || draggedBlockId === id) return;
    const draggedIndex = blocks.findIndex(b => b.id === draggedBlockId);
    const overIndex = blocks.findIndex(b => b.id === id);
    if (draggedIndex === -1 || overIndex === -1) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(overIndex, 0, moved);
    onReorderBlocks(newBlocks);
  }, [blocks, draggedBlockId, onReorderBlocks]);

  const handleDragEnd = useCallback(() => {
    setDraggedBlockId(null);
  }, []);

  // FIXED: Block save handlers - these handle saved blocks properly
  const handleBlockSaved = useCallback((tempId: number, saved: Block) => {
    // Update the content block (not metadata)
    onUpdateBlock(tempId, { id: saved.id, isNew: false });

    // Add to available blocks for future use
    setAvailableBlocksByType(prev => ({
      ...prev,
      [saved.type]: [saved, ...(prev[saved.type] || [])]
    }));

    // Also add to metadata blocks if it's a metadata-compatible type
    Object.entries(METADATA_CONFIGS).forEach(([metaType, cfg]) => {
      if (cfg.blockType === saved.type) {
        setAvailableMetadataBlocks(prev => ({
          ...prev,
          [metaType as MetadataType]: [saved, ...(prev[metaType as MetadataType] || [])]
        }));
      }
    });
  }, [onUpdateBlock]);

  const handleMetadataBlockSaved = useCallback((saved: Block) => {
    // Add to available blocks for both content and metadata use
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
  }, []);

  // Utility functions to get block content
  const getBlockContent = useCallback((blockId: number, type: MetadataType): string => {
    const block = availableMetadataBlocks[type]?.find((b) => b.id === blockId);
    if (!block) return '';
    if (typeof block.content === 'string') return block.content;
    const lang = getCurrentLanguage();
    return block.content[lang] || block.content.en || '';
  }, [availableMetadataBlocks]);

  const getBlockContentById = useCallback((blockId: number, type: MetadataType): string => {
    const block = availableMetadataBlocks[type]?.find((b) => b.id === blockId);
    if (!block) return '';
    if (typeof block.content === 'string') return block.content;
    const lang = getCurrentLanguage();
    return block.content[lang] || block.content.en || '';
  }, [availableMetadataBlocks]);

  // Preview content generation (combines metadata and content blocks)
  const generatePreviewContent = useCallback(() => {
    const parts: string[] = [];

    // Add metadata content (from metadata values, not content blocks)
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

    // Add content blocks (separate from metadata)
    blocks.forEach((block) => {
      const formatted = formatBlockForPreview(block);
      if (formatted) parts.push(formatted);
    });

    const html = parts.filter(Boolean).join('<br><br>');
    return highlightPlaceholders(html);
  }, [metadata, blocks]);

  const generatePreviewHtml = useCallback(() => {
    const parts: string[] = [];

    // Add metadata HTML (from metadata values)
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

    // Add content blocks HTML (separate from metadata)
    blocks.forEach((block) => {
      const content = typeof block.content === 'string'
        ? block.content
        : block.content[getCurrentLanguage()] || block.content.en || '';
      if (content) parts.push(buildPromptPartHtml(block.type, content, isDarkMode));
    });

    return parts.filter(Boolean).join('<br><br>');
  }, [metadata, blocks, isDarkMode]);

  // FIXED: Get metadata block mapping (ONLY metadata blocks, not content blocks)
  const getMetadataBlockMapping = useCallback((): Record<string, number | number[]> => {
    const mapping: Record<string, number | number[]> = {};

    // Single metadata mappings (ONLY metadata, not content)
    PRIMARY_METADATA.forEach((type) => {
      const blockId = metadata[type];
      if (blockId && blockId !== 0) {
        mapping[type] = blockId;
      }
    });

    // Secondary single metadata mappings
    SECONDARY_METADATA.forEach((type) => {
      if (!isMultipleMetadataType(type)) {
        const blockId = metadata[type as SingleMetadataType];
        if (blockId && blockId !== 0) {
          mapping[type] = blockId;
        }
      }
    });

    // Multiple metadata mappings
    if (metadata.constraints) {
      const constraintBlockIds = metadata.constraints
        .map(item => item.blockId)
        .filter((id): id is number => typeof id === 'number' && id !== 0);
      if (constraintBlockIds.length > 0) {
        mapping.constraints = constraintBlockIds;
      }
    }

    if (metadata.examples) {
      const exampleBlockIds = metadata.examples
        .map(item => item.blockId)
        .filter((id): id is number => typeof id === 'number' && id !== 0);
      if (exampleBlockIds.length > 0) {
        mapping.examples = exampleBlockIds;
      }
    }

    return mapping;
  }, [metadata]);

  const generateSeparatedPreviewHtml = useCallback(() => {
    const beforeParts: string[] = [];
    const afterParts: string[] = [];

    PRIMARY_ORDER.forEach(type => {
      const value = metadata.values?.[type];
      if (value) {
        beforeParts.push(formatMetadataForPreview(type, value));
      }
    });

    const remainingSingle = [
      ...PRIMARY_METADATA.filter(t => !PRIMARY_ORDER.includes(t as SingleMetadataType)),
      ...SECONDARY_METADATA.filter(t => !isMultipleMetadataType(t))
    ] as SingleMetadataType[];

    remainingSingle.forEach(type => {
      const value = metadata.values?.[type];
      if (value) {
        afterParts.push(formatMetadataForPreview(type, value));
      }
    });

    if (metadata.constraints) {
      metadata.constraints.forEach((c, i) => {
        if (c.value) {
          afterParts.push(formatMetadataForPreview('constraint' as any, `${i + 1}. ${c.value}`));
        }
      });
    }

    if (metadata.examples) {
      metadata.examples.forEach((e, i) => {
        if (e.value) {
          afterParts.push(formatMetadataForPreview('example' as any, `Example ${i + 1}: ${e.value}`));
        }
      });
    }

    const contentParts = blocks
      .map(b => formatBlockForPreview(b))
      .filter(Boolean);

    return {
      before: highlightPlaceholders(beforeParts.join('<br><br>')),
      content: highlightPlaceholders(contentParts.join('<br><br>')),
      after: highlightPlaceholders(afterParts.join('<br><br>'))
    };
  }, [metadata, blocks]);

  return {
    // Available blocks state
    availableMetadataBlocks,
    availableBlocksByType,
    
    // UI state
    expandedMetadata,
    setExpandedMetadata,
    previewExpanded,
    setPreviewExpanded,
    activeSecondaryMetadata,
    
    // Collapsible sections
    metadataCollapsed,
    setMetadataCollapsed,
    secondaryMetadataCollapsed,
    setSecondaryMetadataCollapsed,
    
    // Drag and drop
    draggedBlockId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    
    // FIXED: Metadata handlers (update ONLY metadata, not content blocks)
    handleSingleMetadataChange,
    handleCustomChange,
    handleAddMetadataItem,
    handleRemoveMetadataItem,
    handleUpdateMetadataItem,
    handleReorderMetadataItems,
    addSecondaryMetadata,
    removeSecondaryMetadata,
    
    // Block handlers (for content blocks only)
    handleBlockSaved,
    handleMetadataBlockSaved,
    
    // Preview content generation
    generatePreviewContent,
    generatePreviewHtml,

    generateSeparatedPreviewHtml,
    
    // FIXED: Metadata block mapping (ONLY metadata blocks)
    getMetadataBlockMapping
  };
}