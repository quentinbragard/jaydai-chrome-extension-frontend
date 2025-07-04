// src/utils/templates/enhancedPreviewUtils.ts
import { PromptMetadata, SingleMetadataType, MultipleMetadataType } from '@/types/prompts/metadata';
import { Block, BlockType } from '@/types/prompts/blocks';
import { buildPromptPartHtml, getBlockTextColors } from '@/utils/prompts/blockUtils';

export interface VirtualBlock {
  id: string;
  type: BlockType;
  content: string;
  isFromMetadata: boolean;
  originalBlockId?: number;
  metadataType?: string;
  itemId?: string;
}

/**
 * Convert PromptMetadata to virtual blocks for unified preview rendering
 */
export function convertMetadataToVirtualBlocks(
  metadata: PromptMetadata,
  blockContentCache: Record<number, string> = {}
): VirtualBlock[] {
  const virtualBlocks: VirtualBlock[] = [];

  // Convert single metadata types (role, context, goal, etc.)
  const singleTypes: SingleMetadataType[] = [
    'role', 'context', 'goal', 'audience', 'output_format', 'tone_style'
  ];

  singleTypes.forEach((type, index) => {
    const blockId = metadata[type];
    const customValue = metadata.values?.[type];

    // Determine content: use block content from cache, custom value, or empty
    let content = '';
    if (blockId && blockId !== 0 && blockContentCache[blockId]) {
      content = blockContentCache[blockId];
    } else if (customValue?.trim()) {
      content = customValue;
    }

    // Only create virtual block if there's content
    if (content.trim()) {
      virtualBlocks.push({
        id: `metadata_${type}_${index}`,
        type: type as BlockType,
        content: content.trim(),
        isFromMetadata: true,
        originalBlockId: blockId && blockId !== 0 ? blockId : undefined,
        metadataType: type
      });
    }
  });

  // Convert multiple metadata types (constraint, example)
  if (metadata.constraint) {
    metadata.constraint.forEach((constraint, index) => {
      let content = '';
      if (constraint.blockId && blockContentCache[constraint.blockId]) {
        content = blockContentCache[constraint.blockId];
      } else if (constraint.value?.trim()) {
        content = constraint.value;
      }

      if (content.trim()) {
        virtualBlocks.push({
          id: `constraint_${constraint.id}_${index}`,
          type: 'constraint',
          content: content.trim(),
          isFromMetadata: true,
          originalBlockId: constraint.blockId,
          metadataType: 'constraint',
          itemId: constraint.id
        });
      }
    });
  }

  if (metadata.example) {
    metadata.example.forEach((example, index) => {
      let content = '';
      if (example.blockId && blockContentCache[example.blockId]) {
        content = blockContentCache[example.blockId];
      } else if (example.value?.trim()) {
        content = example.value;
      }

      if (content.trim()) {
        virtualBlocks.push({
          id: `example_${example.id}_${index}`,
          type: 'example',
          content: content.trim(),
          isFromMetadata: true,
          originalBlockId: example.blockId,
          metadataType: 'example',
          itemId: example.id
        });
      }
    });
  }

  return virtualBlocks;
}

/**
 * Generate unified preview HTML using the same system as InsertBlockDialog
 */
export function generateUnifiedPreviewHtml(
  metadata: PromptMetadata,
  content: string,
  blockContentCache: Record<number, string>,
  isDarkMode: boolean,
  options: {
    includeMainContent?: boolean;
    highlightPlaceholders?: boolean;
    enableBlockEditing?: boolean;
  } = {}
): string {
  const {
    includeMainContent = true,
    highlightPlaceholders = true,
    enableBlockEditing = false
  } = options;

  const virtualBlocks = convertMetadataToVirtualBlocks(metadata, blockContentCache);
  const htmlParts: string[] = [];

  // Generate HTML for each virtual block using the same system as InsertBlockDialog
  virtualBlocks.forEach(block => {
    const blockHtml = buildPromptPartHtml(block.type, block.content, isDarkMode);
    if (blockHtml.trim()) {
      htmlParts.push(blockHtml);
    }
  });

  // Add main content if provided and enabled
  if (includeMainContent && content?.trim()) {
    let processedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');

    // Highlight placeholders if enabled
    if (highlightPlaceholders) {
      processedContent = processedContent.replace(/\[([^\]]+)\]/g,
        '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
      );
    }

    htmlParts.push(processedContent);
  }

  return htmlParts.filter(Boolean).join('<br><br>');
}

