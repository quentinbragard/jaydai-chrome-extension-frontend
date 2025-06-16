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
  metadataMapping: Record<string, number | number[]>
): PromptMetadata {
  const metadata: PromptMetadata = {
    ...DEFAULT_METADATA,
    values: {}
  };

  const keyMap: Record<string, 'constraints' | 'examples'> = {
    constraint: 'constraints',
    example: 'examples'
  };

  for (const [rawType, value] of Object.entries(metadataMapping)) {
    const type = (keyMap[rawType] || rawType) as string;
    if (typeof value === 'number') {
      if (value && value > 0) {
        (metadata as any)[type] = value;
      }
    } else if (Array.isArray(value)) {
      const items = value
        .filter(id => id && typeof id === 'number' && id > 0)
        .map(id => ({
          id: generateMetadataItemId(),
          blockId: id,
          value: ''
        }));
      if (items.length > 0) {
        (metadata as any)[type] = items;
      }
    }
  }

  return metadata;
}

export async function prefillMetadataFromMapping(
  metadataMapping: Record<string, number | number[]>
): Promise<PromptMetadata> {
  console.log('Prefilling metadata from mapping:', metadataMapping);

  const metadata: PromptMetadata = {
    ...DEFAULT_METADATA,
    values: {}
  };

  const keyMap: Record<string, 'constraints' | 'examples'> = {
    constraint: 'constraints',
    example: 'examples'
  };

  try {
    for (const [rawType, value] of Object.entries(metadataMapping)) {
      const type = (keyMap[rawType] || rawType) as string;
      console.log(`Processing metadata type: ${type}, value:`, value);
      
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
              
              console.log(`Loaded block ${value} for ${type}:`, content);
              
              // Store the block ID and content
              (metadata as any)[type] = value;
              metadata.values![type as SingleMetadataType] = content;
            } else {
              console.warn(`Failed to load block ${value} for ${type}:`, response.message);
            }
          } catch (error) {
            console.warn(`Error loading block ${value} for ${type}:`, error);
          }
        } else {
          console.log(`Skipping invalid block ID for ${type}:`, value);
        }
      }
      // Handle array values (constraints, examples)
      else if (Array.isArray(value)) {
        // ✅ Filter out null/undefined/0 values
        const validIds = value.filter(id => id && typeof id === 'number' && id > 0);
        console.log(`Processing array for ${type}, valid IDs:`, validIds);
        
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
            
            console.log(`Loaded ${items.length} items for ${type}:`, items);
            
            if (items.length > 0) {
              (metadata as any)[type] = items;
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
  
  console.log('Final prefilled metadata:', metadata);
  return metadata;
}