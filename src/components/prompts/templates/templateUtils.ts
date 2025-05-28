import { useCallback } from 'react';
import { getBlockContent } from '../blocks/blockUtils';
import { formatBlockForPrompt, formatMetadataForPrompt } from '@/components/prompts/promptUtils';
import { ALL_METADATA_TYPES, PromptMetadata } from '@/types/prompts/metadata';
import { Block } from '@/types/prompts/blocks';

export interface FolderData {
  id: number;
  name: string;
  fullPath: string;
}

export const useProcessUserFolders = (userFolders: any[], setUserFoldersList: (folders: FolderData[]) => void) =>
  useCallback(() => {
    if (!userFolders || !Array.isArray(userFolders)) {
      setUserFoldersList([]);
      return;
    }
    const flattenFolderHierarchy = (
      folders: any[],
      path = '',
      result: FolderData[] = []
    ) => {
      folders.forEach(folder => {
        if (!folder || typeof folder.id !== 'number' || !folder.name) return;
        const folderPath = path ? `${path} / ${folder.name}` : folder.name;
        result.push({ id: folder.id, name: folder.name, fullPath: folderPath });
        if (folder.Folders && Array.isArray(folder.Folders) && folder.Folders.length > 0) {
          flattenFolderHierarchy(folder.Folders, folderPath, result);
        }
      });
      return result;
    };
    const flattened = flattenFolderHierarchy(userFolders);
    setUserFoldersList(flattened || []);
  }, [userFolders, setUserFoldersList]);

export const truncateFolderPath = (path: string, maxLength = 35): string => {
  if (!path || path.length <= maxLength) return path;
  if (path.includes('/')) {
    const parts = path.split('/');
    const lastPart = parts[parts.length - 1].trim();
    const firstParts = parts.slice(0, -1).join('/');
    if (lastPart.length >= maxLength - 3) {
      return lastPart.substring(0, maxLength - 3) + '...';
    }
    const availableLength = maxLength - lastPart.length - 6;
    if (availableLength > 5) {
      return '...' + firstParts.substring(firstParts.length - availableLength) + ' / ' + lastPart;
    }
  }
  return path.substring(0, maxLength - 3) + '...';
};

export const validateTemplateForm = (
  name: string,
  content: string,
  blocks: Block[],
  metadata: PromptMetadata,
  activeTab: 'basic' | 'advanced',
  setValidationErrors: (errors: Record<string, string>) => void
) => {
  const errors: Record<string, string> = {};
  if (!name?.trim()) errors.name = 'templateNameRequired';
  if (activeTab === 'basic' && !content?.trim()) errors.content = 'templateContentRequired';
  if (activeTab === 'advanced') {
    const hasContent = blocks.some(b => getBlockContent(b).trim()) ||
      Object.values(metadata.values || {}).some(v => v?.trim());
    if (!hasContent) errors.content = 'templateContentRequired';
  }
  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};

export const generateFinalContent = (
  content: string,
  blocks: Block[],
  metadata: PromptMetadata,
  activeTab: 'basic' | 'advanced'
): string => {
  if (activeTab === 'basic') return content;
  const parts: string[] = [];
  ALL_METADATA_TYPES.forEach(type => {
    const value = metadata.values?.[type];
    if (value) parts.push(formatMetadataForPrompt(type, value));
  });
  blocks.forEach(block => {
    const formatted = formatBlockForPrompt(block);
    if (formatted) parts.push(formatted);
  });
  return parts.filter(Boolean).join('\n\n');
};

export const getBlockIds = (
  blocks: Block[],
  metadata: PromptMetadata,
  activeTab: 'basic' | 'advanced'
): number[] => {
  if (activeTab === 'basic') return [];
  const metadataIds: number[] = [];
  ALL_METADATA_TYPES.forEach(type => {
    const id = metadata[type];
    if (id && id !== 0) metadataIds.push(id);
  });
  const contentIds = blocks.filter(b => b.id > 0 && !b.isNew).map(b => b.id);
  return [...metadataIds, ...contentIds];
};


import { Template } from '@/types/prompts/templates';

/**
 * Format template usage date for display
 */
export function formatUsageDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Calculate the difference in days
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Display relative time for recent dates
    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    
    // Format date for older dates
    return date.toLocaleDateString(undefined, { 
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Determine if a template is popular based on usage count
 */
export function isTemplatePopular(template: Template): boolean {
  const usageCount = typeof template.usage_count === 'number' ? template.usage_count : 0;
  return usageCount >= 5; // Consider popular if used 5 or more times
}

/**
 * Get safe template title with fallback
 */
export function getTemplateTitle(template: Template): string {
  return template.title || 'Untitled Template';
}

/**
 * Sort templates by usage count (descending)
 */
export function sortTemplatesByUsage(templates: Template[]): Template[] {
  return [...templates].sort((a, b) => {
    const aCount = typeof a.usage_count === 'number' ? a.usage_count : 0;
    const bCount = typeof b.usage_count === 'number' ? b.usage_count : 0;
    return bCount - aCount;
  });
}

/**
 * Sort templates by last used date (most recent first)
 */
export function sortTemplatesByLastUsed(templates: Template[]): Template[] {
  return [...templates].sort((a, b) => {
    const aDate = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
    const bDate = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;
    return bDate - aDate;
  });
}

/**
 * Format templates for display, enriching with additional properties
 */
export function formatTemplatesForDisplay(templates: Template[]): Template[] {
  return templates.map(template => ({
    ...template,
    displayTitle: getTemplateTitle(template),
    isPopular: isTemplatePopular(template),
    formattedLastUsed: template.last_used_at ? formatUsageDate(template.last_used_at) : ''
  }));
}