/**
 * Generate plain text preview (for non-HTML contexts)
 */
export function generateUnifiedPreviewText(
  metadata: PromptMetadata,
  content: string,
  blockContentCache: Record<number, string>
): string {
  const virtualBlocks = convertMetadataToVirtualBlocks(metadata, blockContentCache);
  const textParts: string[] = [];

  // Generate text for each virtual block
  virtualBlocks.forEach(block => {
    const prefix = getBlockPrefix(block.type);
    const blockText = prefix ? `${prefix} ${block.content}` : block.content;
    if (blockText.trim()) {
      textParts.push(blockText);
    }
  });

  // Add main content
  if (content?.trim()) {
    textParts.push(content);
  }

  return textParts.filter(Boolean).join('\n\n');
}

/**
 * Get block prefix for text generation
 */
function getBlockPrefix(type: BlockType): string {
  const prefixes: Record<BlockType, string> = {
    role: 'Ton rôle est de',
    context: 'Le contexte est',
    goal: 'Ton objectif est',
    audience: "L'audience ciblée est",
    output_format: 'Le format attendu est',
    tone_style: 'Le ton et style sont',
    constraint: 'Contrainte:',
    example: 'Exemple:',
    custom: ''
  };
  
  return prefixes[type] || '';
}

/**
 * Enhanced preview generator that handles different modes
 */
export function generateEnhancedPreview(
  metadata: PromptMetadata,
  content: string,
  blockContentCache: Record<number, string>,
  isDarkMode: boolean,
  mode: 'create' | 'customize' | 'view' = 'view',
  format: 'html' | 'text' = 'html'
): string {
  const options = {
    includeMainContent: true,
    highlightPlaceholders: mode === 'customize' || mode === 'view',
    enableBlockEditing: mode === 'create'
  };

  if (format === 'html') {
    return generateUnifiedPreviewHtml(metadata, content, blockContentCache, isDarkMode, options);
  } else {
    return generateUnifiedPreviewText(metadata, content, blockContentCache);
  }
}

/**
 * Get preview statistics for debugging/UI
 */
export function getPreviewStats(
  metadata: PromptMetadata,
  content: string,
  blockContentCache: Record<number, string>
): {
  totalBlocks: number;
  metadataBlocks: number;
  customValues: number;
  placeholders: number;
  contentLength: number;
} {
  const virtualBlocks = convertMetadataToVirtualBlocks(metadata, blockContentCache);
  const placeholderMatches = content.match(/\[([^\]]+)\]/g) || [];
  
  const customValues = Object.values(metadata.values || {}).filter(v => v?.trim()).length;

  return {
    totalBlocks: virtualBlocks.length,
    metadataBlocks: virtualBlocks.filter(b => b.isFromMetadata).length,
    customValues,
    placeholders: placeholderMatches.length,
    contentLength: content.length
  };
}

/**
 * Extract placeholder values from virtual blocks (for customize mode)
 */
export function extractPlaceholdersFromBlocks(
  virtualBlocks: VirtualBlock[]
): Array<{ key: string; value: string; blockId?: number }> {
  const placeholders: Array<{ key: string; value: string; blockId?: number }> = [];
  
  virtualBlocks.forEach(block => {
    const matches = block.content.match(/\[([^\]]+)\]/g);
    if (matches) {
      matches.forEach(match => {
        const key = match.slice(1, -1); // Remove brackets
        placeholders.push({
          key,
          value: '',
          blockId: block.originalBlockId
        });
      });
    }
  });

  return placeholders;
}

/**
 * Replace placeholders in virtual blocks
 */
export function replacePlaceholdersInBlocks(
  virtualBlocks: VirtualBlock[],
  replacements: Record<string, string>
): VirtualBlock[] {
  return virtualBlocks.map(block => ({
    ...block,
    content: block.content.replace(/\[([^\]]+)\]/g, (match, key) => {
      return replacements[key] || match;
    })
  }));
}