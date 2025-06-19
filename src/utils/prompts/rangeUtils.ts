import { PromptMetadata, SingleMetadataType, MultipleMetadataType, MetadataItem } from '@/types/prompts/metadata';

export interface BlockRangeMap {
  [key: string]: any;
}

/**
 * Calculate character ranges for each metadata block within the complete prompt text.
 * This uses the order of metadata items defined in the metadata object and
 * assumes the prompt text was generated using the same order.
 */
export function calculateBlockRanges(
  completeText: string,
  metadata: PromptMetadata
): BlockRangeMap {
  const separatorRegex = /\n{2,}/g;
  const sections: { text: string; start: number; end: number }[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = separatorRegex.exec(completeText)) !== null) {
    sections.push({ text: completeText.slice(lastIndex, match.index), start: lastIndex, end: match.index });
    lastIndex = match.index + match[0].length;
  }
  sections.push({ text: completeText.slice(lastIndex), start: lastIndex, end: completeText.length });

  const result: BlockRangeMap = {};
  let sectionIndex = 0;

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
    if (blockId && blockId !== 0 && sectionIndex < sections.length) {
      const section = sections[sectionIndex];
      if (!result[type]) result[type] = {};
      result[type][blockId] = [section.start, section.end];
      sectionIndex++;
    }
  });

  const handleMulti = (
    type: MultipleMetadataType,
    items?: MetadataItem[]
  ) => {
    if (!items) return;
    result[type] = [];
    items.forEach(item => {
      if (item.blockId && sectionIndex < sections.length) {
        const section = sections[sectionIndex];
        (result[type] as Array<Record<number, [number, number]>>).push({
          [item.blockId]: [section.start, section.end]
        });
        sectionIndex++;
      }
    });
  };

  handleMulti('constraint', metadata.constraints);
  handleMulti('example', metadata.examples);

  return result;
}
