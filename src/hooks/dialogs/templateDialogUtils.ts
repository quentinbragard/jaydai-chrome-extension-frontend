// src/hooks/dialogs/templateDialogUtils.ts
import { Block, BlockType } from '@/types/prompts/blocks';
import { getCurrentLanguage } from '@/core/utils/i18n';
import {
  PromptMetadata,
  MetadataItem,
  MultipleMetadataType,
  SingleMetadataType,
  generateMetadataItemId
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
    const hasBlockContent = blocks.some(b => {
      const blockContent =
        typeof b.content === 'string'
          ? b.content
          : (b.content as any)[getCurrentLanguage()] || (b.content as any).en || '';
      return blockContent.trim();
    });

    const hasMetadataContent =
      Object.values(metadata.values || {}).some(v => v?.trim()) ||
      (metadata.constraints && metadata.constraints.some(c => c.value.trim())) ||
      (metadata.examples && metadata.examples.some(e => e.value.trim()));

    if (!hasBlockContent && !hasMetadataContent) {
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

export function getEnhancedBlockIds(
  blocks: Block[],
  metadata: PromptMetadata,
  activeTab: 'basic' | 'advanced'
): number[] {
  if (activeTab === 'basic') return [];
  const metadataIds: number[] = [];

  ['role', 'context', 'goal', 'audience', 'tone_style', 'output_format'].forEach(
    type => {
      const id = metadata[type as SingleMetadataType];
      if (id && id !== 0) metadataIds.push(id);
    }
  );

  if (metadata.constraints) {
    metadata.constraints.forEach(constraint => {
      if (constraint.blockId && constraint.blockId !== 0) {
        metadataIds.push(constraint.blockId);
      }
    });
  }

  if (metadata.examples) {
    metadata.examples.forEach(example => {
      if (example.blockId && example.blockId !== 0) {
        metadataIds.push(example.blockId);
      }
    });
  }

  const contentIds = blocks.filter(b => b.id > 0 && !b.isNew).map(b => b.id);
  return [...metadataIds, ...contentIds];
}

// Build a mapping of metadata types to block IDs used
export function getMetadataBlockMapping(
  metadata: PromptMetadata,
  activeTab: 'basic' | 'advanced'
): Record<string, number | number[] | undefined> {
  if (activeTab === 'basic') return {};

  const mapping: Record<string, number | number[] | undefined> = {};

  ['role', 'context', 'goal', 'audience', 'tone_style', 'output_format'].forEach(
    type => {
      const id = metadata[type as SingleMetadataType];
      if (id && id !== 0) mapping[type] = id;
    }
  );

  if (metadata.constraints) {
    const ids = metadata.constraints
      .map(c => c.blockId)
      .filter((id): id is number => typeof id === 'number' && id !== 0);
    if (ids.length > 0) mapping.constraints = ids;
  }

  if (metadata.examples) {
    const ids = metadata.examples
      .map(e => e.blockId)
      .filter((id): id is number => typeof id === 'number' && id !== 0);
    if (ids.length > 0) mapping.examples = ids;
  }

  return mapping;
}


import { DEFAULT_METADATA } from '@/types/prompts/metadata';

export function parseTemplateMetadata(enhancedMetadata: any): PromptMetadata {
  const parsedMetadata: PromptMetadata = { ...DEFAULT_METADATA };

  if (enhancedMetadata.values) {
    parsedMetadata.values = { ...enhancedMetadata.values };
  }

  ['role', 'context', 'goal', 'audience', 'tone_style', 'output_format'].forEach(
    type => {
      if (enhancedMetadata[type]) {
        parsedMetadata[type as SingleMetadataType] = enhancedMetadata[type];
      }
    }
  );

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
