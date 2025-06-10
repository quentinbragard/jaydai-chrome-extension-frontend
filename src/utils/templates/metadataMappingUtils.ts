// src/utils/templates/metadataMappingUtils.ts
import { 
    PromptMetadata, 
    DEFAULT_METADATA,
    SingleMetadataType,
    MultipleMetadataType,
    MetadataItem,
    generateMetadataItemId
  } from '@/types/prompts/metadata';
  
  /**
   * Convert template metadata mapping to PromptMetadata structure
   * This handles the conversion from saved template format to working format
   */
  export function convertMetadataMappingToPromptMetadata(
    metadataMapping: Record<string, number | number[]>
  ): PromptMetadata {
    const metadata: PromptMetadata = {
      ...DEFAULT_METADATA,
      values: {}
    };
  
    for (const [type, value] of Object.entries(metadataMapping)) {
      if (typeof value === 'number') {
        // Single metadata type
        if (value && value > 0) {
          (metadata as any)[type] = value;
          // Note: The actual content will be resolved later using the block cache
          metadata.values![type as SingleMetadataType] = ''; // Placeholder
        }
      } else if (Array.isArray(value)) {
        // Multiple metadata type (constraints, examples)
        const items: MetadataItem[] = value
          .filter(id => id && typeof id === 'number' && id > 0)
          .map(id => ({
            id: generateMetadataItemId(),
            blockId: id,
            value: '' // Placeholder, will be resolved later
          }));
        
        if (items.length > 0) {
          (metadata as any)[type] = items;
        }
      }
    }
  
    return metadata;
  }
  
  /**
   * Convert PromptMetadata back to metadata mapping for saving
   * This extracts the block IDs for storage
   */
  export function convertPromptMetadataToMapping(metadata: PromptMetadata): Record<string, number | number[]> {
    const mapping: Record<string, number | number[]> = {};
  
    // Handle single metadata types
    const singleTypes: SingleMetadataType[] = [
      'role', 'context', 'goal', 'audience', 'output_format', 'tone_style'
    ];
  
    singleTypes.forEach(type => {
      const blockId = metadata[type];
      if (blockId && blockId !== 0) {
        mapping[type] = blockId;
      }
    });
  
    // Handle multiple metadata types
    if (metadata.constraints && metadata.constraints.length > 0) {
      const constraintIds = metadata.constraints
        .map(item => item.blockId)
        .filter((id): id is number => typeof id === 'number' && id !== 0);
      
      if (constraintIds.length > 0) {
        mapping.constraints = constraintIds;
      }
    }
  
    if (metadata.examples && metadata.examples.length > 0) {
      const exampleIds = metadata.examples
        .map(item => item.blockId)
        .filter((id): id is number => typeof id === 'number' && id !== 0);
      
      if (exampleIds.length > 0) {
        mapping.examples = exampleIds;
      }
    }
  
    return mapping;
  }
  
  /**
   * Check if metadata has any actual content (either block IDs or custom values)
   */
  export function hasMetadataContent(metadata: PromptMetadata): boolean {
    // Check single metadata types
    const singleTypes: SingleMetadataType[] = [
      'role', 'context', 'goal', 'audience', 'output_format', 'tone_style'
    ];
  
    for (const type of singleTypes) {
      const blockId = metadata[type];
      const customValue = metadata.values?.[type];
      
      if ((blockId && blockId !== 0) || (customValue && customValue.trim())) {
        return true;
      }
    }
  
    // Check multiple metadata types
    if (metadata.constraints && metadata.constraints.length > 0) {
      const hasValidConstraints = metadata.constraints.some(item => 
        (item.blockId && item.blockId !== 0) || (item.value && item.value.trim())
      );
      if (hasValidConstraints) return true;
    }
  
    if (metadata.examples && metadata.examples.length > 0) {
      const hasValidExamples = metadata.examples.some(item => 
        (item.blockId && item.blockId !== 0) || (item.value && item.value.trim())
      );
      if (hasValidExamples) return true;
    }
  
    return false;
  }
  
  /**
   * Merge metadata from template with current editing metadata
   * This is useful when loading a template for editing
   */
  export function mergeMetadata(
    templateMetadata: PromptMetadata,
    currentMetadata: PromptMetadata
  ): PromptMetadata {
    const merged: PromptMetadata = {
      ...DEFAULT_METADATA,
      values: {
        ...templateMetadata.values,
        ...currentMetadata.values
      }
    };
  
    // Merge single metadata types (current takes precedence)
    const singleTypes: SingleMetadataType[] = [
      'role', 'context', 'goal', 'audience', 'output_format', 'tone_style'
    ];
  
    singleTypes.forEach(type => {
      const currentValue = currentMetadata[type];
      const templateValue = templateMetadata[type];
      
      merged[type] = currentValue !== undefined ? currentValue : templateValue;
    });
  
    // Merge multiple metadata types
    merged.constraints = currentMetadata.constraints || templateMetadata.constraints || [];
    merged.examples = currentMetadata.examples || templateMetadata.examples || [];
  
    return merged;
  }
  
  /**
   * Validate metadata structure and content
   */
  export function validateMetadata(metadata: PromptMetadata): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
  
    // Check for basic structure
    if (!metadata || typeof metadata !== 'object') {
      errors.push('Invalid metadata structure');
      return { isValid: false, errors, warnings };
    }
  
    // Check single metadata types
    const singleTypes: SingleMetadataType[] = [
      'role', 'context', 'goal', 'audience', 'output_format', 'tone_style'
    ];
  
    singleTypes.forEach(type => {
      const blockId = metadata[type];
      const customValue = metadata.values?.[type];
      
      if (blockId !== undefined && typeof blockId !== 'number') {
        errors.push(`Invalid block ID for ${type}: expected number`);
      }
      
      if (customValue !== undefined && typeof customValue !== 'string') {
        errors.push(`Invalid custom value for ${type}: expected string`);
      }
    });
  
    // Check multiple metadata types
    if (metadata.constraints) {
      if (!Array.isArray(metadata.constraints)) {
        errors.push('Constraints must be an array');
      } else {
        metadata.constraints.forEach((item, index) => {
          if (!item.id || typeof item.id !== 'string') {
            errors.push(`Constraint ${index}: missing or invalid ID`);
          }
          if (item.blockId !== undefined && typeof item.blockId !== 'number') {
            errors.push(`Constraint ${index}: invalid block ID`);
          }
          if (typeof item.value !== 'string') {
            errors.push(`Constraint ${index}: invalid value`);
          }
        });
      }
    }
  
    if (metadata.examples) {
      if (!Array.isArray(metadata.examples)) {
        errors.push('Examples must be an array');
      } else {
        metadata.examples.forEach((item, index) => {
          if (!item.id || typeof item.id !== 'string') {
            errors.push(`Example ${index}: missing or invalid ID`);
          }
          if (item.blockId !== undefined && typeof item.blockId !== 'number') {
            errors.push(`Example ${index}: invalid block ID`);
          }
          if (typeof item.value !== 'string') {
            errors.push(`Example ${index}: invalid value`);
          }
        });
      }
    }
  
    // Add warnings for empty metadata
    if (!hasMetadataContent(metadata)) {
      warnings.push('No metadata content found');
    }
  
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }