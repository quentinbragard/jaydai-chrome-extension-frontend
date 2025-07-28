
// src/utils/templates/metadataPrefill.ts
import { blocksApi } from '@/services/api/BlocksApi';
import {
  PromptMetadata,
  DEFAULT_METADATA,
  PRIMARY_METADATA,
  SECONDARY_METADATA,
  SingleMetadataType,
  MultipleMetadataType,
  isMultipleMetadataType,
  generateMetadataItemId
} from '@/types/prompts/metadata';
import { getCurrentLanguage } from '@/core/utils/i18n';

// Quickly convert a metadata mapping to a PromptMetadata object using only IDs.
// This allows dialogs to immediately display selected metadata before block
// content has been fetched.
export function parseMetadataIds(
  metadataMapping: Record<string, any>
): PromptMetadata {
  const metadata: PromptMetadata = {
    ...DEFAULT_METADATA,
    values: {}
  };

  const getId = (val: any): number | undefined => {
    if (!val) return undefined;
    if (typeof val === 'number') return val;
    if (typeof val === 'object') {
      if (typeof val.blockId === 'number') return val.blockId;
      if (typeof val.block_id === 'number') return val.block_id;
      if (typeof val.id === 'number') return val.id;
    }
    return undefined;
  };

  for (const [type, value] of Object.entries(metadataMapping)) {
    const key =
      type === 'constraint'
        ? 'constraint'
        : type === 'example'
          ? 'example'
          : type;

    if (Array.isArray(value)) {
      const ids = value.map(getId).filter(id => typeof id === 'number' && id > 0) as number[];
      const items = ids.map(id => ({
        id: generateMetadataItemId(),
        blockId: id,
        value: ''
      }));
      if (items.length > 0) {
        (metadata as any)[key] = items;
      }
    } else {
      const id = getId(value);
      if (id && id > 0) {
        (metadata as any)[key] = id;
      }
    }
  }

  return metadata;
}

export async function prefillMetadataFromMapping(
  metadataMapping: Record<string, number | number[]>
): Promise<PromptMetadata> {
  
  const metadata: PromptMetadata = { 
    ...DEFAULT_METADATA,
    values: {}
  };
  
  try {
    for (const [type, value] of Object.entries(metadataMapping)) {
      // Handle single metadata types (role, context, goal, etc.)
      if (typeof value === 'number') {
        // ✅ Only process if value is valid
        if (value && value > 0) {
          try {
            const response = await blocksApi.getBlock(value);
            if (response.success && response.data) {
              const block = response.data;
              const content = typeof block.content === 'string' 
                ? block.content 
                : block.content[getCurrentLanguage()] || block.content.en || '';
              
              // Store the block ID and content
              const key =
                type === 'constraint'
                  ? 'constraint'
                  : type === 'example'
                    ? 'example'
                    : type;
              (metadata as any)[key] = value;
              metadata.values![type as SingleMetadataType] = content;
            } else {
              console.warn(`Failed to load block ${value} for ${type}:`, response.message);
            }
          } catch (error) {
            console.warn(`Error loading block ${value} for ${type}:`, error);
          }
        }
      }
      // Handle array values (constraint, example)
      else if (Array.isArray(value)) {
        // ✅ Filter out null/undefined/0 values
        const validIds = value.filter(id => id && typeof id === 'number' && id > 0);
        
        if (validIds.length > 0) {
          try {
            const blockPromises = validIds.map(id => blocksApi.getBlockById(id));
            const responses = await Promise.all(blockPromises);
            
            const items = responses
              .map((response, index) => {
                if (response.success && response.data) {
                  const content = typeof response.data.content === 'string' 
                    ? response.data.content 
                    : response.data.content[getCurrentLanguage()] || response.data.content.en || '';
                  
                  return {
                    id: generateMetadataItemId(),
                    value: content,
                    blockId: validIds[index]
                  };
                }
                return null;
              })
              .filter(item => item !== null);
            
            if (items.length > 0) {
              const key =
                type === 'constraint'
                  ? 'constraint'
                  : type === 'example'
                    ? 'example'
                    : type;
              (metadata as any)[key] = items;
            }
          } catch (error) {
            console.warn(`Failed to load blocks for ${type}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error prefilling metadata from mapping:', error);
  }
  
  return metadata;
}