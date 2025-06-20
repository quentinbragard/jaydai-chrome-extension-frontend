// src/components/prompts/common/ItemList.tsx
import React from 'react';
import { FolderOpen, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TemplateItem } from '@/components/prompts/templates/TemplateItem';
import { Template, TemplateFolder } from '@/types/prompts/templates';

interface ItemListProps {
  items: (TemplateFolder | Template)[];
  type: 'user' | 'company' | 'organization';
  onFolderClick?: (folder: TemplateFolder) => void;
  onTemplateUse?: (template: Template) => void;
  onTemplateEdit?: (template: Template) => void;
  onTemplateDelete?: (templateId: number) => void;
  onFolderDelete?: (folderId: number) => void;
  showControls?: boolean;
  className?: string;
}

/**
 * Component for displaying mixed lists of folders and templates
 */
export function ItemList({
  items,
  type,
  onFolderClick,
  onTemplateUse,
  onTemplateEdit,
  onTemplateDelete,
  onFolderDelete,
  showControls = false,
  className = ''
}: ItemListProps) {
  const isFolder = (item: TemplateFolder | Template): item is TemplateFolder => {
    return 'templates' in item || 'Folders' in item;
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`jd-space-y-1 jd-px-2 ${className}`}>
      {items.map((item) => {
        if (isFolder(item)) {
          // Render folder
          const folder = item as TemplateFolder;
          const itemCount = (folder.Folders?.length || 0) + (folder.templates?.length || 0);
          
          return (
            <div 
              key={`folder-${folder.id}`}
              className="jd-group jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-cursor-pointer jd-rounded-sm jd-transition-colors"
              onClick={() => onFolderClick?.(folder)}
            >
              <FolderOpen className="jd-h-4 jd-w-4 jd-mr-2 jd-text-muted-foreground jd-flex-shrink-0" />
              
              <div className="jd-flex-1 jd-min-w-0">
                <span className="jd-text-sm jd-truncate jd-block">{folder.title}</span>
                {folder.description && (
                  <span className="jd-text-xs jd-text-muted-foreground jd-truncate jd-block">
                    {folder.description}
                  </span>
                )}
              </div>
              
              {itemCount > 0 && (
                <span className="jd-text-xs jd-text-muted-foreground jd-mr-2 jd-flex-shrink-0">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </span>
              )}
              
              <div className="jd-flex jd-items-center jd-gap-1">
                {showControls && type === 'user' && onFolderDelete && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="jd-opacity-0 group-hover:jd-opacity-100 jd-text-red-500 hover:jd-text-red-600 hover:jd-bg-red-100 jd-dark:hover:jd-bg-red-900/30 jd-h-6 jd-w-6 jd-p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFolderDelete(folder.id);
                    }}
                    title="Delete folder"
                  >
                    <Trash2 className="jd-h-3.5 jd-w-3.5" />
                  </Button>
                )}
                
                {onFolderClick && (
                  <ChevronRight className="jd-h-4 jd-w-4 jd-text-muted-foreground jd-opacity-70 group-hover:jd-opacity-100 jd-transition-opacity jd-flex-shrink-0" />
                )}
              </div>
            </div>
          );
        } else {
          // Render template
          const template = item as Template;
          return (
            <TemplateItem
              key={`template-${template.id}`}
              template={template}
              type={type}
              onUseTemplate={onTemplateUse}
              onEditTemplate={onTemplateEdit}
              onDeleteTemplate={onTemplateDelete}
            />
          );
        }
      })}
    </div>
  );
}