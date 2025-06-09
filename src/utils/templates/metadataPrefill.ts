import { blocksApi } from '@/services/api/BlocksApi';
import {
  PromptMetadata,
  DEFAULT_METADATA,
  SingleMetadataType,
  MultipleMetadataType,
  MetadataItem,
  generateMetadataItemId,
  isMultipleMetadataType
} from '@/types/prompts/metadata';
import { getLocalizedContent } from '@/components/prompts/blocks/blockUtils';

export async function prefillMetadataFromMapping(
  mapping: Record<string, number | number[]>
): Promise<PromptMetadata> {
  const result: PromptMetadata = { ...DEFAULT_METADATA, values: {} as Record<SingleMetadataType, string> };

  if (!mapping) return result;

  const entries = Object.entries(mapping);
  for (const [key, val] of entries) {
    if (Array.isArray(val)) {
      const items: MetadataItem[] = [];
      for (const id of val) {
        const res = await blocksApi.getBlock(id as number);
        const value = res.success && res.data ? getLocalizedContent(res.data.content) : '';
        items.push({ id: generateMetadataItemId(), blockId: id as number, value });
      }
      (result as any)[key] = items;
    } else {
      const id = val as number;
      const res = await blocksApi.getBlock(id);
      const value = res.success && res.data ? getLocalizedContent(res.data.content) : '';
      (result as any)[key] = id;
      result.values![key as SingleMetadataType] = value;
    }
  }

  return result;
}
