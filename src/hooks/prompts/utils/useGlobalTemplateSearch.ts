// src/hooks/prompts/utils/useGlobalTemplateSearch.ts
import { useState, useMemo, useCallback } from 'react';
import { TemplateFolder, Template } from '@/types/prompts/templates';

interface SearchResult {
  templates: Array<Template & { matchReason: 'title' | 'content' | 'description'; folderPath?: string }>;
  folders: TemplateFolder[];
}

/**
 * Hook for global template search across all folders and templates
 */
export function useGlobalTemplateSearch(
  userFolders: TemplateFolder[] = [],
  organizationFolders: TemplateFolder[] = [],
  unorganizedTemplates: Template[] = []
) {
  const [searchQuery, setSearchQuery] = useState('');

  // Function to extract all templates from folder hierarchy
  const extractAllTemplates = useCallback((folders: TemplateFolder[], folderType: 'user' | 'organization') => {
    const allTemplates: Array<Template & { folderPath?: string; folderType: 'user' | 'organization' }> = [];
    
    // Safety check for folders array
    if (!Array.isArray(folders)) {
      return allTemplates;
    }
    
    const extractFromFolder = (folder: TemplateFolder, path: string[] = []) => {
      // Safety checks for folder and its properties
      if (!folder || !folder.title) return;
      
      const currentPath = [...path, folder.title].join(' > ');
      
      // Add templates from current folder
      if (Array.isArray(folder.templates)) {
        folder.templates.forEach(template => {
          // Safety check for template
          if (template && template.id) {
            allTemplates.push({
              ...template,
              folderPath: currentPath,
              folderType
            });
          }
        });
      }
      
      // Recursively process subfolders
      if (Array.isArray(folder.Folders)) {
        folder.Folders.forEach(subfolder => {
          if (subfolder) {
            extractFromFolder(subfolder, [...path, folder.title]);
          }
        });
      }
    };
    
    folders.forEach(folder => {
      if (folder) {
        extractFromFolder(folder);
      }
    });
    
    return allTemplates;
  }, []);

  // Get all templates from all sources
  const allTemplates = useMemo(() => {
    // Safety checks for input arrays
    const safeUserFolders = Array.isArray(userFolders) ? userFolders : [];
    const safeOrgFolders = Array.isArray(organizationFolders) ? organizationFolders : [];
    const safeUnorganizedTemplates = Array.isArray(unorganizedTemplates) ? unorganizedTemplates : [];
    
    const userTemplates = extractAllTemplates(safeUserFolders, 'user');
    const orgTemplates = extractAllTemplates(safeOrgFolders, 'organization');
    
    const unorganized = safeUnorganizedTemplates
      .filter(template => template && template.id) // Filter out invalid templates
      .map(template => ({
        ...template,
        folderType: 'user' as const
      }));
    
    return [...userTemplates, ...orgTemplates, ...unorganized];
  }, [userFolders, organizationFolders, unorganizedTemplates, extractAllTemplates]);

  // Helper function to safely convert to lowercase and check inclusion
  const safeStringIncludes = useCallback((value: any, query: string): boolean => {
    if (!value) return false;
    if (typeof value !== 'string') return false;
    return value.toLowerCase().includes(query);
  }, []);

  // Search function
  const searchResults = useMemo((): SearchResult => {
    if (!searchQuery.trim()) {
      return { templates: [], folders: [] };
    }

    const query = searchQuery.toLowerCase();
    const matchingTemplates: Array<Template & { matchReason: 'title' | 'content' | 'description'; folderPath?: string }> = [];

    // Search through all templates
    allTemplates.forEach(template => {
      let matchReason: 'title' | 'content' | 'description' | null = null;

      // Check title - with safe string handling
      if (safeStringIncludes(template.title, query)) {
        matchReason = 'title';
      }
      // Check content - with safe string handling
      else if (safeStringIncludes(template.content, query)) {
        matchReason = 'content';
      }
      // Check description - with safe string handling
      else if (safeStringIncludes(template.description, query)) {
        matchReason = 'description';
      }

      if (matchReason) {
        matchingTemplates.push({
          ...template,
          matchReason,
          folderPath: template.folderPath
        });
      }
    });

    // Also search folders (existing logic) - with safe string handling
    const matchingFolders: TemplateFolder[] = [];
    
    const searchInFolders = (folders: TemplateFolder[]) => {
      if (!Array.isArray(folders)) return;
      
      folders.forEach(folder => {
        if (!folder) return; // Skip null/undefined folders
        
        if (safeStringIncludes(folder.title, query)) {
          matchingFolders.push(folder);
        }
        if (folder.Folders && Array.isArray(folder.Folders)) {
          searchInFolders(folder.Folders);
        }
      });
    };

    // Ensure we have valid arrays before searching
    const validUserFolders = Array.isArray(userFolders) ? userFolders : [];
    const validOrgFolders = Array.isArray(organizationFolders) ? organizationFolders : [];
    
    searchInFolders([...validUserFolders, ...validOrgFolders]);

    return {
      templates: matchingTemplates,
      folders: matchingFolders
    };
  }, [searchQuery, allTemplates, userFolders, organizationFolders, safeStringIncludes]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    clearSearch,
    hasResults: searchResults.templates.length > 0 || searchResults.folders.length > 0
  };
}