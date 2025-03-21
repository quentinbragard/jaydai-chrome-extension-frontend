import React, { useState, useMemo } from 'react';
import { Template, TemplateFolder } from './types';
import { TemplateItem } from './TemplateItem';
import { ChevronRight, ChevronDown, Star, Trash, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FolderItemProps {
  folder: TemplateFolder;
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
  isPinned?: boolean;
  onTogglePin?: (folderId: number, isPinned: boolean, e: React.MouseEvent) => void;
  onDeleteFolder?: (folderId: number) => Promise<boolean>;
  type?: 'official' | 'organization' | 'user';
}

// Helper function to organize templates into a folder structure based on paths
const organizeTemplatesByPath = (templates: Template[]) => {
  if (!templates || !Array.isArray(templates)) {
    console.log('Templates is not an array', templates);
    return { rootTemplates: [], subfolders: [] };
  }

  const rootTemplates: Template[] = [];
  const subfolders: Record<string, TemplateFolder> = {};

  templates.forEach(template => {
    if (!template) {
      console.log('Template is undefined');
      return;
    }

    if (!template.path || template.path === '') {
      // Templates without a path or with empty path go to the root
      rootTemplates.push(template);
      return;
    }

    const pathParts = template.path.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      // If path is just "/" or empty after filtering, it's a root template
      rootTemplates.push(template);
      return;
    }

    // Build folder hierarchy
    let currentPath = '';
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLastPart = i === pathParts.length - 1;
      const prevPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      // Create folder if it doesn't exist
      if (!subfolders[currentPath]) {
        subfolders[currentPath] = {
          id: 0, // IDs will be generated as needed
          name: part,
          templates: [],
          path: currentPath,
          subfolders: []
        };
      }

      // Add template to the last folder in the path
      if (isLastPart) {
        subfolders[currentPath].templates.push(template);
      }

      // Add this folder as a subfolder of its parent
      if (prevPath && subfolders[prevPath]) {
        // Ensure the parent has a subfolders array
        if (!subfolders[prevPath].subfolders) {
          subfolders[prevPath].subfolders = [];
        }
        
        // Only add if not already added
        if (!subfolders[prevPath].subfolders?.some((sf: TemplateFolder) => sf.path === currentPath)) {
          subfolders[prevPath].subfolders?.push(subfolders[currentPath]);
        }
      }
    }
  });

  // Return first-level subfolders (direct children of root)
  return {
    rootTemplates,
    subfolders: Object.values(subfolders).filter(folder => {
      const pathParts = folder.path?.split('/').filter(Boolean) || [];
      return pathParts.length === 1;
    })
  };
};

const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  isPinned = false,
  onTogglePin,
  onDeleteFolder,
  type = 'user'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);
  
  // Only show pin button for official and organization folders
  const showPinButton = (type === 'official' || type === 'organization') && onTogglePin;
  
  // Only show delete button for user folders
  const showDeleteButton = type === 'user' && onDeleteFolder;

  const handleDeleteFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteFolder && folder.id) {
      await onDeleteFolder(folder.id);
    }
  };

  // Organize templates by path
  const { rootTemplates, subfolders } = useMemo(() => {
    // Add null check for folder
    if (!folder || !folder.templates) {
      console.log('Folder or templates is undefined', folder);
      return { rootTemplates: [], subfolders: [] };
    }
    
    return organizeTemplatesByPath(folder.templates);
  }, [folder]);

  // If folder is undefined, don't render anything
  if (!folder) {
    console.log('Folder is undefined, not rendering');
    return null;
  }

  return (
    <div className="subfolder-container">
      <div className="subfolder-header flex items-center p-2 hover:bg-accent cursor-pointer group rounded-sm" onClick={toggleExpand}>
        {isExpanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
        <span className="text-sm flex-1">{folder.name}</span>
        
        <div className="flex items-center">
          {showPinButton && (
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 transition-opacity ${isPinned ? 'text-yellow-500' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onTogglePin) onTogglePin(folder.id, isPinned, e);
              }}
              title={isPinned ? 'Unpin folder' : 'Pin folder'}
            >
              <Star className={`h-4 w-4 ${isPinned ? 'fill-yellow-500' : ''}`} />
            </Button>
          )}
          
          {showDeleteButton && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDeleteFolder} className="text-destructive">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="subfolder-content pl-5">
          {/* Display root-level templates (no path or root path) */}
          {rootTemplates.map(template => (
            <TemplateItem 
              key={template.id}
              template={template}
              onUseTemplate={onUseTemplate}
              onEditTemplate={onEditTemplate}
              onDeleteTemplate={onDeleteTemplate}
            />
          ))}
          
          {/* Display subfolders created from paths */}
          {subfolders.map(subfolder => (
            <FolderItem
              key={`${subfolder.path || subfolder.name}`}
              folder={subfolder}
              onUseTemplate={onUseTemplate}
              onEditTemplate={onEditTemplate}
              onDeleteTemplate={onDeleteTemplate}
              type={type}
              isPinned={isPinned}
              onTogglePin={onTogglePin}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderItem;