import {
  PromptMetadata,
  PRIMARY_METADATA,
  SECONDARY_METADATA,
  SingleMetadataType,
  isMultipleMetadataType
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
