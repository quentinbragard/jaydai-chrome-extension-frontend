// src/utils/prompts/metadataUtils.ts - Enhanced version with better parsing

import { 
  PromptMetadata, 
  MetadataType, 
  SingleMetadataType, 
  MultipleMetadataType,
  MetadataItem,
  DEFAULT_METADATA,
  PRIMARY_METADATA,
  SECONDARY_METADATA,
  isMultipleMetadataType
} from '@/types/prompts/metadata';

// Enhanced function to parse template metadata into proper format
export function parseTemplateMetadata(rawMetadata: any): PromptMetadata {
  if (!rawMetadata || typeof rawMetadata !== 'object') {
    return createMetadata();
  }

  const parsed: PromptMetadata = createMetadata();

  // Handle single metadata types (role, context, goal, etc.)
  const singleTypes: SingleMetadataType[] = ['role', 'context', 'goal', 'audience', 'output_format', 'tone_style'];
  
  singleTypes.forEach(type => {
    if (rawMetadata[type]) {
      // Handle both direct ID assignment and object format
      if (typeof rawMetadata[type] === 'number') {
        parsed[type] = rawMetadata[type];
      } else if (typeof rawMetadata[type] === 'object' && rawMetadata[type].blockId) {
        parsed[type] = rawMetadata[type].blockId;
      } else if (typeof rawMetadata[type] === 'string') {
        // Handle custom values
        parsed.values = parsed.values || {};
        parsed.values[type] = rawMetadata[type];
        parsed[type] = 0; // No block selected, custom value
      }
    }
  });

  // Handle multiple metadata types (constraint, example)
  const multipleTypes: MultipleMetadataType[] = ['constraint', 'example'];
  
  multipleTypes.forEach(type => {
    if (rawMetadata[type] && Array.isArray(rawMetadata[type])) {
      parsed[type] = rawMetadata[type].map((item: any, index: number) => {
        // Ensure each item has required structure
        const metadataItem: MetadataItem = {
          id: item.id || `${type}_${Date.now()}_${index}`,
          value: item.value || '',
          blockId: item.blockId || undefined
        };
        
        return metadataItem;
      });
    }
  });

  // Handle values object for custom inputs
  if (rawMetadata.values && typeof rawMetadata.values === 'object') {
    parsed.values = { ...parsed.values, ...rawMetadata.values };
  }

  console.log('Parsed metadata from raw:', { rawMetadata, parsed });
  
  return parsed;
}

// Enhanced function to convert metadata back to block mapping format
export function metadataToBlockMapping(metadata: PromptMetadata): Record<string, any> {
  const mapping: Record<string, any> = {};
  
  // Handle single metadata types
  const singleTypes: SingleMetadataType[] = ['role', 'context', 'goal', 'audience', 'output_format', 'tone_style'];
  
  singleTypes.forEach(type => {
    const blockId = metadata[type];
    const customValue = metadata.values?.[type];
    
    if (blockId && blockId !== 0) {
      mapping[type] = blockId;
    } else if (customValue && customValue.trim()) {
      mapping[type] = customValue.trim();
    }
  });
  
  // Handle multiple metadata types
  const multipleTypes: MultipleMetadataType[] = ['constraint', 'example'];
  
  multipleTypes.forEach(type => {
    const items = metadata[type];
    if (items && items.length > 0) {
      mapping[type] = items.filter(item => 
        item.blockId || (item.value && item.value.trim())
      );
    }
  });
  
  return mapping;
}

// Function to create default metadata structure
export function createMetadata(): PromptMetadata {
  return {
    role: 0,
    context: 0,
    goal: 0,
    audience: 0,
    output_format: 0,
    tone_style: 0,
    constraint: [],
    example: [],
    values: {}
  };
}

// Function to update single metadata value
export function updateSingleMetadata(
  metadata: PromptMetadata, 
  type: SingleMetadataType, 
  blockId: number
): PromptMetadata {
  const updated = { ...metadata };
  updated[type] = blockId;
  
  // Clear custom value if selecting a block
  if (blockId !== 0 && updated.values?.[type]) {
    updated.values = { ...updated.values };
    delete updated.values[type];
  }
  
  return updated;
}

// Function to update custom value
export function updateCustomValue(
  metadata: PromptMetadata, 
  type: SingleMetadataType, 
  value: string
): PromptMetadata {
  const updated = { ...metadata };
  updated.values = { ...updated.values, [type]: value };
  
  // Clear block ID if entering custom value
  if (value.trim()) {
    updated[type] = 0;
  }
  
  return updated;
}

// Function to add metadata item for multiple types
export function addMetadataItem(
  metadata: PromptMetadata, 
  type: MultipleMetadataType, 
  item?: Partial<MetadataItem>
): PromptMetadata {
  const updated = { ...metadata };
  const currentItems = updated[type] || [];
  
  const newItem: MetadataItem = {
    id: item?.id || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    value: item?.value || '',
    blockId: item?.blockId
  };
  
  updated[type] = [...currentItems, newItem];
  return updated;
}

