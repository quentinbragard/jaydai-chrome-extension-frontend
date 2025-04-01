// src/hooks/templates/useFolderSearch.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { TemplateFolder } from '@/types/templates';

/**
 * Hook for handling folder search functionality
 */
export function useFolderSearch(folders: TemplateFolder[] = []) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  
  // Reset expanded folders when search query is cleared
  useEffect(() => {
    if (!searchQuery) {
      setExpandedFolders(new Set());
    }
  }, [searchQuery]);
  
  // Memoized function to check if a folder or any of its contents match the query
  const folderMatchesQuery = useCallback((folder: TemplateFolder, query: string): boolean => {
    // Check if folder name matches
    if (folder.name && folder.name.toLowerCase().includes(query)) {
      return true;
    }
    
    // Check if any templates in this folder match
    if (folder.templates && folder.templates.length > 0) {
      const matchingTemplate = folder.templates.some(template => 
        (template.title && template.title.toLowerCase().includes(query)) ||
        (template.description && template.description.toLowerCase().includes(query))
      );
      if (matchingTemplate) return true;
    }
    
    // Check if any subfolders match
    if (folder.Folders && folder.Folders.length > 0) {
      return folder.Folders.some(subfolder => folderMatchesQuery(subfolder, query));
    }
    
    return false;
  }, []);
  
  // Filter folders based on search query - memoized to prevent unnecessary recalculation
  const filteredFolders = useMemo(() => {
    // If no search query, return all folders
    if (!searchQuery.trim()) {
      return folders;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Auto-expand all matching folders
    const newExpandedFolders = new Set<number>();
    
    // Helper function to collect all folder IDs that should be expanded
    const collectExpandedFolderIds = (folder: TemplateFolder): void => {
      if (folder.id && folderMatchesQuery(folder, query)) {
        newExpandedFolders.add(folder.id);
      }
      
      // Process subfolders recursively
      if (folder.Folders && folder.Folders.length > 0) {
        folder.Folders.forEach(subfolder => {
          if (folderMatchesQuery(subfolder, query)) {
            if (folder.id) newExpandedFolders.add(folder.id); // Expand parent too
            collectExpandedFolderIds(subfolder);
          }
        });
      }
    };
    
    // Process all top-level folders
    folders.forEach(folder => collectExpandedFolderIds(folder));
    
    // Update expanded folders set
    setExpandedFolders(newExpandedFolders);
    
    // Filter top-level folders
    return folders.filter(folder => folderMatchesQuery(folder, query));
  }, [folders, searchQuery, folderMatchesQuery]);
  
  // Toggle folder expansion - memoized to maintain reference stability
  const toggleFolder = useCallback((folderId: number) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);
  
  // Clear search - memoized to maintain reference stability
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setExpandedFolders(new Set());
  }, []);
  
  return {
    searchQuery,
    setSearchQuery,
    expandedFolders,
    toggleFolder,
    filteredFolders,
    clearSearch,
    isExpanded: (folderId: number) => expandedFolders.has(folderId)
  };
}