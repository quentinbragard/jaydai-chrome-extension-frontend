// src/hooks/prompts/utils/useOptimizedSearch.ts
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { TemplateFolder, Template } from '@/types/prompts/templates';

interface SearchableItem {
  id: number;
  type: 'template' | 'folder';
  title: string;
  content?: string;
  description?: string;
  folderPath?: string;
  folderType: 'user' | 'organization' | 'company';
  originalItem: Template | TemplateFolder;
  // Pre-computed search text for faster matching
  searchText: string;
}

interface SearchResult {
  templates: Array<Template & { 
    matchReason: 'title' | 'content' | 'description'; 
    folderPath?: string;
    folderType: 'user' | 'organization' | 'company';
  }>;
  folders: Array<TemplateFolder & { 
    folderType: 'user' | 'organization' | 'company';
  }>;
  totalResults: number;
}

/**
 * Optimized search hook with indexing, debouncing, and performance optimizations
 */
export function useOptimizedSearch(
  userFolders: TemplateFolder[] = [],
  organizationFolders: TemplateFolder[] = [],
  unorganizedTemplates: Template[] = []
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchIndexRef = useRef<SearchableItem[]>([]);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Helper function to safely extract text content
  const extractText = useCallback((content: any): string => {
    if (!content) return '';
    
    if (typeof content === 'string') return content;
    
    if (typeof content === 'object') {
      // Handle localized content objects
      return content.en || content.fr || Object.values(content)[0] || '';
    }
    
    return String(content);
  }, []);

  // Build search index when data changes
  const searchIndex = useMemo(() => {
    const items: SearchableItem[] = [];

    // Helper to extract all templates from folder hierarchy
    const extractTemplatesFromFolder = (
      folder: TemplateFolder, 
      folderType: 'user' | 'organization' | 'company',
      path: string[] = []
    ) => {
      if (!folder) return;
      
      const folderTitle = extractText(folder.title || folder.name);
      const currentPath = [...path, folderTitle];
      
      // Add folder to search index
      if (folder.id && folderTitle) {
        const folderDescription = extractText(folder.description);
        const searchText = [folderTitle, folderDescription].join(' ').toLowerCase();
        
        items.push({
          id: folder.id,
          type: 'folder',
          title: folderTitle,
          description: folderDescription,
          folderPath: currentPath.join(' > '),
          folderType,
          originalItem: folder,
          searchText
        });
      }
      
      // Add templates from this folder
      if (Array.isArray(folder.templates)) {
        folder.templates.forEach(template => {
          if (!template?.id) return;
          
          const title = extractText(template.title);
          const content = extractText(template.content);
          const description = extractText(template.description);
          const searchText = [title, content, description].join(' ').toLowerCase();
          
          items.push({
            id: template.id,
            type: 'template',
            title,
            content,
            description,
            folderPath: currentPath.join(' > '),
            folderType,
            originalItem: template,
            searchText
          });
        });
      }
      
      // Recursively process subfolders
      if (Array.isArray(folder.Folders)) {
        folder.Folders.forEach(subfolder => {
          extractTemplatesFromFolder(subfolder, folderType, currentPath);
        });
      }
    };

    // Process user folders
    if (Array.isArray(userFolders)) {
      userFolders.forEach(folder => {
        extractTemplatesFromFolder(folder, 'user');
      });
    }

    // Process organization folders
    if (Array.isArray(organizationFolders)) {
      organizationFolders.forEach(folder => {
        extractTemplatesFromFolder(folder, 'organization');
      });
    }

    // Process unorganized templates
    if (Array.isArray(unorganizedTemplates)) {
      unorganizedTemplates.forEach(template => {
        if (!template?.id) return;
        
        const title = extractText(template.title);
        const content = extractText(template.content);
        const description = extractText(template.description);
        const searchText = [title, content, description].join(' ').toLowerCase();
        
        items.push({
          id: template.id,
          type: 'template',
          title,
          content,
          description,
          folderPath: '',
          folderType: 'user',
          originalItem: template,
          searchText
        });
      });
    }

    // Cache the index
    searchIndexRef.current = items;
    console.log(`🔍 Search index built with ${items.length} items`);
    
    return items;
  }, [userFolders, organizationFolders, unorganizedTemplates, extractText]);

  // Debounce search query
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Optimized search function
  const searchResults = useMemo((): SearchResult => {
    if (!debouncedQuery.trim()) {
      return { templates: [], folders: [], totalResults: 0 };
    }

    const query = debouncedQuery.toLowerCase();
    const queryTerms = query.split(' ').filter(term => term.length > 0);
    
    const matchingTemplates: SearchResult['templates'] = [];
    const matchingFolders: SearchResult['folders'] = [];

    // Fast search through pre-built index
    for (const item of searchIndex) {
      // Skip if no search text
      if (!item.searchText) continue;

      // Check if all query terms are present (AND logic)
      const matchesAllTerms = queryTerms.every(term => 
        item.searchText.includes(term)
      );

      if (!matchesAllTerms) continue;

      if (item.type === 'template') {
        const template = item.originalItem as Template;
        
        // Determine match reason for better UX
        let matchReason: 'title' | 'content' | 'description' = 'content';
        
        if (item.title.toLowerCase().includes(query)) {
          matchReason = 'title';
        } else if (item.description?.toLowerCase().includes(query)) {
          matchReason = 'description';
        }

        matchingTemplates.push({
          ...template,
          matchReason,
          folderPath: item.folderPath,
          folderType: item.folderType
        });
      } else if (item.type === 'folder') {
        const folder = item.originalItem as TemplateFolder;
        
        matchingFolders.push({
          ...folder,
          folderType: item.folderType
        });
      }
    }

    // Sort results by relevance
    matchingTemplates.sort((a, b) => {
      // Title matches are more relevant
      if (a.matchReason === 'title' && b.matchReason !== 'title') return -1;
      if (b.matchReason === 'title' && a.matchReason !== 'title') return 1;
      
      // Then by usage count if available
      const aUsage = (a as any).usage_count || 0;
      const bUsage = (b as any).usage_count || 0;
      return bUsage - aUsage;
    });

    matchingFolders.sort((a, b) => {
      const aTitle = extractText(a.title || a.name);
      const bTitle = extractText(b.title || b.name);
      return aTitle.localeCompare(bTitle);
    });

    return {
      templates: matchingTemplates,
      folders: matchingFolders,
      totalResults: matchingTemplates.length + matchingFolders.length
    };
  }, [debouncedQuery, searchIndex, extractText]);

  // Update search query with immediate UI update
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    // Don't update debouncedQuery immediately - let the useEffect handle debouncing
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    searchQuery,
    setSearchQuery: updateSearchQuery,
    searchResults,
    clearSearch,
    hasResults: searchResults.totalResults > 0,
    isSearching: searchQuery !== debouncedQuery,
    totalIndexedItems: searchIndex.length
  };
}