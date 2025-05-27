// src/components/templates/metadata/types.ts
import { BlockType } from '@/components/templates/blocks/types';

export type MetadataType =
  | 'role'
  | 'tone_style'
  | 'output_format'
  | 'audience'
  | 'output_language'
  | 'main_context'
  | 'main_goal';

export interface MetadataConfig {
  label: string;
  blockType: BlockType;
  required?: boolean;
}

export const METADATA_CONFIGS: Record<MetadataType, MetadataConfig> = {
  role: { label: 'Role', blockType: 'role', required: true },
  tone_style: { label: 'Tone & Style', blockType: 'tone_style' },
  output_format: { label: 'Output Format', blockType: 'output_format' },
  audience: { label: 'Audience', blockType: 'audience' },
  output_language: { label: 'Output Language', blockType: 'output_language' },
  main_context: { label: 'Main Context', blockType: 'main_context', required: true },
  main_goal: { label: 'Main Goal', blockType: 'main_goal', required: true }
};

export interface PromptMetadata {
  role?: number;
  tone_style?: number;
  output_format?: number;
  audience?: number;
  output_language?: number;
  main_context?: number;
  main_goal?: number;
}

export const DEFAULT_METADATA: PromptMetadata = {
  role: 0,
  tone_style: 0,
  output_format: 0,
  audience: 0,
  output_language: 0,
  main_context: 0,
  main_goal: 0
};
