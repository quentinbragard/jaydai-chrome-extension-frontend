import React from 'react';
import { FileText, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Template } from './types';

interface TemplateItemProps {
  template: Template;
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
}

export const TemplateItem: React.FC<TemplateItemProps> = ({
  template,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate
}) => {
  // Ensure we have a display name, falling back through various options
  const displayName = template.title || 'Untitled Template';
  
  // Safely handle usage count
  const usageCount = typeof template.usage_count === 'number' ? template.usage_count : 0;
  
  return (
    <div 
      className="flex items-center p-2 hover:bg-accent/60 rounded-sm cursor-pointer group"
      onClick={() => onUseTemplate(template)}
    >
      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{displayName}</div>
        {template.description && (
          <div className="text-xs text-muted-foreground truncate">{template.description}</div>
        )}
        {usageCount > 0 && (
          <div className="text-xs text-muted-foreground">Used {usageCount} times</div>
        )}
      </div>
      {template.type === "user" && (
        <div className="ml-2 flex opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={(e) => {
            e.stopPropagation();
            onEditTemplate(template);
          }}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTemplate(template, e);
          }}
        >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};