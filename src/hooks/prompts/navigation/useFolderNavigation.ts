// src/hooks/prompts/navigation/useFolderNavigation.ts
import { useState, useCallback, useMemo } from 'react';
import { TemplateFolder, Template } from '@/types/prompts/templates';

interface NavigationPath {
  id: number;
  name: string;
  type: 'user' | 'organization';
}

interface NavigationState {
  path: NavigationPath[];
  currentFolder: TemplateFolder | null;
  rootType: 'user' | 'organization' | null;
}

interface UnifiedFolderData {
  userFolders: TemplateFolder[];
  organizationFolders: TemplateFolder[];
}

/**
 * Unified navigation hook that handles both user and organization folders
 * with consistent navigation logic
 */
export function useFolderNavigation(data: UnifiedFolderData) {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    path: [],
    currentFolder: null,
    rootType: null
  });

  // Helper function to find folder by ID across all folder types
  const findFolderById = useCallback((
    folders: TemplateFolder[], 
    id: number
  ): TemplateFolder | null => {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      if (folder.Folders) {
        const found = findFolderById(folder.Folders, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Get the root folders (user + organization combined)
  const rootFolders = useMemo(() => {
    return [
      ...data.userFolders.map(folder => ({ ...folder, rootType: 'user' as const })),
      ...data.organizationFolders.map(folder => ({ ...folder, rootType: 'organization' as const }))
    ];
  }, [data.userFolders, data.organizationFolders]);

  // Get current items to display
  const currentItems = useMemo(() => {
    if (!navigationState.currentFolder) {
      // At root level - show all root folders and any root templates
      const items: Array<TemplateFolder | Template> = [...rootFolders];
      
      // Add root templates from user folders (templates not in any folder)
      data.userFolders.forEach(folder => {
        if (folder.templates) {
          folder.templates
            .filter(template => !template.folder_id)
            .forEach(template => items.push({ ...template, rootType: 'user' }));
        }
      });
      
      return items;
    } else {
      // Inside a folder - show subfolders and templates
      const items: Array<TemplateFolder | Template> = [];
      
      if (navigationState.currentFolder.Folders) {
        items.push(...navigationState.currentFolder.Folders.map(folder => ({
          ...folder,
          rootType: navigationState.rootType
        })));
      }
      
      if (navigationState.currentFolder.templates) {
        items.push(...navigationState.currentFolder.templates.map(template => ({
          ...template,
          rootType: navigationState.rootType
        })));
      }
      
      return items;
    }
  }, [navigationState, rootFolders, data.userFolders]);

  // Navigate to a specific folder
  const navigateToFolder = useCallback((folder: TemplateFolder) => {
    setNavigationState(prev => {
      // Determine the root type
      let rootType: 'user' | 'organization' | null = null;
      
      if (prev.path.length === 0) {
        // First navigation - determine from folder
        rootType = (folder as any).rootType || 
                  (data.userFolders.some(f => f.id === folder.id) ? 'user' : 'organization');
      } else {
        // Continue with existing root type
        rootType = prev.rootType;
      }

      return {
        path: [...prev.path, { id: folder.id, name: folder.name, type: rootType }],
        currentFolder: folder,
        rootType
      };
    });
  }, [data.userFolders]);

  // Navigate back one level
  const navigateBack = useCallback(() => {
    setNavigationState(prev => {
      if (prev.path.length <= 1) {
        return { path: [], currentFolder: null, rootType: null };
      }
      
      const newPath = prev.path.slice(0, -1);
      const parentId = newPath[newPath.length - 1]?.id;
      
      // Find the new current folder
      let newCurrentFolder: TemplateFolder | null = null;
      
      if (parentId) {
        const allFolders = prev.rootType === 'user' ? data.userFolders : data.organizationFolders;
        newCurrentFolder = findFolderById(allFolders, parentId);
      }
      
      return {
        path: newPath,
        currentFolder: newCurrentFolder,
        rootType: prev.rootType
      };
    });
  }, [data.userFolders, data.organizationFolders, findFolderById]);

  // Navigate to root
  const navigateToRoot = useCallback(() => {
    setNavigationState({ path: [], currentFolder: null, rootType: null });
  }, []);

  // Navigate to a specific path index
  const navigateToPathIndex = useCallback((index: number) => {
    setNavigationState(prev => {
      const newPath = prev.path.slice(0, index + 1);
      const targetId = newPath[newPath.length - 1]?.id;
      
      let newCurrentFolder: TemplateFolder | null = null;
      
      if (targetId && prev.rootType) {
        const allFolders = prev.rootType === 'user' ? data.userFolders : data.organizationFolders;
        newCurrentFolder = findFolderById(allFolders, targetId);
      }
      
      return {
        path: newPath,
        currentFolder: newCurrentFolder,
        rootType: prev.rootType
      };
    });
  }, [data.userFolders, data.organizationFolders, findFolderById]);

  // Get the type for a given item
  const getItemType = useCallback((item: any): 'user' | 'organization' => {
    return item.rootType || 
           (data.userFolders.some(f => f.id === item.id) ? 'user' : 'organization');
  }, [data.userFolders]);

  return {
    navigationState,
    currentItems,
    navigateToFolder,
    navigateBack,
    navigateToRoot,
    navigateToPathIndex,
    getItemType,
    isAtRoot: navigationState.path.length === 0
  };
}