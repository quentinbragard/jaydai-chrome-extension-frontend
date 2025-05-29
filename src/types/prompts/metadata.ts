// src/types/prompts/metadata.ts
import { BlockType } from './blocks';

export type MetadataType = 
  | 'role' 
  | 'context' 
  | 'goal' 
  | 'audience' 
  | 'format' 
  | 'example'
  | 'output_format'
  | 'tone_style';

export interface MetadataConfig {
  label: string;
  blockType: BlockType;
  placeholder: string;
}

export const METADATA_CONFIGS: Record<MetadataType, MetadataConfig> = {
  role: {
    label: 'Role',
    blockType: 'role',
    placeholder: 'Define the AI role...'
  },
  context: {
    label: 'Context',
    blockType: 'context',
    placeholder: 'Provide context...'
  },
  goal: {
    label: 'Goal',
    blockType: 'goal',
    placeholder: 'Define the objective...'
  },
  audience: {
    label: 'Audience',
    blockType: 'audience',
    placeholder: 'Define target audience...'
  },
  format: {
    label: 'Format',
    blockType: 'output_format',
    placeholder: 'Specify output format...'
  },
  example: {
    label: 'Example',
    blockType: 'example',
    placeholder: 'Provide an example...'
  },
  output_format: {
    label: 'Output Format',
    blockType: 'output_format',
    placeholder: 'Specify the desired output format...'
  },
  tone_style: {
    label: 'Tone & Style',
    blockType: 'tone_style',
    placeholder: 'Define tone and style...'
  }
};

export interface PromptMetadata {
  role?: number;
  context?: number;
  goal?: number;
  audience?: number;
  format?: number;
  example?: number;
  output_format?: number;
  tone_style?: number;
  values?: {
    role?: string;
    context?: string;
    goal?: string;
    audience?: string;
    format?: string;
    example?: string;
    output_format?: string;
    tone_style?: string;
  };
}

export const DEFAULT_METADATA: PromptMetadata = {
  role: 0,
  context: 0,
  goal: 0,
  values: {}
};

export const ALL_METADATA_TYPES: MetadataType[] = Object.keys(METADATA_CONFIGS) as MetadataType[];