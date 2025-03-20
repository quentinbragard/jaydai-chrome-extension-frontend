import React, { useState } from 'react';
import { Template, TemplateFolder } from './types';
import { TemplateItem } from './TemplateItem';
import { ChevronRight, ChevronDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubFolderProps {
  folder: TemplateFolder;
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
  isPinned?: boolean;
  onTogglePin?: (folderId: number, isPinned: boolean, e: React.MouseEvent) => void;
  type?: 'official' | 'organization' | 'user';
}

const SubFolder: React.FC<SubFolderProps> = ({
  folder,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  isPinned = false,
  onTogglePin,
  type = 'user'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);
  
  // Only show pin button for official and organization folders
  const showPinButton = (type === 'official' || type === 'organization') && onTogglePin;

  return (
    <div className="subfolder-container">
      <div className="subfolder-header flex items-center p-2 hover:bg-accent cursor-pointer group rounded-sm" onClick={toggleExpand}>
        {isExpanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
        <span className="text-sm flex-1">{folder.name}</span>
        
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
      </div>
      
      {isExpanded && (
        <div className="subfolder-content pl-5">
          {folder.templates.map(template => (
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SubFolder;