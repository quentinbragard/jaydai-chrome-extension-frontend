import {
  PromptMetadata,
  PRIMARY_METADATA,
  SECONDARY_METADATA,
  SingleMetadataType,
  isSingleMetadataType,
  isMultipleMetadataType,
} from '@/types/prompts/metadata';

export function extractCustomValues(metadata: PromptMetadata): Record<SingleMetadataType, string> {
  const values: Record<SingleMetadataType, string> = {} as Record<SingleMetadataType, string>;
  [...PRIMARY_METADATA, ...SECONDARY_METADATA].forEach((type) => {
    if (!isMultipleMetadataType(type)) {
      values[type as SingleMetadataType] = metadata.values?.[type as SingleMetadataType] || '';
    }
  });
  return values;
}

export function updateMetadata(metadata: PromptMetadata, item: TemplateMetadataItem, mode: 'add' | 'remove') {
  const { type, blockId } = item;
  if (isSingleMetadataType(type)) {
    if (mode === 'add') {
      metadata[type] = blockId;
    } else if (mode === 'remove') {
      metadata[type] = null;
    }
  }
  else {
    if (mode === 'add') {
      metadata[type] = [...(metadata[type] || []), blockId];
    } else if (mode === 'remove') {
      metadata[type] = metadata[type].filter((id) => id !== blockId);
    }
  }
}