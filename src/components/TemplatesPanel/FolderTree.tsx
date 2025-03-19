import React from 'react';
import { FolderOpen, ChevronRight, ChevronDown, Pin, PinOff } from "lucide-react";
import { TemplateFolder } from './types';
import { TemplateItem } from './TemplateItem';
import { Template } from './types';
import { Button } from "@/components/ui/button";

interface FolderTreeProps {
  folder: TemplateFolder;
  path?: string;
  expandedFolders: Set<string>;
  isPinned?: boolean;
  onToggleFolder: (path: string) => void;
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
  onTogglePin?: () => void;
}

const FolderTree: React.FC<FolderTreeProps> = ({
  folder,
  path = '',
  expandedFolders,
  isPinned = false,
  onToggleFolder,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onTogglePin
}) => {
  const currentPath = path ? `${path}/${folder.name}` : folder.name;
  const isExpanded = expandedFolders.has(currentPath);
  
  // Calculate total templates count including subfolders
  const getTotalTemplatesCount = (folder: TemplateFolder): number => {
    let count = folder.templates.length;
    folder.subfolders.forEach(subfolder => {
      count += getTotalTemplatesCount(subfolder);
    });
    return count;
  };
  
  const totalTemplatesCount = getTotalTemplatesCount(folder);
  
  if (totalTemplatesCount === 0) {
    return null; // Don't render empty folders
  }
  
  return (
    <div key={currentPath} className="folder-container">
      <div 
        className="folder-header flex items-center p-2 hover:bg-accent cursor-pointer relative"
      >
        <div 
          className="flex items-center flex-1" 
          onClick={() => onToggleFolder(currentPath)}
        >
          {isExpanded ? 
            <ChevronDown className="h-4 w-4 mr-1" /> : 
            <ChevronRight className="h-4 w-4 mr-1" />}
          <FolderOpen className="h-4 w-4 mr-2 text-amber-500" />
          <span className="text-sm">{folder.name}</span>
          <span className="ml-auto text-xs text-muted-foreground">{totalTemplatesCount}</span>
        </div>
        
        {onTogglePin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="ml-2 h-6 w-6 p-0"
          >
            {isPinned ? 
              <PinOff className="h-3.5 w-3.5 text-muted-foreground" /> : 
              <Pin className="h-3.5 w-3.5 text-muted-foreground" />}
          </Button>
        )}
      </div>
      
      {isExpanded && (
        <div className="folder-content pl-5">
          {folder.templates.map(template => (
            <TemplateItem 
              key={template.id}
              template={template}
              onUseTemplate={onUseTemplate}
              onEditTemplate={onEditTemplate}
              onDeleteTemplate={onDeleteTemplate}
            />
          ))}
          {folder.subfolders.map(subfolder => (
            <FolderTree
              key={`${currentPath}/${subfolder.name}`}
              folder={subfolder}
              path={currentPath}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onUseTemplate={onUseTemplate}
              onEditTemplate={onEditTemplate}
              onDeleteTemplate={onDeleteTemplate}
              isPinned={isPinned}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderTree;