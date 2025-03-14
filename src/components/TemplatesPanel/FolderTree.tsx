import React from 'react';
import { FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { TemplateFolder } from './types';
import { TemplateItem } from './TemplateItem';
import { Template } from './types';

interface FolderTreeProps {
  folder: TemplateFolder;
  path?: string;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
}

const FolderTree: React.FC<FolderTreeProps> = ({
  folder,
  path = '',
  expandedFolders,
  onToggleFolder,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate
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
        className="folder-header flex items-center p-2 hover:bg-accent cursor-pointer"
        onClick={() => onToggleFolder(currentPath)}
      >
        {isExpanded ? 
          <ChevronDown className="h-4 w-4 mr-1" /> : 
          <ChevronRight className="h-4 w-4 mr-1" />}
        <FolderOpen className="h-4 w-4 mr-2 text-amber-500" />
        <span className="text-sm">{folder.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">{totalTemplatesCount}</span>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderTree;