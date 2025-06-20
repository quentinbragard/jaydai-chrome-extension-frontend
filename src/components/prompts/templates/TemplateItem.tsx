// src/components/prompts/unified/TemplateItem.tsx
import React, { useCallback } from 'react';
import { FileText, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { OrganizationImage } from '@/components/organizations';
import { Template } from '@/types/prompts/templates';
import { getMessage } from '@/core/utils/i18n';

const iconColorMap = {
  user: 'jd-text-blue-500',
  company: 'jd-text-red-500',
  organization: 'jd-text-gray-600'
} as const;

interface TemplateItemProps {
  template: Template;
  type: 'user' | 'company' | 'organization';
  level?: number;
  onUseTemplate?: (template: Template) => void;
  onEditTemplate?: (template: Template) => void;
  onDeleteTemplate?: (templateId: number) => void;
  showEditControls?: boolean;
  showDeleteControls?: boolean;
  isProcessing?: boolean;
}

/**
 * Unified template item component that works consistently across all contexts
 * Displays templates with consistent styling and behavior
 */
export const TemplateItem: React.FC<TemplateItemProps> = ({
  template,
  type,
  level = 0,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  showEditControls = true,
  showDeleteControls = true,
  isProcessing = false
}) => {
  // Ensure we have a display name
  const displayName = template.title || 'Untitled Template';
  
  // Handle template click to use it
  const handleTemplateClick = useCallback(() => {
    if (onUseTemplate && !isProcessing) {
      onUseTemplate(template);
    }
  }, [onUseTemplate, template, isProcessing]);
  
  // Handle edit click
  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditTemplate) {
      onEditTemplate(template);
    }
  }, [onEditTemplate, template]);
  
  // Handle delete click
  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteTemplate && template.id) {
      onDeleteTemplate(template.id);
    }
  }, [onDeleteTemplate, template.id]);

  // Show controls only for user templates or when explicitly enabled
  const shouldShowControls = type === 'user' && (showEditControls || showDeleteControls);

  return (
    <div 
      className={`jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-rounded-sm jd-cursor-pointer jd-group jd-transition-colors ${
        isProcessing ? 'jd-opacity-50 jd-cursor-not-allowed' : ''
      }`}
      onClick={handleTemplateClick}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
    >
      {/* Template Icon */}
      <FileText className={`jd-h-4 jd-w-4 jd-mr-2 jd-flex-shrink-0 ${iconColorMap[type]}`} />
      
      {/* Organization Image (for organization templates) */}
      {type === 'organization' && (
        <OrganizationImage
          imageUrl={(template as any).image_url || (template as any).organization?.image_url}
          organizationName={(template as any).organization?.name || template.title}
          size="sm"
          className="jd-mr-2"
        />
      )}
      
      {/* Template Content (with optional description tooltip) */}
      <div className="jd-flex-1 jd-min-w-0">
        {template.description ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="jd-text-sm jd-truncate jd-font-medium">
                {displayName}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="jd-max-w-xs jd-z-50">
              <p>{template.description}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="jd-text-sm jd-truncate jd-font-medium">
            {displayName}
          </div>
        )}
      </div>
      
      {/* Action Buttons (only for user templates by default) */}
      {shouldShowControls && (
        <div className="jd-ml-2 jd-flex jd-items-center jd-gap-1 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity">
          {/* Edit Button */}
          {showEditControls && onEditTemplate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="jd-h-6 jd-w-6 jd-p-0 jd-text-blue-600 hover:jd-text-blue-700 hover:jd-bg-blue-100 jd-dark:jd-text-blue-400 jd-dark:hover:jd-text-blue-300 jd-dark:hover:jd-bg-blue-900/30"
                    onClick={handleEditClick}
                    disabled={isProcessing}
                  >
                    <Edit className="jd-h-3.5 jd-w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{getMessage('edit_template', undefined, 'Edit template')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Delete Button */}
          {showDeleteControls && onDeleteTemplate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="jd-h-6 jd-w-6 jd-p-0 jd-text-red-500 hover:jd-text-red-600 hover:jd-bg-red-100 jd-dark:hover:jd-bg-red-900/30"
                    onClick={handleDeleteClick}
                    disabled={isProcessing}
                  >
                    <Trash2 className="jd-h-3.5 jd-w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{getMessage('delete_template', undefined, 'Delete template')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );
};