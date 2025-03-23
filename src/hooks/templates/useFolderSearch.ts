// src/hooks/useFolderSearch.ts
import { useState, useEffect, useMemo } from 'react';
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
  
  // Filter folders based on search query
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) {
      return folders;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Helper function to check if a folder or any of its subfolders match the query
    const folderMatchesQuery = (folder: TemplateFolder): boolean => {
      // Check if this folder's name matches
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
      
      // Check if any of its subfolders match
      if (folder.Folders && folder.Folders.length > 0) {
        return folder.Folders.some(subfolder => folderMatchesQuery(subfolder));
      }
      
      return false;
    };
    
    // Filter top-level folders
    return folders.filter(folder => folderMatchesQuery(folder));
  }, [folders, searchQuery]);
  
  // Toggle folder expansion
  const toggleFolder = (folderId: number) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setExpandedFolders(new Set());
  };
  
  return {
    searchQuery,
    setSearchQuery,
    expandedFolders,
    toggleFolder,
    filteredFolders,
    clearSearch
  };
}