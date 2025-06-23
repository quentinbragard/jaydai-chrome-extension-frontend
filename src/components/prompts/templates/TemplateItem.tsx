// src/components/prompts/templates/TemplateItem.tsx
import React, { useCallback } from 'react';
import { FileText, Edit, Trash2, Bookmark } from 'lucide-react';
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
  onTogglePin?: (templateId: number, isPinned: boolean, type: 'user' | 'company' | 'organization') => void;
  showEditControls?: boolean;
  showDeleteControls?: boolean;
  showPinControls?: boolean;
  isProcessing?: boolean;
  className?: string;
}

/**
 * Enhanced template item component that works consistently across all contexts
 * Displays templates with consistent styling and behavior
 * Supports pinning, editing, deletion, and usage
 */
export const TemplateItem: React.FC<TemplateItemProps> = ({
  template,
  type,
  level = 0,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onTogglePin,
  showEditControls = true,
  showDeleteControls = true,
  showPinControls = false,
  isProcessing = false,
  className = ''
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

  // Handle pin toggle
  const handleTogglePin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePin && template.id) {
      onTogglePin(template.id, !!(template as any).is_pinned, type);
    }
  }, [onTogglePin, template.id, (template as any).is_pinned, type]);

  // Show controls based on type and props
  const shouldShowEditControls = showEditControls && type === 'user';
  const shouldShowDeleteControls = showDeleteControls && type === 'user';
  const shouldShowPinControls = showPinControls && onTogglePin;

  // Calculate usage information
  const usageCount = typeof template.usage_count === 'number' ? template.usage_count : 0;
  const isPopular = usageCount >= 5;
  const hasUsageInfo = usageCount > 0;

  return (
    <div 
      className={`jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-rounded-sm jd-cursor-pointer jd-group jd-transition-colors ${
        isProcessing ? 'jd-opacity-50 jd-cursor-not-allowed' : ''
      } ${className}`}
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
      
      {/* Template Content */}
      <div className="jd-flex-1 jd-min-w-0">
        {/* Template Title with optional description tooltip */}
        {template.description ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="jd-text-sm jd-truncate jd-font-medium"
                title={displayName}
              >
                {displayName}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="jd-max-w-xs jd-z-50">
              <p>{template.description}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div
            className="jd-text-sm jd-truncate jd-font-medium"
            title={displayName}
          >
            {displayName}
          </div>
        )}

        {/* Usage Information */}
        {hasUsageInfo && (
          <div className="jd-flex jd-items-center jd-gap-2 jd-mt-1">
            {isPopular && (
              <div className="jd-flex jd-items-center jd-text-xs jd-text-yellow-600">
                <Bookmark className="jd-h-3 jd-w-3 jd-mr-1 jd-fill-yellow-500" />
                Popular
              </div>
            )}
            <span className="jd-text-xs jd-text-muted-foreground">
              Used {usageCount} time{usageCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="jd-ml-auto jd-flex jd-items-center jd-gap-1">
        {/* Pin Button */}
        {shouldShowPinControls && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`jd-h-6 jd-w-6 jd-p-0 ${
                    (template as any).is_pinned 
                      ? 'jd-text-yellow-500' 
                      : 'jd-text-muted-foreground jd-opacity-0 group-hover:jd-opacity-100'
                  } jd-transition-opacity`}
                  onClick={handleTogglePin}
                  disabled={isProcessing}
                >
                  <Bookmark className={`jd-h-4 jd-w-4 ${(template as any).is_pinned ? 'jd-fill-yellow-500' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>
                  {(template as any).is_pinned 
                    ? getMessage('unpin_template', undefined, 'Unpin template')
                    : getMessage('pin_template', undefined, 'Pin template')
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Edit and Delete Controls (for user templates) */}
        {(shouldShowEditControls || shouldShowDeleteControls) && (
          <div className="jd-flex jd-items-center jd-gap-1 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity">
            {/* Edit Button */}
            {shouldShowEditControls && onEditTemplate && (
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
                      <Edit className="jd-h-4 jd-w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{getMessage('edit_template', undefined, 'Edit template')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* Delete Button */}
            {shouldShowDeleteControls && onDeleteTemplate && (
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
                      <Trash2 className="jd-h-4 jd-w-4" />
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
    </div>
  );
};