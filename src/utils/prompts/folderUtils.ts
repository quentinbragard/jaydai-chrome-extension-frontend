// src/components/panels/TemplatesPanel/utils/folderUtils.ts

import { TemplateFolder } from '@/types/prompts/templates';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';

/**
 * Count all templates in a folder including its subfolders
 */
export function countTemplatesInFolder(folder: TemplateFolder): number {
  if (!folder) return 0;
  
  let count = folder.templates?.length || 0;
  
  // Add templates from subfolders
  if (folder.Folders && folder.Folders.length > 0) {
    folder.Folders.forEach(subfolder => {
      count += countTemplatesInFolder(subfolder);
    });
  }
  
  return count;
}

/**
 * Find a folder by its ID in a folder tree
 */
export function findFolderById(folders: TemplateFolder[], id: number): TemplateFolder | null {
  for (const folder of folders) {
    if (folder.id === id) {
      return folder;
    }
    
    if (folder.Folders && folder.Folders.length > 0) {
      const subfolder = findFolderById(folder.Folders, id);
      if (subfolder) {
        return subfolder;
      }
    }
  }
  
  return null;
}

/**
 * Get the full path of a folder
 */
export function getFolderPath(folder: TemplateFolder): string {
  return folder.path || folder.title || '';
}

/**
 * Check if a folder is empty (no templates and no subfolders)
 */
export function isFolderEmpty(folder: TemplateFolder): boolean {
  return (!folder.templates || folder.templates.length === 0) && 
         (!folder.Folders || folder.Folders.length === 0);
}

/**
 * Get folder tree depth for indentation
 */
export function getFolderDepth(folderPath: string): number {
  if (!folderPath) return 0;
  return folderPath.split('/').length;
}

/**
 * Compare folders by name for sorting
 */
export function compareFoldersByName(a: TemplateFolder, b: TemplateFolder): number {
  const aName = getLocalizedContent(a.title ?? a.name) || '';
  const bName = getLocalizedContent(b.title ?? b.name) || '';
  return aName.localeCompare(bName, undefined, { sensitivity: 'base' });
}

export function getFolderTitle(folder: TemplateFolder): string {
  return getLocalizedContent(folder.title ?? folder.name) || '';
}

/**
 * Group folders by type (company, organization, user)
 */
export function groupFoldersByType(folders: TemplateFolder[]): {
  organization: TemplateFolder[];
  user: TemplateFolder[];
  company: TemplateFolder[];
} {
  return folders.reduce(
    (acc, folder) => {
      const type = folder.type as 'company' | 'organization' | 'user';
      if (type && acc[type]) {
        acc[type].push(folder);
      }
      return acc;
    },
    { company: [], organization: [], user: [] } as {
      company: TemplateFolder[];
      organization: TemplateFolder[];
      user: TemplateFolder[];
    }
  );
}

/**
 * Normalize folder data coming from the API. The backend uses
 * the property `subfolders` while the frontend expects `Folders`.
 * This helper recursively converts the structure so existing
 * components can render nested folders correctly.
 */
export function normalizeFolder(folder: any): TemplateFolder {
  if (!folder || typeof folder !== 'object') {
    return {} as TemplateFolder;
  }

  const { subfolders, templates, ...rest } = folder;

  const normalized: TemplateFolder = {
    ...(rest as TemplateFolder),
    templates: Array.isArray(templates) ? templates : [],
    Folders: []
  };

  if (Array.isArray(subfolders)) {
    normalized.Folders = subfolders.map(f => normalizeFolder(f));
  }

  return normalized;
}

/**
 * Normalize an array of folders from the API
 */
export function normalizeFolders(folders: any[]): TemplateFolder[] {
  if (!Array.isArray(folders)) return [];
  return folders.map(f => normalizeFolder(f));
}
