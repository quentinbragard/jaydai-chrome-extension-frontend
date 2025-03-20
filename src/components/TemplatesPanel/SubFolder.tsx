import React, { useState } from 'react';
import { Template, TemplateFolder } from './types';
import { TemplateItem } from './TemplateItem';
import { ChevronRight, ChevronDown } from "lucide-react";

interface SubFolderProps {
  folder: TemplateFolder;
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
}

const SubFolder: React.FC<SubFolderProps> = ({
  folder,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className="subfolder-container">
      <div className="subfolder-header flex items-center p-2 hover:bg-accent cursor-pointer" onClick={toggleExpand}>
        {isExpanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
        <span className="text-sm">{folder.name}</span>
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
              key={subfolder.name}
              folder={subfolder}
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

export default SubFolder; 