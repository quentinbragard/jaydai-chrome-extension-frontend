// src/hooks/templates/useFolderSearch.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { TemplateFolder, Template } from '@/types/prompts/templates';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';

/**
 * Performance-optimized hook for searching through template folders
 */
export function useFolderSearch(
  folders: TemplateFolder[] = [],
  unorganizedTemplates: Template[] = []
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  
  // Reset expanded folders when search query is cleared
  useEffect(() => {
    if (!searchQuery) {
      setExpandedFolders(new Set());
    }
  }, [searchQuery]);
  
  // Memoized function to check if a template matches search query
  const templateMatchesQuery = useCallback((template: Template, query: string): boolean => {
    const lowerQuery = query.toLowerCase();

    const title = getLocalizedContent((template as any).title) || '';
    if (title.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    const description = getLocalizedContent((template as any).description) || '';
    if (description.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    const content = getLocalizedContent(template.content) || '';
    if (content.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    return false;
  }, []);
  
  // Memoized function to check if a folder or its contents match search query
  const folderMatchesQuery = useCallback((folder: TemplateFolder, query: string): boolean => {
    const lowerQuery = query.toLowerCase();

    // Check folder name
    const title = getLocalizedContent(folder.title ?? folder.name) || '';
    if (title.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Check templates in this folder
    if (folder.templates?.some(template => templateMatchesQuery(template, query))) {
      return true;
    }
    
    // Check subfolders recursively
    if (folder.Folders?.some(subfolder => folderMatchesQuery(subfolder, query))) {
      return true;
    }
    
    return false;
  }, [templateMatchesQuery]);
  
  // Filter folders based on search query with memoization
  const { filteredFolders, filteredTemplates, expandedIds } = useMemo(() => {
    // If no search query, return all folders and unorganized templates
    if (!searchQuery.trim()) {
      return {
        filteredFolders: folders,
        filteredTemplates: unorganizedTemplates,
        expandedIds: new Set<number>()
      };
    }

    const query = searchQuery.toLowerCase();
    const newExpandedFolders = new Set<number>();
    const matchingTemplates: Template[] = [];

    // Helper function for processing folders recursively
    const processFolder = (folder: TemplateFolder, parentIds: number[] = []): boolean => {
      const folderMatches = folderMatchesQuery(folder, query);

      // If folder has an ID and matches, add it to expanded set
      if (folder.id && folderMatches) {
        newExpandedFolders.add(folder.id);
        // Also add all parent folders to expanded set for proper tree display
        parentIds.forEach(id => newExpandedFolders.add(id));
        return true;
      }

      // Check templates within this folder
      if (folder.templates?.length) {
        folder.templates.forEach(t => {
          if (templateMatchesQuery(t, query)) {
            matchingTemplates.push(t);
            if (folder.id) {
              newExpandedFolders.add(folder.id);
              parentIds.forEach(id => newExpandedFolders.add(id));
            }
          }
        });
      }

      // Check subfolders
      let subfolderMatches = false;
      if (folder.Folders?.length) {
        const newParentIds = folder.id ? [...parentIds, folder.id] : parentIds;

        subfolderMatches = folder.Folders.some(subfolder =>
          processFolder(subfolder, newParentIds)
        );

        // If any subfolder matches, add this folder to expanded set
        if (subfolderMatches && folder.id) {
          newExpandedFolders.add(folder.id);
          parentIds.forEach(id => newExpandedFolders.add(id));
        }
      }

      return folderMatches || subfolderMatches;
    };

    // Process top-level folders
    const matchingFolders = folders.filter(folder => processFolder(folder));

    // Add matching unorganized templates
    const extraTemplates = unorganizedTemplates.filter(t =>
      templateMatchesQuery(t, query)
    );
    matchingTemplates.push(...extraTemplates);

    return {
      filteredFolders: matchingFolders,
      filteredTemplates: matchingTemplates,
      expandedIds: newExpandedFolders
    };
  }, [folders, unorganizedTemplates, searchQuery, folderMatchesQuery, templateMatchesQuery]);

  useEffect(() => {
    // Update expanded folders whenever expandedIds change
    if (searchQuery.trim()) {
      setExpandedFolders(expandedIds);
    }
  }, [expandedIds, searchQuery]);
  
  // Toggle folder expansion
  const toggleFolder = useCallback((folderId: number) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);
  
  // Clear search query
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setExpandedFolders(new Set());
  }, []);
  
  // Check if a folder is expanded
  const isExpanded = useCallback((folderId: number) => {
    return expandedFolders.has(folderId);
  }, [expandedFolders]);
  
  return {
    searchQuery,
    setSearchQuery,
    filteredFolders,
    filteredTemplates,
    expandedFolders,
    toggleFolder,
    clearSearch,
    isExpanded
  };
}