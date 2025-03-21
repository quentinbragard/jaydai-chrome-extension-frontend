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
  level?: number; // Track nesting level to prevent infinite recursion
}

const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  isPinned = false,
  onTogglePin,
  onDeleteFolder,
  type = 'user',
  level = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Prevent infinite recursion by limiting depth
  const MAX_DEPTH = 5;
  if (level > MAX_DEPTH) {
    console.warn(`Maximum folder depth reached: ${folder.name}`);
    return null;
  }

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

  // Process templates and create folder structure
  const { directTemplates, subfolders } = useMemo(() => {
    if (!folder || !folder.templates) {
      return { directTemplates: [], subfolders: {} };
    }

    const directTemplates: Template[] = [];
    const subfolders: Record<string, {
      name: string,
      templates: Template[],
      children: Record<string, any>
    }> = {};

    folder.templates.forEach(template => {
      if (!template.path || template.path === '') {
        // Templates without path go directly in this folder
        directTemplates.push(template);
        return;
      }

      // Split the path and process
      const pathParts = template.path.split('/').filter(Boolean);
      
      if (pathParts.length === 0) {
        // Empty path after filtering - add to direct templates
        directTemplates.push(template);
        return;
      }

      // Process the path parts to create the folder hierarchy
      let currentLevel = subfolders;
      let currentPath = '';

      pathParts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        // Create this level if it doesn't exist
        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            templates: [],
            children: {}
          };
        }
        
        // If this is the last path part, add the template to this folder
        if (index === pathParts.length - 1) {
          currentLevel[part].templates.push(template);
        }
        
        // Move to the next level for the next iteration
        currentLevel = currentLevel[part].children;
      });
    });

    return { 
      directTemplates, 
      subfolders 
    };
  }, [folder]);

  // Convert the subfolders object to an array for rendering
  const subfoldersArray = useMemo(() => {
    return Object.entries(subfolders).map(([key, value]) => ({
      id: 0, // Temporary ID
      name: value.name,
      templates: value.templates,
      subfolderMap: value.children,
      path: key
    }));
  }, [subfolders]);

  // If folder is undefined, don't render anything
  if (!folder) {
    return null;
  }

  return (
    <div className="subfolder-container">
      <div 
        className="subfolder-header flex items-center p-2 hover:bg-accent cursor-pointer group rounded-sm" 
        onClick={toggleExpand}
      >
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
          {/* Direct templates in this folder */}
          {directTemplates.map(template => (
            <TemplateItem 
              key={`template-${template.id}`}
              template={template}
              onUseTemplate={onUseTemplate}
              onEditTemplate={onEditTemplate}
              onDeleteTemplate={onDeleteTemplate}
            />
          ))}
          
          {/* Render subfolders */}
          {subfoldersArray.map(subfolder => (
            <SubfolderRenderer
              key={`subfolder-${subfolder.path}`}
              name={subfolder.name}
              templates={subfolder.templates}
              subfolderMap={subfolder.subfolderMap}
              onUseTemplate={onUseTemplate}
              onEditTemplate={onEditTemplate}
              onDeleteTemplate={onDeleteTemplate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Helper component to render subfolders
interface SubfolderRendererProps {
  name: string;
  templates: Template[];
  subfolderMap: Record<string, any>;
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
  level: number;
}

const SubfolderRenderer: React.FC<SubfolderRendererProps> = ({
  name,
  templates,
  subfolderMap,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  level
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Convert the subfolders object to an array for rendering
  const subfoldersArray = useMemo(() => {
    return Object.entries(subfolderMap).map(([key, value]) => ({
      name: value.name,
      templates: value.templates,
      subfolderMap: value.children,
      path: key
    }));
  }, [subfolderMap]);

  return (
    <div className="subfolder-container">
      <div 
        className="subfolder-header flex items-center p-2 hover:bg-accent cursor-pointer group rounded-sm" 
        onClick={toggleExpand}
      >
        {isExpanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
        <span className="text-sm flex-1">{name}</span>
      </div>
      
      {isExpanded && (
        <div className="subfolder-content pl-5">
          {/* Templates directly in this subfolder */}
          {templates.map(template => (
            <TemplateItem 
              key={`template-${template.id}`}
              template={template}
              onUseTemplate={onUseTemplate}
              onEditTemplate={onEditTemplate}
              onDeleteTemplate={onDeleteTemplate}
            />
          ))}
          
          {/* Render nested subfolders */}
          {subfoldersArray.map(subfolder => (
            <SubfolderRenderer
              key={`subfolder-${subfolder.path}`}
              name={subfolder.name}
              templates={subfolder.templates}
              subfolderMap={subfolder.subfolderMap}
              onUseTemplate={onUseTemplate}
              onEditTemplate={onEditTemplate}
              onDeleteTemplate={onDeleteTemplate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderItem;