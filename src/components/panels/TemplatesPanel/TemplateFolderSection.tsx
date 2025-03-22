// src/components/panels/TemplatesPanel/TemplateFolderSection.tsx

import React, { useState } from 'react';
import { Template, TemplateFolder } from '@/types/templates';
import { TemplateItem } from './TemplateItem';
import { Star, ChevronRight, ChevronDown, Folder, MoreVertical, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TemplateFolderSectionProps {
  folders: TemplateFolder[];
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
  onTogglePin?: (folderId: number, isPinned: boolean, e: React.MouseEvent) => Promise<void>;
  onDeleteFolder?: (folderId: number) => Promise<boolean>;
  showPinControls?: boolean;
  type: 'official' | 'organization' | 'user';
}

/**
 * Component for rendering a section of template folders
 */
const TemplateFolderSection: React.FC<TemplateFolderSectionProps> = ({
  folders,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onTogglePin,
  onDeleteFolder,
  showPinControls = false,
  type
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

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

  // Handle folder pin toggling
  const handleTogglePin = async (folderId: number, isPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePin) {
      await onTogglePin(folderId, isPinned, e);
    }
  };

  // Handle folder deletion
  const handleDeleteFolder = async (folderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteFolder) {
      await onDeleteFolder(folderId);
    }
  };

  // Recursive function to render a folder and its contents
  const renderFolder = (folder: TemplateFolder) => {
    if (!folder || !folder.id || !folder.name) return null;
    
    const isExpanded = expandedFolders.has(folder.id);
    const isPinned = folder.is_pinned || false;
    const hasSubfolders = folder.Folders && folder.Folders.length > 0;
    const hasTemplates = folder.templates && folder.templates.length > 0;
    
    return (
      <div key={folder.id} className="folder-container mb-1">
        <div
          className="folder-header flex items-center p-2 hover:bg-accent/60 cursor-pointer rounded-sm"
          onClick={() => toggleFolder(folder.id)}
        >
          {(hasSubfolders || hasTemplates) ? (
            isExpanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />
          ) : (
            <div className="w-4 mr-1" />
          )}
          
          <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm flex-1">{folder.name}</span>
          
          <div className="flex items-center gap-1">
            {showPinControls && onTogglePin && (
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${isPinned ? 'text-yellow-500' : 'text-muted-foreground opacity-70 hover:opacity-100'}`}
                onClick={(e) => handleTogglePin(folder.id, isPinned, e)}
                title={isPinned ? 'Unpin folder' : 'Pin folder'}
              >
                <Star className={`h-4 w-4 ${isPinned ? 'fill-yellow-500' : ''}`} />
              </Button>
            )}
            
            {type === 'user' && onDeleteFolder && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground opacity-70 hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => handleDeleteFolder(folder.id, e)} className="text-destructive">
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="folder-content pl-6 mt-1">
            {/* Render templates in this folder */}
            {hasTemplates && folder.templates.map(template => (
              <TemplateItem
                key={`template-${template.id}`}
                template={template}
                onUseTemplate={onUseTemplate}
                onEditTemplate={onEditTemplate}
                onDeleteTemplate={onDeleteTemplate}
              />
            ))}
            
            {/* Recursively render subfolders */}
            {hasSubfolders && folder.Folders.map(subfolder => (
              renderFolder(subfolder)
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render all folders
  return (
    <div className="folders-section space-y-1">
      {folders.map(folder => renderFolder(folder))}
      
      {folders.length === 0 && (
        <div className="text-center py-2 text-xs text-muted-foreground">
          No folders available.
        </div>
      )}
    </div>
  );
};

export default TemplateFolderSection;