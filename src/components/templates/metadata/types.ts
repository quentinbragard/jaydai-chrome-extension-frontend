// src/components/templates/metadata/types.ts
import { BlockType } from '@/components/templates/blocks/types';

export type MetadataType = 'role' | 'context' | 'goal' | 'audience' | 'format' | 'example';

export interface PromptMetadata {
  role?: number;
  context?: number;
  goal?: number;
  audience?: number;
  format?: number;
  example?: number;
}

export interface MetadataConfig {
  label: string;
  emoji: string;
  description: string;
  blockType: BlockType;
  placeholder: string;
}

export const METADATA_CONFIGS: Record<MetadataType, MetadataConfig> = {
  role: {
    label: 'Role',
    emoji: '👤',
    description: 'Define the AI assistant\'s role or persona',
    blockType: 'role',
    placeholder: 'You are a helpful assistant...'
  },
  context: {
    label: 'Context',
    emoji: '📋',
    description: 'Provide background information and context',
    blockType: 'context',
    placeholder: 'Here is the relevant context...'
  },
  goal: {
    label: 'Goal',
    emoji: '🎯',
    description: 'Specify what you want to achieve',
    blockType: 'content',
    placeholder: 'Your goal is to...'
  },
  audience: {
    label: 'Audience',
    emoji: '👥',
    description: 'Define the target audience',
    blockType: 'audience',
    placeholder: 'This is intended for...'
  },
  format: {
    label: 'Format',
    emoji: '📝',
    description: 'Specify the desired output format',
    blockType: 'format',
    placeholder: 'Please format your response as...'
  },
  example: {
    label: 'Example',
    emoji: '💡',
    description: 'Provide examples to guide the response',
    blockType: 'example',
    placeholder: 'For example...'
  }
};

export const DEFAULT_METADATA: PromptMetadata = {
  role: undefined,
  context: undefined,
  goal: undefined,
  audience: undefined,
  format: undefined,
  example: undefined
};