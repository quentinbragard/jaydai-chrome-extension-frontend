// src/utils/prompts/folderTreeUtils.ts
import { TemplateFolder } from '@/types/prompts/templates';

/**
 * Utility functions for working with folder tree structures
 */

/**
 * Recursively find a folder by ID in a folder tree
 */
export function findFolderInTree(folders: TemplateFolder[], targetId: number): TemplateFolder | null {
  for (const folder of folders) {
    if (folder.id === targetId) {
      return folder;
    }
    if (folder.Folders && folder.Folders.length > 0) {
      const found = findFolderInTree(folder.Folders, targetId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get all folder IDs from a folder tree (flattened)
 */
export function getAllFolderIds(folders: TemplateFolder[]): number[] {
  const ids: number[] = [];
  
  function traverse(folders: TemplateFolder[]) {
    for (const folder of folders) {
      ids.push(folder.id);
      if (folder.Folders && folder.Folders.length > 0) {
        traverse(folder.Folders);
      }
    }
  }
  
  traverse(folders);
  return ids;
}

/**
 * Get all folders from a tree structure (flattened)
 */
export function getAllFoldersFlat(folders: TemplateFolder[]): TemplateFolder[] {
  const result: TemplateFolder[] = [];
  
  function traverse(folders: TemplateFolder[]) {
    for (const folder of folders) {
      result.push(folder);
      if (folder.Folders && folder.Folders.length > 0) {
        traverse(folder.Folders);
      }
    }
  }
  
  traverse(folders);
  return result;
}

/**
 * Check if a folder exists anywhere in the tree
 */
export function folderExistsInTree(folders: TemplateFolder[], targetId: number): boolean {
  return findFolderInTree(folders, targetId) !== null;
}

/**
 * Get the path to a folder (array of folder IDs from root to target)
 */
export function getFolderPath(folders: TemplateFolder[], targetId: number): number[] {
  function findPath(folders: TemplateFolder[], targetId: number, currentPath: number[] = []): number[] | null {
    for (const folder of folders) {
      const newPath = [...currentPath, folder.id];
      
      if (folder.id === targetId) {
        return newPath;
      }
      
      if (folder.Folders && folder.Folders.length > 0) {
        const result = findPath(folder.Folders, targetId, newPath);
        if (result) return result;
      }
    }
    return null;
  }
  
  return findPath(folders, targetId) || [];
}

/**
 * Get the parent folder of a target folder
 */
export function getParentFolder(folders: TemplateFolder[], targetId: number): TemplateFolder | null {
  function findParent(folders: TemplateFolder[]): TemplateFolder | null {
    for (const folder of folders) {
      if (folder.Folders) {
        // Check if targetId is a direct child
        if (folder.Folders.some(child => child.id === targetId)) {
          return folder;
        }
        // Recursively search in subfolders
        const result = findParent(folder.Folders);
        if (result) return result;
      }
    }
    return null;
  }
  
  return findParent(folders);
}

/**
 * Filter folders that match a search query (including nested matches)
 */
export function filterFoldersWithSearch(
  folders: TemplateFolder[], 
  searchQuery: string,
  templateMatcher?: (template: any, query: string) => boolean
): TemplateFolder[] {
  const query = searchQuery.toLowerCase();
  
  function folderMatches(folder: TemplateFolder): boolean {
    // Check folder name
    if (folder.title?.toLowerCase().includes(query)) return true;
    
    // Check templates in folder
    if (folder.templates && templateMatcher) {
      if (folder.templates.some(t => templateMatcher(t, searchQuery))) return true;
    }
    
    // Check subfolders
    if (folder.Folders && folder.Folders.some(f => folderMatches(f))) return true;
    
    return false;
  }
  
  return folders.filter(folderMatches);
}

/**
 * Build a breadcrumb trail for a folder
 */
export function buildFolderBreadcrumbs(
  folders: TemplateFolder[], 
  targetId: number
): Array<{ id: number; title: string }> {
  const path = getFolderPath(folders, targetId);
  const breadcrumbs: Array<{ id: number; title: string }> = [];
  
  for (const folderId of path) {
    const folder = findFolderInTree(folders, folderId);
    if (folder) {
      breadcrumbs.push({ id: folder.id, title: folder.title });
    }
  }
  
  return breadcrumbs;
}