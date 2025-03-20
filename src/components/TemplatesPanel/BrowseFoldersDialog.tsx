import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogOverlay
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { promptApi } from '@/api/PromptApi';
import { TemplateFolder } from './types';
import { ChevronRight, ChevronDown, Star, Folder, X } from "lucide-react";
import { toast } from 'sonner';
import { cn } from "@/core/utils/classNames";

interface BrowseFoldersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderType: 'official' | 'organization';
  pinnedFolderIds: number[];
  onPinChange: (folderId: number, isPinned: boolean) => Promise<void>;
}

const BrowseFoldersDialog: React.FC<BrowseFoldersDialogProps> = ({
  open,
  onOpenChange,
  folderType,
  pinnedFolderIds,
  onPinChange
}) => {
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  
  // Load all folders of the specified type
  useEffect(() => {
    if (!open) return;
    
    const loadFolders = async () => {
      setIsLoading(true);
      try {
        // Load all folders (empty=true means we don't load templates inside them, just structure)
        const response = await promptApi.getAllTemplateFolders(folderType, true);
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
  }, [open, folderType]);
  
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
      await onPinChange(folderId, !isPinned);
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error(`Failed to ${isPinned ? 'unpin' : 'pin'} folder`);
    }
  };
  
  // Recursive component to render folder tree
  const renderFolder = (folder: TemplateFolder) => {
    const isPinned = pinnedFolderIds.includes(folder.id);
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
  
  const dialogTitle = `Browse ${folderType === 'official' ? 'Official' : 'Organization'} Templates`;

  if (!open) return null;

  // Using a custom dialog implementation for full control
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div 
        className={cn(
          "bg-background rounded-lg shadow-lg",
          "w-[500px] max-w-[90vw] max-h-[90vh]",
          "flex flex-col overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">{dialogTitle}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Description */}
        <div className="px-4 py-2 text-sm text-muted-foreground">
          {`Pin ${folderType} template folders to access them quickly. Starred folders will appear in your templates panel.`}
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading folders...</p>
            </div>
          ) : folders.length > 0 ? (
            <div className="space-y-1">
              {folders.map(folder => renderFolder(folder))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No folders available</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BrowseFoldersDialog;