import { Block } from '@/components/templates/blocks/types';
import { getCurrentLanguage } from '@/core/utils/i18n';

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
