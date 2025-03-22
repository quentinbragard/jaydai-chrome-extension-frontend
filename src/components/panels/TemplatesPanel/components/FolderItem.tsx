// src/components/panels/TemplatesPanel/components/FolderItem.tsx

import React from 'react';
import { ChevronRight, ChevronDown, Folder } from "lucide-react";
import { Template, TemplateFolder } from '@/types/templates';
import { Button } from "@/components/ui/button";
import { Star, MoreVertical, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplateItem } from './TemplateItem';

interface FolderItemProps {
  folder: TemplateFolder;
  isExpanded: boolean;
  onToggleExpand: (folderId: number) => void;
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
  onTogglePin?: (folderId: number, isPinned: boolean) => Promise<void> | void;
  onDeleteFolder?: (folderId: number) => Promise<boolean> | void;
  showPinControls?: boolean;
  showDeleteControls?: boolean;
  type: 'official' | 'organization' | 'user';
  level?: number;
}

/**
 * Component for rendering a single folder item with its templates and subfolders
 */
const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  isExpanded,
  onToggleExpand,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onTogglePin,
  onDeleteFolder,
  showPinControls = false,
  showDeleteControls = false,
  type,
  level = 0
}) => {
  // Add defensive checks for folder validity
  if (!folder || !folder.id || !folder.name) {
    console.warn('Invalid folder data:', folder);
    return null;
  }
  
  // Prevent infinite recursion by limiting depth
  if (level > 5) {
    console.warn(`Maximum folder depth reached: ${folder.name}`);
    return null;
  }
  
  // Ensure folder.templates is an array (defense against null/undefined)
  const templates = Array.isArray(folder.templates) ? folder.templates : [];
  
  // Ensure folder.Folders is an array (defense against null/undefined)
  const subfolders = Array.isArray(folder.Folders) ? folder.Folders : [];
  
  const isPinned = !!folder.is_pinned;
  const hasTemplates = templates.length > 0;
  const hasSubfolders = subfolders.length > 0;
  const hasContent = hasTemplates || hasSubfolders;
  
  // Count templates for display
  const templateCount = templates.length;
  
  // Debug folder data if needed
  console.log(`Rendering folder ${folder.name} (${folder.id}) of type ${type}:`, {
    templates: templates.length,
    subfolders: subfolders.length,
    isPinned,
    hasContent
  });
  
  const handleToggle = () => {
    if (hasContent) {
      onToggleExpand(folder.id);
    }
  };
  
  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePin) {
      await onTogglePin(folder.id, isPinned);
    }
  };
  
  const handleDeleteFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteFolder) {
      await onDeleteFolder(folder.id);
    }
  };

  return (
    <div className="folder-container mb-1">
      <div
        className={`folder-header flex items-center p-2 hover:bg-accent/60 cursor-pointer rounded-sm ${
          hasContent ? '' : 'opacity-60'
        }`}
        onClick={handleToggle}
      >
        {hasContent ? (
          isExpanded ? 
            <ChevronDown className="h-4 w-4 mr-1 flex-shrink-0" /> : 
            <ChevronRight className="h-4 w-4 mr-1 flex-shrink-0" />
        ) : (
          <div className="w-4 mr-1" />
        )}
        
        <Folder className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
        <span className="text-sm flex-1 truncate">{folder.name}</span>
        
        {templateCount > 0 && (
          <span className="text-xs text-muted-foreground mr-2">
            {templateCount} {templateCount === 1 ? 'template' : 'templates'}
          </span>
        )}
        
        <div className="flex items-center gap-1">
          {/* Pin button for official and organization folders */}
          {showPinControls && onTogglePin && (type === 'official' || type === 'organization') && (
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 flex-shrink-0 ${isPinned ? 'text-yellow-500' : 'text-muted-foreground opacity-70 hover:opacity-100'}`}
              onClick={handleTogglePin}
              title={isPinned ? 'Unpin folder' : 'Pin folder'}
            >
              <Star className={`h-4 w-4 ${isPinned ? 'fill-yellow-500' : ''}`} />
            </Button>
          )}
          
          {/* Delete button for user folders */}
          {showDeleteControls && onDeleteFolder && type === 'user' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0 text-muted-foreground opacity-70 hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleDeleteFolder} 
                  className="text-destructive cursor-pointer"
                >
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
          {/* Render templates with defensive checking */}
          {hasTemplates && templates.map(template => {
            if (!template || !template.id) return null;
            return (
              <TemplateItem
                key={`template-${template.id}`}
                template={template}
                onUseTemplate={onUseTemplate}
                onEditTemplate={onEditTemplate}
                onDeleteTemplate={onDeleteTemplate}
              />
            );
          })}
          
          {/* Recursively render subfolders with defensive checking */}
          {hasSubfolders && subfolders.map(subfolder => {
            if (!subfolder || !subfolder.id) return null;
            return (
              <FolderItem
                key={`subfolder-${subfolder.id}-${type}`}
                folder={subfolder}
                isExpanded={false} // Subfolders are collapsed by default
                onToggleExpand={onToggleExpand}
                onUseTemplate={onUseTemplate}
                onEditTemplate={onEditTemplate}
                onDeleteTemplate={onDeleteTemplate}
                onTogglePin={onTogglePin}
                onDeleteFolder={onDeleteFolder}
                showPinControls={showPinControls}
                showDeleteControls={showDeleteControls}
                type={type}
                level={level + 1}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FolderItem;