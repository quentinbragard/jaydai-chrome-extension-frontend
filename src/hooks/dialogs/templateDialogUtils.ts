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
  isMultipleMetadataType,
  METADATA_CONFIGS
} from '@/types/prompts/metadata';
import { buildCompletePrompt } from '@/components/prompts/promptUtils';
import { blocksApi } from '@/services/api/BlocksApi';

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
  // Regardless of editor mode we only persist the main content.
  // Metadata is stored separately in the template.metadata field.
  return content;
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

/**
 * Ensure all metadata items have associated blocks. Any metadata value without
 * a block ID will be saved as a new block so that the backend can persist it
 * properly. Returns an updated metadata object with the newly created block IDs.
 */
export async function ensureMetadataBlocks(metadata: PromptMetadata): Promise<PromptMetadata> {
  let updated: PromptMetadata = { ...metadata, values: { ...(metadata.values || {}) } };

  const createBlockFor = async (type: SingleMetadataType | MultipleMetadataType, value: string): Promise<number | null> => {
    try {
      const res = await blocksApi.createBlock({
        type: METADATA_CONFIGS[type].blockType,
        content: { en: value }
      });
      return res.success && res.data ? res.data.id : null;
    } catch {
      return null;
    }
  };

  // Handle single metadata types
  const singleTypes: SingleMetadataType[] = ['role','context','goal','audience','tone_style','output_format'];
  for (const type of singleTypes) {
    const id = updated[type];
    const val = updated.values?.[type];
    if ((!id || id === 0) && val && val.trim()) {
      const newId = await createBlockFor(type, val.trim());
      if (newId) {
        updated = { ...updated, [type]: newId };
      }
    }
  }

  // Helper for multiple metadata arrays
  const processItems = async (items: MetadataItem[] | undefined, type: MultipleMetadataType) => {
    if (!items) return [] as MetadataItem[];
    const result: MetadataItem[] = [];
    for (const item of items) {
      let newItem = { ...item };
      if ((!item.blockId || item.blockId === 0) && item.value.trim()) {
        const id = await createBlockFor(type, item.value.trim());
        if (id) newItem.blockId = id;
      }
      result.push(newItem);
    }
    return result;
  };

  updated.constraints = await processItems(updated.constraints, 'constraint');
  updated.examples = await processItems(updated.examples, 'example');

  return updated;
}