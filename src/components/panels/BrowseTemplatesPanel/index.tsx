// src/components/panels/BrowseTemplatesPanel/index.tsx

import React, { useState, useEffect } from 'react';
import { FolderOpen, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import BasePanel from '../BasePanel';
import { promptApi } from '@/services/api/PromptApi';
import { TemplateFolder } from '@/types/templates';
import { toast } from 'sonner';

interface BrowseTemplatesPanelProps {
  folderType: 'official' | 'organization';
  pinnedFolderIds: number[];
  onPinChange: (folderId: number, isPinned: boolean) => Promise<void>;
  onBackToTemplates: () => void;
  maxHeight?: string;
}

/**
 * Panel for browsing and pinning template folders
 */
const BrowseTemplatesPanel: React.FC<BrowseTemplatesPanelProps> = ({
  folderType,
  pinnedFolderIds,
  onPinChange,
  onBackToTemplates,
  maxHeight = '400px'
}) => {
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFolders, setFilteredFolders] = useState<TemplateFolder[]>([]);
  
  // Load all folders of the specified type
  useEffect(() => {
    const loadFolders = async () => {
      setIsLoading(true);
      try {
        // Load all folders (empty=true means we don't load templates inside them, just structure)
        const response = await promptApi.getAllTemplateFolders(folderType, true);
        console.log(`Loaded ${folderType} folders:`, response);
        
        if (response.success && response.folders) {
          setFolders(response.folders);
          setFilteredFolders(response.folders);
        } else {
          toast.error(`Failed to load ${folderType} folders`);
        }
      } catch (error) {
        console.error(`Error loading ${folderType} folders:`, error);
        toast.error(`Error loading folders: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFolders();
  }, [folderType]);

  // Filter folders when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFolders(folders);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    // Helper function to check if a folder or any of its subfolders match the query
    const folderMatchesQuery = (folder: TemplateFolder): boolean => {
      // Check if this folder's name matches
      if (folder.name && folder.name.toLowerCase().includes(query)) {
        return true;
      }
      
      // Check if any of its subfolders match
      if (folder.Folders && folder.Folders.length > 0) {
        return folder.Folders.some(subfolder => folderMatchesQuery(subfolder));
      }
      
      return false;
    };
    
    // Filter top-level folders
    const filtered = folders.filter(folder => folderMatchesQuery(folder));
    setFilteredFolders(filtered);
    
  }, [searchQuery, folders]);
  
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
  
  // Toggle pin status for a folder
  const handleTogglePin = async (folderId: number, isPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Call the parent handler to update pin status
      await onPinChange(folderId, isPinned);
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error(`Failed to ${isPinned ? 'unpin' : 'pin'} folder`);
    }
  };
  
  // Reset search and close expanded folders
  const handleResetSearch = () => {
    setSearchQuery('');
    setExpandedFolders(new Set());
  };

  // Recursive component to render folder tree
  const renderFolderTree = () => {
    if (isLoading) {
      return (
        <div className="py-8 text-center">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading folders...</p>
        </div>
      );
    }
    
    if (filteredFolders.length === 0) {
      return (
        <div className="py-8 text-center">
          {searchQuery ? (
            <p className="text-sm text-muted-foreground">No folders matching "{searchQuery}"</p>
          ) : (
            <p className="text-sm text-muted-foreground">No folders available</p>
          )}
        </div>
      );
    }
    
    const renderFolder = (folder: TemplateFolder) => {
      // Skip rendering if folder doesn't have an id or name
      if (!folder || !folder.id || !folder.name) {
        return null;
      }
      
      const isPinned = pinnedFolderIds.includes(folder.id);
      const isExpanded = expandedFolders.has(folder.id);
      
      return (
        <div key={folder.id} className="folder-container">
          <div 
            className="folder-header flex items-center p-2 hover:bg-accent cursor-pointer group rounded-sm"
            onClick={() => toggleFolder(folder.id)}
          >
            <span className="mr-1">{isExpanded ? '▼' : '▶'}</span>
            <span className="text-sm flex-1">{folder.name}</span>
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 transition-opacity ${isPinned ? 'text-yellow-500' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`}
              onClick={(e) => handleTogglePin(folder.id, isPinned, e)}
              title={isPinned ? 'Unpin folder' : 'Pin folder'}
            >
              <span className={`${isPinned ? 'text-yellow-500' : ''}`}>★</span>
            </Button>
          </div>
          
          {isExpanded && folder.Folders && folder.Folders.length > 0 && (
            <div className="subfolder-content pl-5">
              {folder.Folders.map(subfolder => renderFolder(subfolder))}
            </div>
          )}
        </div>
      );
    };
    
    return (
      <div className="space-y-1 p-2">
        {filteredFolders.map(folder => renderFolder(folder))}
      </div>
    );
  };

  return (
    <BasePanel
      title={folderType === 'official' ? 'Official Templates' : 'Organization Templates'}
      icon={FolderOpen}
      showBackButton={true}
      onBack={onBackToTemplates}
      className="w-80"
      maxHeight={maxHeight}
    >
      <div className="p-4">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${folderType} folders...`}
            className="pl-8 pr-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={handleResetSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Pin {folderType} template folders to access them quickly.
        </p>
      </div>
      
      <Separator />
      
      <div className="overflow-y-auto">
        {renderFolderTree()}
      </div>
    </BasePanel>
  );
};

export default BrowseTemplatesPanel;