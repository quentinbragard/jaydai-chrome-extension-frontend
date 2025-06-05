import { Block, BlockType } from '@/types/prompts/blocks';
import { getCurrentLanguage } from '@/core/utils/i18n';
import {
  PromptMetadata,
  MetadataItem,
  MultipleMetadataType,
  SingleMetadataType,
  generateMetadataItemId,
  PRIMARY_METADATA,
  SECONDARY_METADATA,
  isMultipleMetadataType
} from '@/types/prompts/metadata';
import { buildCompletePrompt } from '@/components/prompts/promptUtils';

export function validateEnhancedTemplateForm(
  name: string,
  content: string,
  blocks: Block[],
  metadata: PromptMetadata,
  activeTab: 'basic' | 'advanced'
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!name?.trim()) errors.name = 'templateNameRequired';

  if (activeTab === 'basic' && !content?.trim()) {
    errors.content = 'templateContentRequired';
  }

  if (activeTab === 'advanced') {
    // Check for content blocks (excluding metadata blocks)
    const hasContentBlocks = blocks.some(b => {
      const blockContent = typeof b.content === 'string'
        ? b.content
        : (b.content as any)[getCurrentLanguage()] || (b.content as any).en || '';
      return blockContent.trim();
    });

    // Check for metadata content
    const hasMetadataContent =
      Object.values(metadata.values || {}).some(v => v?.trim()) ||
      (metadata.constraints && metadata.constraints.some(c => c.value.trim())) ||
      (metadata.examples && metadata.examples.some(e => e.value.trim()));

    if (!hasContentBlocks && !hasMetadataContent) {
      errors.content = 'templateContentRequired';
    }
  }

  return errors;
}

export function generateEnhancedFinalContent(
  content: string,
  blocks: Block[],
  metadata: PromptMetadata,
  activeTab: 'basic' | 'advanced'
): string {
  if (activeTab === 'basic') return content;
  return buildCompletePrompt(metadata, blocks);
}

/**
 * FIXED: Get ONLY content block IDs, NOT metadata block IDs
 * Metadata blocks should be saved in metadata field, not blocks field
 */
export function getEnhancedContentBlockIds(
  blocks: Block[],
  activeTab: 'basic' | 'advanced'
): number[] {
  if (activeTab === 'basic') return [];
  
  // ONLY return content blocks (blocks that are in the content section)
  // NOT metadata blocks (blocks selected in metadata dropdowns)
  return blocks
    .filter(b => b.id > 0 && !b.isNew)
    .map(b => b.id);
}

/**
 * FIXED: Get ONLY metadata block IDs for the metadata field
 * This is what should be saved as template.metadata
 */
export function getMetadataBlockMapping(
  metadata: PromptMetadata,
  activeTab: 'basic' | 'advanced'
): Record<string, number | number[]> {
  if (activeTab === 'basic') return {};

  const mapping: Record<string, number | number[]> = {};

  // Handle primary metadata (single block IDs)
  PRIMARY_METADATA.forEach(type => {
    const blockId = metadata[type];
    if (blockId && blockId !== 0) {
      mapping[type] = blockId;
    }
  });

  // Handle secondary single metadata
  SECONDARY_METADATA.forEach(type => {
    if (!isMultipleMetadataType(type)) {
      const blockId = metadata[type as SingleMetadataType];
      if (blockId && blockId !== 0) {
        mapping[type] = blockId;
      }
    }
  });

  // Handle multiple metadata (arrays of block IDs)
  if (metadata.constraints && metadata.constraints.length > 0) {
    const constraintBlockIds = metadata.constraints
      .map(c => c.blockId)
      .filter((id): id is number => typeof id === 'number' && id !== 0);
    if (constraintBlockIds.length > 0) {
      mapping.constraints = constraintBlockIds;
    }
  }

  if (metadata.examples && metadata.examples.length > 0) {
    const exampleBlockIds = metadata.examples
      .map(e => e.blockId)
      .filter((id): id is number => typeof id === 'number' && id !== 0);
    if (exampleBlockIds.length > 0) {
      mapping.examples = exampleBlockIds;
    }
  }

  return mapping;
}

/**
 * FIXED: Create comprehensive enhanced metadata object for saving
 * This separates metadata blocks from content blocks
 */
export function createEnhancedMetadataForSaving(
  metadata: PromptMetadata,
  activeTab: 'basic' | 'advanced'
): any {
  if (activeTab === 'basic') return null;

  const enhancedMetadata = {
    // Save the complete metadata structure
    ...metadata,
    
    // Add metadata about the structure itself
    _meta: {
      version: '1.0',
      createdAt: new Date().toISOString(),
      editorMode: activeTab,
      hasConstraints: (metadata.constraints?.length || 0) > 0,
      hasExamples: (metadata.examples?.length || 0) > 0,
      blockMapping: getMetadataBlockMapping(metadata, activeTab)
    }
  };

  return enhancedMetadata;
}

