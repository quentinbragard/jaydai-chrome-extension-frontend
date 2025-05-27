// src/components/dialogs/templates/editor/utils/blockUtils.ts
import { BlockType } from '@/components/templates/blocks/types';
import { FileText, MessageSquare, User, Layout, Type, Users } from 'lucide-react';
import { Block } from '@/components/templates/blocks/types';
import { getCurrentLanguage } from '@/core/utils/i18n';

export const BLOCK_TYPES: BlockType[] = ['content', 'context', 'role', 'example', 'format', 'audience'];

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  content: 'Content',
  context: 'Context',
  role: 'Role',
  example: 'Example',
  format: 'Format',
  audience: 'Audience'
};

export const BLOCK_TYPE_ICONS: Record<BlockType, React.ComponentType<any>> = {
  content: FileText,
  context: MessageSquare,
  role: User,
  example: Layout,
  format: Type,
  audience: Users
};

export const BLOCK_TYPE_DESCRIPTIONS: Record<BlockType, string> = {
  content: 'Main content or instructions for the prompt',
  context: 'Background information or context setting',
  role: 'Define the AI\'s role or persona',
  example: 'Provide examples to guide the AI\'s response',
  format: 'Specify the desired output format',
  audience: 'Define the target audience for the response'
};

export const BLOCK_COLORS_LIGHT: Record<BlockType, string> = {
  content: 'jd-bg-blue-50 jd-border-blue-200 jd-text-blue-900',
  context: 'jd-bg-green-50 jd-border-green-200 jd-text-green-900',
  role: 'jd-bg-purple-50 jd-border-purple-200 jd-text-purple-900',
  example: 'jd-bg-orange-50 jd-border-orange-200 jd-text-orange-900',
  format: 'jd-bg-pink-50 jd-border-pink-200 jd-text-pink-900',
  audience: 'jd-bg-teal-50 jd-border-teal-200 jd-text-teal-900'
};

export const BLOCK_COLORS_DARK: Record<BlockType, string> = {
  content: 'jd-bg-blue-900/20 jd-border-blue-800 jd-text-blue-300',
  context: 'jd-bg-green-900/20 jd-border-green-800 jd-text-green-300',
  role: 'jd-bg-purple-900/20 jd-border-purple-800 jd-text-purple-300',
  example: 'jd-bg-orange-900/20 jd-border-orange-800 jd-text-orange-300',
  format: 'jd-bg-pink-900/20 jd-border-pink-800 jd-text-pink-300',
  audience: 'jd-bg-teal-900/20 jd-border-teal-800 jd-text-teal-300'
};

/**
 * Get a user-friendly label for a block type
 */
export const getBlockTypeLabel = (type: BlockType): string => {
  return BLOCK_TYPE_LABELS[type] || type;
};

/**
 * Get the icon component for a block type
 */
export const getBlockTypeIcon = (type: BlockType) => {
  return BLOCK_TYPE_ICONS[type] || FileText;
};

/**
 * Get a description for a block type
 */
export const getBlockTypeDescription = (type: BlockType): string => {
  return BLOCK_TYPE_DESCRIPTIONS[type] || '';
};

/**
 * Get color classes for a block type
 */
export const getBlockTypeColors = (type: BlockType, isDarkMode: boolean): string => {
  const palette = isDarkMode ? BLOCK_COLORS_DARK : BLOCK_COLORS_LIGHT;
  return palette[type] || palette.content;
};



/**
 * Extract string content from a block, handling localized content.
 */
export const getBlockContent = (block: Block): string => {
  if (typeof block.content === 'string') {
    return block.content;
  }

  if (block.content && typeof block.content === 'object') {
    const locale = getCurrentLanguage();
    return block.content[locale] || block.content.en || Object.values(block.content)[0] || '';
  }

  return '';
};

/**
 * Get localized content from a string or object.
 */
export const getLocalizedContent = (content: any): string => {
  if (typeof content === 'string') {
    return content;
  }

  if (content && typeof content === 'object') {
    const locale = getCurrentLanguage();
    return content[locale] || content.en || Object.values(content)[0] || '';
  }

  return '';
};