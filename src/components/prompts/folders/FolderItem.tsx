// src/components/prompts/folders/FolderItem.tsx - Hover-based action buttons
import React, { useState, useCallback } from 'react';
import { FolderOpen, ChevronRight, ChevronDown, Edit, Trash2, PlusCircle, Plus, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PinButton } from '@/components/prompts/folders/PinButton';
import { OrganizationImage } from '@/components/organizations';
import { TemplateFolder, Template } from '@/types/prompts/templates';
import { Organization } from '@/types/organizations';
import { TemplateItem } from '@/components/prompts/templates/TemplateItem';
import { EmptyMessage } from '@/components/panels/TemplatesPanel/EmptyMessage';
import { getMessage } from '@/core/utils/i18n';

const folderIconColors = {
  user: 'jd-text-blue-500',
  company: 'jd-text-red-500',
  organization: 'jd-text-gray-600'
} as const;

interface NavigationPath {
  id: number;
  title: string;
}

interface FolderItemProps {
  folder: TemplateFolder;
  type: 'user' | 'company' | 'organization';
  level?: number;
  isExpanded?: boolean;
  onToggleExpand?: (folderId: number) => void;
  onNavigateToFolder?: (folder: TemplateFolder) => void;
  onTogglePin?: (folderId: number, isPinned: boolean, type: 'user' | 'company' | 'organization') => void;
  onEditFolder?: (folder: TemplateFolder) => void;
  onDeleteFolder?: (folderId: number) => void;
  onUseTemplate?: (template: any) => void;
  onEditTemplate?: (template: any) => void;
  onDeleteTemplate?: (templateId: number) => void;
  organizations?: Organization[];
  showPinControls?: boolean;
  showEditControls?: boolean;
  showDeleteControls?: boolean;
  enableNavigation?: boolean;
  
  // Navigation props - when these are provided, the component shows navigation header
  navigationPath?: NavigationPath[];
  onNavigateBack?: () => void;
  onNavigateToRoot?: () => void;
  onNavigateToPathIndex?: (index: number) => void;
  onCreateTemplate?: () => void;
  onCreateFolder?: () => void;
  showNavigationHeader?: boolean;
}

/**
 * Enhanced folder item component that works for all folder types and contexts
 * Supports both navigation mode (drilling down) and expansion mode (tree view)
 * Can optionally show navigation header and breadcrumbs
 */
