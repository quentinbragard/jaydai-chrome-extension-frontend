// src/features/templates/TemplateItem.tsx

import React from 'react';
import { FileText, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Template } from '@/types/templates';

interface TemplateItemProps {
  template: Template;
  onUse: (template: Template) => void;
  onEdit: (template: Template) => void;
  onDelete: (template: Template, e: React.MouseEvent) => void;
}

export const TemplateItem: React.FC<TemplateItemProps> = ({
  template,
  onUse,
  onEdit,
  onDelete
}) => {
  const displayName = template.title || template.name || 'Untitled Template';
  
  return (
    <div 
      className="flex items-center p-2 hover:bg-accent rounded-sm cursor-pointer group"
      onClick={() => onUse(template)}
    >
      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{displayName}</div>
        {template.description && (
          <div className="text-xs text-muted-foreground truncate">{template.description}</div>
        )}
      </div>
      <div className="ml-2 flex opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="xs" 
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(template);
          }}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="xs" 
          className="h-6 w-6 p-0 text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(template, e);
          }}
        >
          <Trash className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};