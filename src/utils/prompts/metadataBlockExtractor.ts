// utils/prompts/metadataBlockExtractor.ts
import { PromptMetadata } from '@/types/prompts/metadata';

/**
 * Extract all block IDs from template metadata
 * @param metadata - The template metadata object
 * @returns Array of unique block IDs found in metadata
 */
export function extractBlockIdsFromMetadata(metadata: any): number[] {
  if (!metadata) return [];

  const blockIds = new Set<number>();

  // Extract from single metadata fields
  const singleFields = ['role', 'context', 'goal', 'tone_style', 'output_format', 'audience'];
  
  singleFields.forEach(field => {
    const value = metadata[field];
    if (value && typeof value === 'number' && value !== 0) {
      blockIds.add(value);
    }
  });

  // Extract from multiple metadata fields (arrays of items with blockId)
  const multipleFields = ['example', 'constraint'];
  
  multipleFields.forEach(field => {
    const items = metadata[field];
    if (Array.isArray(items)) {
      items.forEach(item => {
        if (item && typeof item === 'object' && item.blockId && item.blockId !== 0) {
          blockIds.add(item.blockId);
        }
      });
    }
  });

  return Array.from(blockIds);
}

/**
 * Extract block IDs from parsed template metadata (handles both old and new formats)
 * @param metadata - Template metadata that might be in different formats
 * @returns Array of unique block IDs
 */
export function extractBlockIdsFromTemplateMetadata(metadata: any): number[] {
  if (!metadata) return [];

  // Handle direct metadata object
  if (typeof metadata === 'object') {
    return extractBlockIdsFromMetadata(metadata);
  }

  // Handle stringified metadata
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return extractBlockIdsFromMetadata(parsed);
    } catch (error) {
      console.warn('Failed to parse metadata string:', error);
      return [];
    }
  }

  return [];
}