export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  type,
  level = 0,
  isExpanded = false,
  onToggleExpand,
  onNavigateToFolder,
  onTogglePin,
  onEditFolder,
  onDeleteFolder,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  organizations,
  showPinControls = false,
  showEditControls = false,
  showDeleteControls = false,
  enableNavigation = false,
  
  // Navigation props
  navigationPath = [],
  onNavigateBack,
  onNavigateToRoot,
  onNavigateToPathIndex,
  onCreateTemplate,
  onCreateFolder,
  showNavigationHeader = false
}) => {
  // Local expansion state for when no external control is provided
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = onToggleExpand ? isExpanded : localExpanded;

  // Get organization data for display
  const organization = organizations?.find(org => org.id === folder.organization_id) || folder.organization;

  // Calculate folder contents
  const subfolders = folder.Folders || [];
  const templates = folder.templates || [];
  const totalItems = subfolders.length + templates.length;
  const isAtRoot = navigationPath.length === 0;

  // Handle folder click
  const handleFolderClick = useCallback(() => {
    if (enableNavigation && onNavigateToFolder) {
      onNavigateToFolder(folder);
    } else if (onToggleExpand) {
      onToggleExpand(folder.id);
    } else {
      setLocalExpanded(!localExpanded);
    }
  }, [enableNavigation, onNavigateToFolder, onToggleExpand, folder.id, localExpanded]);

  // Handle pin toggle
  const handleTogglePin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePin) {
      onTogglePin(folder.id, !!folder.is_pinned, type);
    }
  }, [onTogglePin, folder.id, folder.is_pinned, type]);

  // Handle edit folder
  const handleEditFolder = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditFolder) {
      onEditFolder(folder);
    }
  }, [onEditFolder, folder]);

  // Handle delete folder
  const handleDeleteFolder = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteFolder) {
      onDeleteFolder(folder.id);
    }
  }, [onDeleteFolder, folder.id]);

  return (
    <div className="jd-folder-container">
      {/* Optional Navigation Header */}
      {showNavigationHeader && (
        <>
          <div className="jd-flex jd-items-center jd-justify-between jd-text-sm jd-font-medium jd-text-muted-foreground jd-mb-2 jd-px-2">
            <div className="jd-flex jd-items-center">
              <FolderOpen className="jd-mr-2 jd-h-4 jd-w-4" />
              {isAtRoot ? 'My Templates' : folder.title}
            </div>
            <div className="jd-flex jd-items-center jd-gap-1">
              {onCreateTemplate && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onCreateTemplate}
                  title={getMessage('newTemplate', undefined, 'New Template')}
                >
                  <PlusCircle className="jd-h-4 jd-w-4" />
                </Button>
              )}
              {onCreateFolder && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onCreateFolder}
                  title={getMessage('newFolder', undefined, 'New Folder')}
                >
                  <Plus className="jd-h-4 jd-w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Breadcrumb */}
          {!isAtRoot && (
            <div className="jd-flex jd-items-center jd-gap-1 jd-px-2 jd-py-2 jd-mb-2 jd-bg-accent/20 jd-rounded-md jd-text-xs">
              {onNavigateToRoot && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onNavigateToRoot} 
                  className="jd-h-6 jd-px-2 jd-text-muted-foreground hover:jd-text-foreground"
                  title="Go to root"
                >
                  <Home className="jd-h-3 jd-w-3" />
                </Button>
              )}
              
              <div className="jd-flex jd-items-center jd-gap-1 jd-flex-1 jd-min-w-0">
                {navigationPath.map((pathFolder, index) => (
                  <React.Fragment key={pathFolder.id}>
                    <ChevronRight className="jd-h-3 jd-w-3 jd-text-muted-foreground jd-flex-shrink-0" />
                    <button
                      onClick={() => onNavigateToPathIndex?.(index)}
                      className={`jd-truncate jd-text-left jd-hover:jd-text-foreground jd-transition-colors ${
                        index === navigationPath.length - 1 
                          ? 'jd-text-foreground jd-font-medium' 
                          : 'jd-text-muted-foreground jd-hover:jd-underline'
                      }`}
                      title={pathFolder.title}
                    >
                      {pathFolder.title}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {onNavigateBack && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onNavigateBack} 
                  className="jd-h-6 jd-px-2 jd-text-muted-foreground hover:jd-text-foreground jd-flex-shrink-0"
                  title="Go back"
                >
                  <ArrowLeft className="jd-h-3 jd-w-3" />
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Folder Header - IMPORTANT: Added 'group' class for hover detection */}
      <div 
        className="jd-group jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-cursor-pointer jd-rounded-sm jd-transition-colors"
        onClick={handleFolderClick}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expansion/Navigation Icon */}
        {enableNavigation ? (
          <div className="jd-w-4 jd-h-4 jd-mr-1 jd-flex-shrink-0" />
        ) : totalItems > 0 ? (
          expanded ? 
            <ChevronDown className="jd-h-4 jd-w-4 jd-mr-1 jd-flex-shrink-0" /> : 
            <ChevronRight className="jd-h-4 jd-w-4 jd-mr-1 jd-flex-shrink-0" />
        ) : (
          <div className="jd-w-4 jd-h-4 jd-mr-1 jd-flex-shrink-0" />
        )}

        {/* Organization Image (for organization folders) */}
        {(type === 'organization' && level === 0 && organization?.image_url) ? (
          <OrganizationImage
            imageUrl={organization.image_url}
            organizationName={organization.name || folder.title}
            size="sm"
            className="jd-mr-2"
          />
        ) : (
          <FolderOpen className={`jd-h-4 jd-w-4 jd-mr-2 jd-flex-shrink-0 ${folderIconColors[type]}`} />
        )}

        {/* Folder Name (with optional description tooltip) */}
        <div className="jd-flex-1 jd-min-w-0">
          {folder.description ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="jd-text-sm jd-truncate jd-block"
                  title={folder.title}
                >
                  {folder.title}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="jd-max-w-xs jd-z-50">
                <p>{folder.description}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span
              className="jd-text-sm jd-truncate jd-block"
              title={folder.title}
            >
              {folder.title}
            </span>
          )}
        </div>


        {/* Action Buttons */}
        <div className="jd-ml-auto jd-flex jd-items-center jd-gap-1">
         

          {/* HOVER-BASED: Edit and Delete Buttons (only for user folders) */}
          {type === 'user' && (showEditControls || showDeleteControls) && (
            <div className="jd-flex jd-items-center jd-gap-1 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity jd-duration-200">
              {/* Edit Button - Appears on hover */}
              {showEditControls && onEditFolder && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleEditFolder} 
                        className="jd-text-gray-600 hover:jd-text-blue-600 hover:jd-bg-blue-50 jd-dark:jd-text-gray-300 jd-dark:hover:jd-text-blue-400 jd-dark:hover:jd-bg-blue-900/30 jd-transition-all jd-duration-200"
                      >
                        <Edit className="jd-h-4 jd-w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Edit folder</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* Delete Button - Appears on hover */}
              {showDeleteControls && onDeleteFolder && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleDeleteFolder}
                        className="jd-text-gray-600 hover:jd-text-red-600 hover:jd-bg-red-50 jd-dark:jd-text-gray-300 jd-dark:hover:jd-text-red-400 jd-dark:hover:jd-bg-red-900/30 jd-transition-all jd-duration-200"
                      >
                        <Trash2 className="jd-h-4 jd-w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Delete folder</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
         {/* Pin Button - Always visible if enabled */}
         {showPinControls && onTogglePin && (
            <PinButton
              isPinned={!!folder.is_pinned}
              onClick={handleTogglePin}
              className=""
            />
          )}
      </div>

      {/* Folder Contents (when expanded and not in navigation mode) OR Current Items (when in navigation mode) */}
      {!enableNavigation && expanded && totalItems > 0 && (
        <div className="jd-folder-content">
          {/* Subfolders */}
          {subfolders.map((subfolder) => (
            <FolderItem
              key={`subfolder-${subfolder.id}`}
              folder={subfolder}
              type={type}
              level={level + 1}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              onTogglePin={onTogglePin}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onUseTemplate={onUseTemplate}
              onEditTemplate={onEditTemplate}
              onDeleteTemplate={onDeleteTemplate}
              organizations={organizations}
              showPinControls={showPinControls}
              showEditControls={showEditControls}
              showDeleteControls={showDeleteControls}
              enableNavigation={enableNavigation}
            />
          ))}

          {/* Templates */}
          {templates.map((template) => (
            <TemplateItem
              key={`template-${template.id}`}
              template={template}
              type={type}
              level={level + 1}
              onUseTemplate={onUseTemplate}
              onEditTemplate={onEditTemplate}
              onDeleteTemplate={onDeleteTemplate}
              showEditControls={type === 'user'}
              showDeleteControls={type === 'user'}
            />
          ))}
        </div>
      )}

      {/* When showing navigation header and in current folder, show contents */}
      {showNavigationHeader && (
        <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
          {totalItems === 0 ? (
            <EmptyMessage>
              {isAtRoot 
                ? getMessage('noTemplates', undefined, 'No templates yet. Create your first template!')
                : 'This folder is empty'
              }
            </EmptyMessage>
          ) : (
            <>
              {/* Subfolders */}
              {subfolders.map((subfolder) => (
                <FolderItem
                  key={`nav-folder-${subfolder.id}`}
                  folder={subfolder}
                  type={type}
                  enableNavigation={true}
                  onNavigateToFolder={onNavigateToFolder}
                  onTogglePin={onTogglePin}
                  onEditFolder={onEditFolder}
                  onDeleteFolder={onDeleteFolder}
                  organizations={organizations}
                  showPinControls={showPinControls}
                  showEditControls={showEditControls}
                  showDeleteControls={showDeleteControls}
                />
              ))}

              {/* Templates */}
              {templates.map((template) => (
                <TemplateItem
                  key={`nav-template-${template.id}`}
                  template={template}
                  type={type}
                  onUseTemplate={onUseTemplate}
                  onEditTemplate={onEditTemplate}
                  onDeleteTemplate={onDeleteTemplate}
                  showEditControls={type === 'user'}
                  showDeleteControls={type === 'user'}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};