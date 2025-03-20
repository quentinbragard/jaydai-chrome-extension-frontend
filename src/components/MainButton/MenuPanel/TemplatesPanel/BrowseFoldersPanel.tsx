import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ChevronRight, ChevronDown, Star, Folder } from "lucide-react";
import { promptApi } from '@/api/PromptApi';
import { TemplateFolder } from './types';
import { toast } from 'sonner';

interface BrowseFoldersPanelProps {
  folderType: 'official' | 'organization';
  pinnedFolderIds: number[];
  onPinChange: (folderId: number, isPinned: boolean) => Promise<void>;
  maxHeight?: string;
}

const BrowseFoldersPanel: React.FC<BrowseFoldersPanelProps> = ({
  folderType,
  pinnedFolderIds,
  onPinChange,
  maxHeight = '400px'
}) => {
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  
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
  const togglePin = async (folderId: number, isPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Call the parent handler to update pin status
      await onPinChange(folderId, isPinned);
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error(`Failed to ${isPinned ? 'unpin' : 'pin'} folder`);
    }
  };
  
  // Recursive component to render folder tree
  const renderFolder = (folder: TemplateFolder) => {
    // Skip rendering if folder doesn't have an id or name
    if (!folder || !folder.id || !folder.name) {
      console.warn("Skipping invalid folder:", folder);
      return null;
    }
    
    const isPinned = pinnedFolderIds && pinnedFolderIds.includes(folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    
    return (
      <div key={folder.id} className="folder-container">
        <div 
          className="folder-header flex items-center p-2 hover:bg-accent cursor-pointer group rounded-sm"
          onClick={() => toggleFolder(folder.id)}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
          <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm flex-1">{folder.name}</span>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 transition-opacity ${isPinned ? 'text-yellow-500' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`}
            onClick={(e) => togglePin(folder.id, isPinned, e)}
            title={isPinned ? 'Unpin folder' : 'Pin folder'}
          >
            <Star className={`h-4 w-4 ${isPinned ? 'fill-yellow-500' : ''}`} />
          </Button>
        </div>
        
        {isExpanded && folder.subfolders && folder.subfolders.length > 0 && (
          <div className="subfolder-container pl-5">
            {folder.subfolders.map(subfolder => renderFolder(subfolder))}
          </div>
        )}
      </div>
    );
  };
  
  const title = `${folderType === 'official' ? 'Official' : 'Organization'} Templates`;

  // Don't use a back button at the top level since we now have it controlled by MenuPanel
  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="p-0">
        <p className="px-4 py-2 text-xs text-muted-foreground">
          Pin {folderType} template folders to access them quickly.
        </p>
        
        <div 
          className="overflow-y-auto"
          style={{ maxHeight }}
        >
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading folders...</p>
            </div>
          ) : folders && folders.length > 0 ? (
            <div className="space-y-1 p-2">
              {folders.map(folder => renderFolder(folder))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No folders available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BrowseFoldersPanel;