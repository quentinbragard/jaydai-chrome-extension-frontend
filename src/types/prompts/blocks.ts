// src/types/prompts/blocks.ts
export type BlockType =
  | 'role'
  | 'context'
  | 'goal'
  | 'custom'
  | 'output_format'
  | 'example'
  | 'constraint'
  | 'tone_style'
  | 'audience';

export interface Block {
  id: number;
  type: BlockType | null;
  content: string | Record<string, string>;
  title?: string | Record<string, string>;
  name?: string;
  description?: string | Record<string, string>;
  isNew?: boolean;
}

// Define which block types are metadata
export const METADATA_BLOCK_TYPES: BlockType[] = [
  'role',
  'context', 
  'goal',
  'output_format',
  'tone_style',
  'audience'
];

export const isMetadataBlock = (type: BlockType | null): boolean => {
  return type !== null && METADATA_BLOCK_TYPES.includes(type);
};