/**
 * FIXED: Parse template metadata and ensure proper reconstruction
 */
export function parseTemplateMetadata(enhancedMetadata: any): PromptMetadata {
  if (!enhancedMetadata) return { values: {} } as PromptMetadata;

  const parsedMetadata: PromptMetadata = { values: {} };

  // Parse metadata values (the actual content)
  if (enhancedMetadata.values) {
    parsedMetadata.values = { ...enhancedMetadata.values };
  }

  // Parse single metadata block references
  PRIMARY_METADATA.forEach(type => {
    if (enhancedMetadata[type] && enhancedMetadata[type] !== 0) {
      parsedMetadata[type] = enhancedMetadata[type];
    }
  });

  SECONDARY_METADATA.forEach(type => {
    if (!isMultipleMetadataType(type)) {
      if (enhancedMetadata[type] && enhancedMetadata[type] !== 0) {
        parsedMetadata[type as SingleMetadataType] = enhancedMetadata[type];
      }
    }
  });

  // Parse multiple metadata with block references
  if (enhancedMetadata.constraints && Array.isArray(enhancedMetadata.constraints)) {
    parsedMetadata.constraints = enhancedMetadata.constraints.map((item: any) => ({
      id: item.id || generateMetadataItemId(),
      blockId: item.blockId,
      value: item.value || ''
    }));
  }

  if (enhancedMetadata.examples && Array.isArray(enhancedMetadata.examples)) {
    parsedMetadata.examples = enhancedMetadata.examples.map((item: any) => ({
      id: item.id || generateMetadataItemId(),
      blockId: item.blockId,
      value: item.value || ''
    }));
  }

  return parsedMetadata;
}


export function addMetadataItem(
  metadata: PromptMetadata,
  type: MultipleMetadataType
): PromptMetadata {
  const newItem: MetadataItem = {
    id: generateMetadataItemId(),
    value: ''
  };

  return {
    ...metadata,
    [type]: [...(metadata[type] || []), newItem]
  };
}

export function removeMetadataItem(
  metadata: PromptMetadata,
  type: MultipleMetadataType,
  itemId: string
): PromptMetadata {
  return {
    ...metadata,
    [type]: (metadata[type] || []).filter(item => item.id !== itemId)
  };
}

export function updateMetadataItem(
  metadata: PromptMetadata,
  type: MultipleMetadataType,
  itemId: string,
  updates: Partial<MetadataItem>
): PromptMetadata {
  return {
    ...metadata,
    [type]: (metadata[type] || []).map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    )
  };
}

export function reorderMetadataItems(
  metadata: PromptMetadata,
  type: MultipleMetadataType,
  newItems: MetadataItem[]
): PromptMetadata {
  return {
    ...metadata,
    [type]: newItems
  };
}

export function createBlock(
  blockType?: BlockType | null,
  existingBlock?: Block,
  duplicate?: boolean
): Block {
  if (existingBlock) {
    return duplicate
      ? { ...existingBlock, id: Date.now() + Math.random(), isNew: true }
      : { ...existingBlock, isNew: false };
  }

  return {
    id: Date.now() + Math.random(),
    type: blockType || null,
    content: '',
    name: blockType
      ? `New ${blockType.charAt(0).toUpperCase() + blockType.slice(1)} Block`
      : 'New Block',
    description: '',
    isNew: true
  };
}

export function addBlock(
  blocks: Block[],
  position: 'start' | 'end',
  block: Block
): Block[] {
  const newBlocks = [...blocks];
  if (position === 'start') {
    newBlocks.unshift(block);
  } else {
    newBlocks.push(block);
  }
  return newBlocks;
}

export function removeBlock(blocks: Block[], blockId: number): Block[] {
  return blocks.filter(block => block.id !== blockId);
}

export function updateBlock(
  blocks: Block[],
  blockId: number,
  updatedBlock: Partial<Block>
): Block[] {
  return blocks.map(block => (block.id === blockId ? { ...block, ...updatedBlock } : block));
}

export function reorderBlocks(blocks: Block[], newBlocks: Block[]): Block[] {
  return [...newBlocks];
}

export function moveBlock(
  blocks: Block[],
  blockId: number,
  direction: 'up' | 'down'
): Block[] {
  const currentIndex = blocks.findIndex(block => block.id === blockId);
  if (
    currentIndex === -1 ||
    (direction === 'up' && currentIndex === 0) ||
    (direction === 'down' && currentIndex === blocks.length - 1)
  ) {
    return blocks;
  }
  const updated = [...blocks];
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  [updated[currentIndex], updated[targetIndex]] = [updated[targetIndex], updated[currentIndex]];
  return updated;
}