// src/utils/prompts/metadataUtils.ts
import {
  PromptMetadata,
  DEFAULT_METADATA,
  MetadataType,
  SingleMetadataType,
  MultipleMetadataType,
  MetadataItem,
  PRIMARY_METADATA,
  SECONDARY_METADATA,
  isMultipleMetadataType,
  isSingleMetadataType,
  generateMetadataItemId
} from '@/types/prompts/metadata';
import { resolveMetadataValues } from '@/utils/templates/promptPreviewUtils';

// Map singular metadata types to their property keys on PromptMetadata
const MULTI_TYPE_KEY_MAP: Record<MultipleMetadataType, 'constraints' | 'examples'> = {
  constraint: 'constraints',
  example: 'examples'
};

// ============================================================================
// CORE METADATA OPERATIONS
// ============================================================================

/**
 * Create a fresh metadata instance
 */
export function createMetadata(initial?: Partial<PromptMetadata>): PromptMetadata {
  return {
    ...DEFAULT_METADATA,
    values: {},
    ...initial
  };
}

/**
 * Deep clone metadata to avoid mutations
 */
export function cloneMetadata(metadata: PromptMetadata): PromptMetadata {
  return {
    ...metadata,
    values: { ...metadata.values },
    constraints: metadata.constraints?.map(item => ({ ...item })),
    examples: metadata.examples?.map(item => ({ ...item }))
  };
}

// ============================================================================
// SINGLE METADATA OPERATIONS
// ============================================================================

/**
 * Update a single metadata type (role, context, goal, etc.)
 */
export function updateSingleMetadata(
  metadata: PromptMetadata,
  type: SingleMetadataType,
  blockId: number,
  customValue?: string
): PromptMetadata {
  const updated = cloneMetadata(metadata);
  
  // Set the block ID
  (updated as any)[type] = blockId;
  
  // Clear custom value when selecting a block, or set it when provided
  if (!updated.values) updated.values = {};
  updated.values[type] = blockId === 0 ? (customValue || '') : '';
  
  return updated;
}

/**
 * Update custom value for a single metadata type
 */
export function updateCustomValue(
  metadata: PromptMetadata,
  type: SingleMetadataType,
  value: string
): PromptMetadata {
  const updated = cloneMetadata(metadata);
  
  // Clear block ID when entering custom value, set custom value
  (updated as any)[type] = value.trim() ? 0 : (metadata[type] || 0);
  if (!updated.values) updated.values = {};
  updated.values[type] = value;
  
  return updated;
}

// ============================================================================
// MULTIPLE METADATA OPERATIONS
// ============================================================================

/**
 * Add a new item to multiple metadata (constraints, examples)
 */
export function addMetadataItem(
  metadata: PromptMetadata,
  type: MultipleMetadataType,
  item?: Partial<MetadataItem>
): PromptMetadata {
  console.log('Adding metadata item:', type, item);
  const updated = cloneMetadata(metadata);
  
  const newItem: MetadataItem = {
    id: generateMetadataItemId(),
    value: '',
    blockId: undefined,
    ...item
  };
  
  const key = MULTI_TYPE_KEY_MAP[type];
  const currentItems = (updated as any)[key] || [];
  // Insert the new item at the beginning so that recently added blocks
  // always appear before the "add new block" button in the UI.
  (updated as any)[key] = [newItem, ...currentItems];
  
  return updated;
}

/**
 * Remove an item from multiple metadata
 */
export function removeMetadataItem(
  metadata: PromptMetadata,
  type: MultipleMetadataType,
  itemId: string
): PromptMetadata {
  const updated = cloneMetadata(metadata);
  const key = MULTI_TYPE_KEY_MAP[type];
  const currentItems = (updated as any)[key] || [];
  (updated as any)[key] = currentItems.filter((item: MetadataItem) => item.id !== itemId);
  return updated;
}

/**
 * Update an item in multiple metadata
 */
export function updateMetadataItem(
  metadata: PromptMetadata,
  type: MultipleMetadataType,
  itemId: string,
  updates: Partial<MetadataItem>
): PromptMetadata {
  const updated = cloneMetadata(metadata);
  const key = MULTI_TYPE_KEY_MAP[type];
  const currentItems: MetadataItem[] = (updated as any)[key] || [];

  (updated as any)[key] = currentItems.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  );

  return updated;
}

