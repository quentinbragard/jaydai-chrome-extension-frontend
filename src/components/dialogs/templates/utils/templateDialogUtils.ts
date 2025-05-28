import { useCallback } from 'react';
import { getBlockContent } from './blockUtils';
import { formatBlockForPrompt, formatMetadataForPrompt } from './promptUtils';
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