// Function to remove metadata item
export function removeMetadataItem(
  metadata: PromptMetadata, 
  type: MultipleMetadataType, 
  itemId: string
): PromptMetadata {
  const updated = { ...metadata };
  const currentItems = updated[type] || [];
  updated[type] = currentItems.filter(item => item.id !== itemId);
  return updated;
}

// Function to update metadata item
export function updateMetadataItem(
  metadata: PromptMetadata, 
  type: MultipleMetadataType, 
  itemId: string, 
  updates: Partial<MetadataItem>
): PromptMetadata {
  const updated = { ...metadata };
  const currentItems = updated[type] || [];
  
  updated[type] = currentItems.map(item => 
    item.id === itemId ? { ...item, ...updates } : item
  );
  
  return updated;
}

// Function to reorder metadata items
export function reorderMetadataItems(
  metadata: PromptMetadata, 
  type: MultipleMetadataType, 
  newItems: MetadataItem[]
): PromptMetadata {
  const updated = { ...metadata };
  updated[type] = newItems;
  return updated;
}

// Function to add secondary metadata type
export function addSecondaryMetadata(metadata: PromptMetadata, type: MetadataType): PromptMetadata {
  const updated = { ...metadata };
  
  if (isMultipleMetadataType(type)) {
    const multiType = type as MultipleMetadataType;
    if (!updated[multiType]) {
      updated[multiType] = [];
    }
  } else {
    const singleType = type as SingleMetadataType;
    if (!updated[singleType]) {
      updated[singleType] = 0;
    }
    if (!updated.values) {
      updated.values = {};
    }
    if (!updated.values[singleType]) {
      updated.values[singleType] = '';
    }
  }
  
  return updated;
}

// Function to remove secondary metadata type
export function removeSecondaryMetadata(metadata: PromptMetadata, type: MetadataType): PromptMetadata {
  const updated = { ...metadata };
  
  if (isMultipleMetadataType(type)) {
    const multiType = type as MultipleMetadataType;
    delete (updated as any)[multiType];
  } else {
    const singleType = type as SingleMetadataType;
    delete (updated as any)[singleType];
    if (updated.values) {
      const { [singleType]: _removed, ...restValues } = updated.values;
      updated.values = restValues;
    }
  }
  
  return updated;
}

// Function to get active secondary metadata types
export function getActiveSecondaryMetadata(metadata: PromptMetadata): Set<MetadataType> {
  const activeSet = new Set<MetadataType>();
  
  SECONDARY_METADATA.forEach(type => {
    if (isMultipleMetadataType(type)) {
      const multiType = type as MultipleMetadataType;
      if (metadata[multiType] && metadata[multiType]!.length > 0) {
        activeSet.add(type);
      }
    } else {
      const singleType = type as SingleMetadataType;
      const hasBlockId = metadata[singleType] && metadata[singleType] !== 0;
      const hasCustomValue = metadata.values?.[singleType]?.trim();
      
      if (hasBlockId || hasCustomValue) {
        activeSet.add(type);
      }
    }
  });
  
  return activeSet;
}

// Function to get filled metadata types (for expansion)
export function getFilledMetadataTypes(metadata: PromptMetadata): Set<MetadataType> {
  const filledSet = new Set<MetadataType>();
  
  // Check primary metadata
  PRIMARY_METADATA.forEach(type => {
    if (isMultipleMetadataType(type)) {
      const multiType = type as MultipleMetadataType;
      if (metadata[multiType] && metadata[multiType]!.length > 0) {
        filledSet.add(type);
      }
    } else {
      const singleType = type as SingleMetadataType;
      const hasBlockId = metadata[singleType] && metadata[singleType] !== 0;
      const hasCustomValue = metadata.values?.[singleType]?.trim();
      
      if (hasBlockId || hasCustomValue) {
        filledSet.add(type);
      }
    }
  });
  
  // Add active secondary metadata
  const activeSecondary = getActiveSecondaryMetadata(metadata);
  activeSecondary.forEach(type => filledSet.add(type));
  
  return filledSet;
}

// Function to extract custom values
export function extractCustomValues(metadata: PromptMetadata): Record<string, string> {
  return { ...metadata.values } || {};
}

// Function to validate metadata
export function validateMetadata(metadata: PromptMetadata): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // At least one primary metadata should be filled
  const hasPrimaryContent = PRIMARY_METADATA.some(type => {
    if (isMultipleMetadataType(type)) {
      const multiType = type as MultipleMetadataType;
      return metadata[multiType] && metadata[multiType]!.length > 0;
    } else {
      const singleType = type as SingleMetadataType;
      const hasBlockId = metadata[singleType] && metadata[singleType] !== 0;
      const hasCustomValue = metadata.values?.[singleType]?.trim();
      return hasBlockId || hasCustomValue;
    }
  });
  
  if (!hasPrimaryContent) {
    errors.push('At least one primary metadata field should be filled');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}