/**
 * Reorder items in multiple metadata
 */
export function reorderMetadataItems(
  metadata: PromptMetadata,
  type: MultipleMetadataType,
  newItems: MetadataItem[]
): PromptMetadata {
  const updated = cloneMetadata(metadata);
  const key = MULTI_TYPE_KEY_MAP[type];
  (updated as any)[key] = newItems.map(item => ({ ...item }));
  return updated;
}

// ============================================================================
// SECONDARY METADATA MANAGEMENT
// ============================================================================

/**
 * Add a secondary metadata type
 */
export function addSecondaryMetadata(
  metadata: PromptMetadata,
  type: MetadataType
): PromptMetadata {
  const updated = cloneMetadata(metadata);
  
  if (isMultipleMetadataType(type)) {
    // For multiple types, add an empty item
    return addMetadataItem(updated, type as MultipleMetadataType);
  } else {
    // For single types, initialize with empty values
    const singleType = type as SingleMetadataType;
    (updated as any)[singleType] = 0;
    if (!updated.values) updated.values = {};
    updated.values[singleType] = '';
    return updated;
  }
}

/**
 * Remove a secondary metadata type
 */
export function removeSecondaryMetadata(
  metadata: PromptMetadata,
  type: MetadataType
): PromptMetadata {
  const updated = cloneMetadata(metadata);
  
  if (isMultipleMetadataType(type)) {
    const multiType = type as MultipleMetadataType;
    const key = MULTI_TYPE_KEY_MAP[multiType];
    delete (updated as any)[key];
  } else {
    const singleType = type as SingleMetadataType;
    delete (updated as any)[singleType];
    if (updated.values) {
      delete updated.values[singleType];
    }
  }
  
  return updated;
}

// ============================================================================
// METADATA ANALYSIS
// ============================================================================

/**
 * Get active secondary metadata types - includes types that have been added to the metadata
 * FIXED: Now correctly shows added metadata (even if empty) but not uninitialized metadata
 */
export function getActiveSecondaryMetadata(metadata: PromptMetadata): Set<MetadataType> {
  const activeSet = new Set<MetadataType>();
  
  SECONDARY_METADATA.forEach(type => {
    if (isMultipleMetadataType(type)) {
      // For multiple metadata types (constraints, examples)
      const key = MULTI_TYPE_KEY_MAP[type];
      const items = (metadata as any)[key];

      // Include only if the array contains at least one item
      if (items && Array.isArray(items) && items.length > 0) {
        activeSet.add(type);
      }
    } else {
      // For single metadata types (audience, output_format, tone_style)
      const singleType = type as SingleMetadataType;
      const hasProperty = Object.prototype.hasOwnProperty.call(metadata, singleType);

      // Include if the field has been initialized in the metadata object
      // (either a block was selected, a custom value exists, or the user added
      // the metadata but hasn't filled it yet)
      if (hasProperty) {
        activeSet.add(type);
      }
    }
  });
  
  return activeSet;
}

/**
 * Extract custom values for all single metadata types
 */
export function extractCustomValues(metadata: PromptMetadata): Record<SingleMetadataType, string> {
  const values: Record<SingleMetadataType, string> = {} as Record<SingleMetadataType, string>;
  
  [...PRIMARY_METADATA, ...SECONDARY_METADATA].forEach((type) => {
    if (!isMultipleMetadataType(type)) {
      values[type as SingleMetadataType] = metadata.values?.[type as SingleMetadataType] || '';
    }
  });
  
  return values;
}

/**
 * Get the first metadata type that contains a value. Useful for
 * automatically expanding metadata sections when editing templates.
 */
export function getFirstActiveMetadataType(metadata: PromptMetadata): MetadataType | null {
  const allTypes: MetadataType[] = [...PRIMARY_METADATA, ...SECONDARY_METADATA];

  for (const type of allTypes) {
    if (isMultipleMetadataType(type)) {
      const key = MULTI_TYPE_KEY_MAP[type];
      if ((metadata as any)[key] && (metadata as any)[key].length > 0) {
        return type;
      }
    } else {
      const singleType = type as SingleMetadataType;
      const blockId = metadata[singleType];
      const customValue = metadata.values?.[singleType];
      if ((blockId && blockId !== 0) || (customValue && customValue.trim())) {
        return type;
      }
    }
  }

  return null;
}

/**
 * Get metadata types that currently contain meaningful values.
 */
export function getFilledMetadataTypes(metadata: PromptMetadata): Set<MetadataType> {
  const filled = new Set<MetadataType>();

  [...PRIMARY_METADATA, ...SECONDARY_METADATA].forEach(type => {
    if (isMultipleMetadataType(type)) {
      const key = MULTI_TYPE_KEY_MAP[type];
      const items = (metadata as any)[key];
      if (Array.isArray(items) && items.some((item: MetadataItem) => item.value && item.value.trim())) {
        filled.add(type);
      }
    } else {
      const singleType = type as SingleMetadataType;
      const blockId = metadata[singleType];
      const customValue = metadata.values?.[singleType];
      if ((blockId && blockId !== 0) || (customValue && customValue.trim())) {
        filled.add(type);
      }
    }
  });

  return filled;
}

/**
 * Validate metadata completeness
 */
