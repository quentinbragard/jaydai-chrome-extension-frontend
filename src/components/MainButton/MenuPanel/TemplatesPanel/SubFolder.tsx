import React, { useState } from 'react';
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

interface SubFolderProps {
  folder: TemplateFolder;
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
  isPinned?: boolean;
  onTogglePin?: (folderId: number, isPinned: boolean, e: React.MouseEvent) => void;
  onDeleteFolder?: (folderId: number) => Promise<boolean>;
  type?: 'official' | 'organization' | 'user';
}

const SubFolder: React.FC<SubFolderProps> = ({
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
          {folder.templates && folder.templates.map(template => (
            <TemplateItem 
              key={template.id}
              template={template}
              onUseTemplate={onUseTemplate}
              onEditTemplate={onEditTemplate}
              onDeleteTemplate={onDeleteTemplate}
            />
          ))}
          
          {folder.subfolders?.map(subfolder => (
            <SubFolder
              key={`${subfolder.id || subfolder.name}`}
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

export default SubFolder;