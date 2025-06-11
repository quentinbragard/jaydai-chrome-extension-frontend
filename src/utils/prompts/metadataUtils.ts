import {
  PromptMetadata,
  PRIMARY_METADATA,
  SECONDARY_METADATA,
  SingleMetadataType,
  MultipleMetadataType,
  MetadataItem,
  isSingleMetadataType,
  isMultipleMetadataType,
  generateMetadataItemId
} from '@/types/prompts/metadata';

export interface TemplateMetadataItem {
  type: MultipleMetadataType | SingleMetadataType;
  blockId: number;
}

export function extractCustomValues(metadata: PromptMetadata): Record<SingleMetadataType, string> {
  const values: Record<SingleMetadataType, string> = {} as Record<SingleMetadataType, string>;
  [...PRIMARY_METADATA, ...SECONDARY_METADATA].forEach((type) => {
    if (!isMultipleMetadataType(type)) {
      values[type as SingleMetadataType] = metadata.values?.[type as SingleMetadataType] || '';
    }
  });
  return values;
}

export function updateMetadata(
  metadata: PromptMetadata,
  item: TemplateMetadataItem,
  mode: 'add' | 'remove'
): PromptMetadata {
  const { type, blockId } = item;
  if (isSingleMetadataType(type)) {
    if (mode === 'add') {
      return { ...metadata, [type]: blockId };
    }
    if (mode === 'remove') {
      return { ...metadata, [type]: 0 };
    }
  } else {
    const multiType = type as MultipleMetadataType;
    if (mode === 'add') {
      return {
        ...metadata,
        [multiType]: [...(metadata[multiType] || []), blockId]
      } as PromptMetadata;
    }
    if (mode === 'remove') {
      return {
        ...metadata,
        [multiType]: (metadata[multiType] || []).filter(id => id !== blockId)
      } as PromptMetadata;
    }
  }
  return metadata;
}

export function addMetadata(
  metadata: PromptMetadata,
  type: MultipleMetadataType | SingleMetadataType,
  action: 'type' | 'item'
): PromptMetadata {
  if (action === 'type') {
    if (isMultipleMetadataType(type)) {
      const multi = type as MultipleMetadataType;
      const newItem: MetadataItem = {
        id: generateMetadataItemId(),
        value: '',
        blockId: undefined
      };
      return { ...metadata, [multi]: [newItem] };
    }
    const single = type as SingleMetadataType;
    return {
      ...metadata,
      [single]: 0,
      values: { ...metadata.values, [single]: '' }
    };
  }

  if (isMultipleMetadataType(type)) {
    const multi = type as MultipleMetadataType;
    const newItem: MetadataItem = {
      id: generateMetadataItemId(),
      value: '',
      blockId: undefined
    };
    return { ...metadata, [multi]: [...(metadata[multi] || []), newItem] };
  }

  return metadata;
}

export function removeMetadata(
  metadata: PromptMetadata,
  type: MultipleMetadataType | SingleMetadataType,
  action: 'type' | 'item',
  itemId?: string
): PromptMetadata {
  if (action === 'type') {
    if (isMultipleMetadataType(type)) {
      return { ...metadata, [type]: [] };
    }
    const single = type as SingleMetadataType;
    return {
      ...metadata,
      [single]: 0,
      values: { ...metadata.values, [single]: '' }
    };
  }

  if (isMultipleMetadataType(type) && itemId) {
    const multi = type as MultipleMetadataType;
    return {
      ...metadata,
      [multi]: (metadata[multi] || []).filter(item => item.id !== itemId)
    };
  }

  return metadata;
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
  return { ...metadata, [type]: newItems };
}