export function validateMetadata(metadata: PromptMetadata): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if at least one primary metadata is filled
  const hasPrimaryMetadata = PRIMARY_METADATA.some(type => {
    if (!isMultipleMetadataType(type)) {
      const singleType = type as SingleMetadataType;
      const blockId = metadata[singleType];
      const customValue = metadata.values?.[singleType];
      return (blockId && blockId !== 0) || (customValue && customValue.trim());
    }
    return false;
  });
  
  if (!hasPrimaryMetadata) {
    errors.push('At least one of Role, Context, or Goal is required');
  }
  
  // Check for empty multiple metadata items
  if (metadata.constraints?.some(item => !item.value.trim())) {
    warnings.push('Some constraints are empty');
  }
  
  if (metadata.examples?.some(item => !item.value.trim())) {
    warnings.push('Some examples are empty');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Count total metadata items
 */
export function countMetadataItems(metadata: PromptMetadata): number {
  let count = 0;
  
  // Count single metadata with values
  [...PRIMARY_METADATA, ...SECONDARY_METADATA].forEach(type => {
    if (!isMultipleMetadataType(type)) {
      const singleType = type as SingleMetadataType;
      const blockId = metadata[singleType];
      const customValue = metadata.values?.[singleType];
      if ((blockId && blockId !== 0) || (customValue && customValue.trim())) {
        count++;
      }
    }
  });
  
  // Count multiple metadata items
  if (metadata.constraints) {
    count += metadata.constraints.filter(item => item.value.trim()).length;
  }
  
  if (metadata.examples) {
    count += metadata.examples.filter(item => item.value.trim()).length;
  }
  
  return count;
}

// ============================================================================
// METADATA CONVERSION
// ============================================================================

/**
 * Convert metadata to block mapping for backend storage
 */
export function metadataToBlockMapping(metadata: PromptMetadata): Record<string, number | number[]> {
  const mapping: Record<string, number | number[]> = {};
  
  // Handle single metadata types
  [...PRIMARY_METADATA, ...SECONDARY_METADATA].forEach(type => {
    if (!isMultipleMetadataType(type)) {
      const singleType = type as SingleMetadataType;
      const blockId = metadata[singleType];
      if (blockId && blockId !== 0) {
        mapping[singleType] = blockId;
      }
    }
  });
  
  // Handle multiple metadata types
  if (metadata.constraints && metadata.constraints.length > 0) {
    const constraintBlockIds = metadata.constraints
      .map(c => c.blockId)
      .filter((id): id is number => typeof id === 'number' && id !== 0);
    if (constraintBlockIds.length > 0) {
      mapping.constraint = constraintBlockIds;
    }
  }

  if (metadata.examples && metadata.examples.length > 0) {
    const exampleBlockIds = metadata.examples
      .map(e => e.blockId)
      .filter((id): id is number => typeof id === 'number' && id !== 0);
    if (exampleBlockIds.length > 0) {
      mapping.example = exampleBlockIds;
    }
  }
  
  return mapping;
}

/**
 * Convert block mapping back to metadata IDs (for loading templates)
 */
export function blockMappingToMetadata(
  mapping: Record<string, number | number[]>
): PromptMetadata {
  const metadata: PromptMetadata = createMetadata();
  
  for (const [type, value] of Object.entries(mapping)) {
    if (typeof value === 'number') {
      if (value && value > 0) {
        const key = type;
        (metadata as any)[key] = value;
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
        const key = type;
        (metadata as any)[key] = items;
      }
    }
  }
  
  return metadata;
}

/**
 * Apply content overrides keyed by block ID to the metadata structure.
 * This keeps the original block references while updating the associated
 * custom values so modified text persists across editors.
 */
export function applyBlockOverridesToMetadata(
  metadata: PromptMetadata,
  overrides: Record<number, string>
): PromptMetadata {
  const updated = cloneMetadata(metadata);

  const singleTypes: SingleMetadataType[] = [
    'role',
    'context',
    'goal',
    'audience',
    'output_format',
    'tone_style'
  ];

  singleTypes.forEach(type => {
    const blockId = metadata[type];
    if (blockId && overrides.hasOwnProperty(blockId)) {
      if (!updated.values) updated.values = {} as any;
      updated.values[type] = overrides[blockId];
    }
  });

  if (metadata.constraints) {
    updated.constraints = metadata.constraints.map(item => {
      if (item.blockId && overrides.hasOwnProperty(item.blockId)) {
        return { ...item, value: overrides[item.blockId] };
      }
      return item;
    });
  }

  if (metadata.examples) {
    updated.examples = metadata.examples.map(item => {
      if (item.blockId && overrides.hasOwnProperty(item.blockId)) {
        return { ...item, value: overrides[item.blockId] };
      }
      return item;
    });
  }

  return updated;
}

/**
 * Determine which metadata blocks were modified based on the edited final
 * content string. Returns a map of blockId to new text (without prefix).
 */
export function getModifiedBlocks(
  metadata: PromptMetadata,
  finalContent: string,
  blockContentCache: Record<number, string>
): Record<number, string> {
  const resolved = resolveMetadataValues(metadata, blockContentCache);

  type Section = { id: number; prefix: string; value: string };
  const sections: Section[] = [];

  const singleTypes: SingleMetadataType[] = [
    'role',
    'context',
    'goal',
    'audience',
    'output_format',
    'tone_style'
  ];

  const prefixes: Record<SingleMetadataType, string> = {
    role: 'Ton rôle est de',
    context: 'Le contexte est',
    goal: 'Ton objectif est',
    audience: "L'audience ciblée est",
    output_format: 'Le format attendu est',
    tone_style: 'Le ton et style sont'
  };

  singleTypes.forEach(type => {
    const blockId = metadata[type];
    const value = resolved.values?.[type];
    if (blockId && blockId !== 0 && value) {
      sections.push({ id: blockId, prefix: prefixes[type], value });
    }
  });

  if (resolved.constraints) {
    resolved.constraints.forEach(item => {
      if (item.blockId && item.value.trim()) {
        sections.push({ id: item.blockId, prefix: 'Contrainte:', value: item.value });
      }
    });
  }

  if (resolved.examples) {
    resolved.examples.forEach(item => {
      if (item.blockId && item.value.trim()) {
        sections.push({ id: item.blockId, prefix: 'Exemple:', value: item.value });
      }
    });
  }

  const finalSections = finalContent.split(/\n\n/);
  const mods: Record<number, string> = {};

  sections.forEach((sec, idx) => {
    const txt = finalSections[idx] || '';
    if (txt.startsWith(sec.prefix)) {
      const newVal = txt.slice(sec.prefix.length).trim();
      const orig = sec.value.trim();
      if (newVal.replace(/\s+/g, ' ') !== orig.replace(/\s+/g, ' ')) {
        mods[sec.id] = newVal;
      }
    }
  });

  return mods;
}