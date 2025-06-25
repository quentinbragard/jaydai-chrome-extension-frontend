// src/components/prompts/folders/FolderItem.tsx - Enhanced to pass organization context to templates
import React, { useState, useCallback, useMemo } from 'react';
import { FolderOpen, ChevronRight, ChevronDown, Edit, Trash2, PlusCircle, Plus, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PinButton } from '@/components/prompts/common/PinButton';
import { OrganizationImage } from '@/components/organizations';
import { TemplateFolder, Template } from '@/types/prompts/templates';
import { Organization } from '@/types/organizations';
import { TemplateItem } from '@/components/prompts/templates/TemplateItem';
import { EmptyMessage } from '@/components/panels/TemplatesPanel/EmptyMessage';
import { getMessage } from '@/core/utils/i18n';

const folderIconColors = {
  user: 'jd-text-gray-600',
  company: 'jd-text-red-500',
  organization: 'jd-text-orange-500'
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
  
  // Navigation props
  navigationPath?: NavigationPath[];
  onNavigateBack?: () => void;
  onNavigateToRoot?: () => void;
  onNavigateToPathIndex?: (index: number) => void;
  onCreateTemplate?: () => void;
  onCreateFolder?: () => void;
  showNavigationHeader?: boolean;
  
  // Pinned folder IDs for proper pin state calculation
  pinnedFolderIds?: number[];
}

/**
 * Enhanced folder item component with organization context for templates
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
  showNavigationHeader = false,
  
  // Pinned folder IDs
  pinnedFolderIds = []
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

  // Calculate pinned state based on pinnedFolderIds
  const isPinned = useMemo(() => {
    return pinnedFolderIds.includes(folder.id);
  }, [pinnedFolderIds, folder.id]);

  // Determine if this folder shows organization image
  const folderShowsOrgImage = useMemo(() => {
    return type === 'organization' && level === 0 && organization?.image_url;
  }, [type, level, organization?.image_url]);

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

  // Handle pin toggle with proper state
  const handleTogglePin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePin) {
      onTogglePin(folder.id, isPinned, type);
    }
  }, [onTogglePin, folder.id, isPinned, type]);

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
          <div className="jd-flex jd-items-center jd-justify-between jd-text-sm jd-font-medium jd-text-muted-foreground jd-mb-2">
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
                      className={`jd-truncate jd-font-medium jd-text-left jd-hover:jd-text-foreground jd-transition-colors ${
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

      {/* Folder Header */}
      <div 
        className="jd-group jd-flex jd-items-center hover:jd-bg-accent/60 jd-cursor-pointer jd-rounded-sm jd-transition-colors"
        onClick={handleFolderClick}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expansion/Navigation Icon */}
        {enableNavigation ? (
          <div className="jd-h-4 jd-flex-shrink-0" />
        ) : totalItems > 0 ? (
          expanded ? 
            <ChevronDown className="jd-h-4 jd-w-4 jd-mr-1 jd-flex-shrink-0" /> : 
            <ChevronRight className="jd-h-4 jd-w-4 jd-mr-1 jd-flex-shrink-0" />
        ) : (
          <div/>
        )}

        {/* Organization Image (for organization folders) */}
        {folderShowsOrgImage ? (
          <OrganizationImage
            imageUrl={organization.image_url}
            organizationName={organization.name || folder.title}
            size="sm"
            className="jd-mr-2"
          />
        ) : (
          <FolderOpen className={`jd-h-4 jd-w-4 jd-mr-2 jd-flex-shrink-0 ${folderIconColors[type]}`} />
        )}

        {/* Folder Name */}
        <div className="jd-flex-1 jd-min-w-0">
          {folder.description ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="jd-text-sm jd-truncate jd-block">
                    {folder.title}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="jd-max-w-xs jd-z-50">
                  <p>{folder.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="jd-text-sm jd-truncate jd-block jd-font-medium">{folder.title}</span>
          )}
        </div>

        {/* Action Buttons */}
        {(type === 'user' && (showEditControls || showDeleteControls)) && (
          <div className="jd-flex jd-items-center jd-gap-1 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity jd-duration-200">
            {/* Edit Button */}
            {showEditControls && onEditFolder && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleEditFolder} 
                    >
                      <Edit className="jd-h-4 jd-w-4 jd-text-blue-600 hover:jd-text-blue-700 hover:jd-bg-blue-100 jd-dark:jd-text-blue-400 jd-dark:hover:jd-text-blue-300 jd-dark:hover:jd-bg-blue-900/30" />
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Edit folder</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* Delete Button */}
            {showDeleteControls && onDeleteFolder && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleDeleteFolder}
                    >
                      <Trash2 className="jd-h-4 jd-w-4 jd-text-red-500 hover:jd-text-red-600 hover:jd-bg-red-100 jd-dark:hover:jd-bg-red-900/30" />
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
        
        <div className="jd-ml-auto jd-flex jd-items-center jd-gap-1">
          {/* Pin Button */}
          {showPinControls && onTogglePin && (
            <div className={`jd-ml-auto  jd-items-center jd-gap-1 ${isPinned ? 'jd-flex' : 'jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity'}`}>
              <PinButton
                isPinned={isPinned}
                onClick={handleTogglePin}
                className=""
              />
            </div>
          )}
        </div>
      </div>

      {/* Folder Contents */}
      {!enableNavigation && expanded && totalItems > 0 && (
        <div className="jd-folder-content jd-space-y-1">
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
              pinnedFolderIds={pinnedFolderIds}
            />
          ))}

          {/* Templates with organization context */}
          {templates.map((template) => (
            <TemplateItem
              key={`template-${template.id}`}
              template={template}
              type={type}
              level={level + 1}
              onUseTemplate={onUseTemplate}
              onEditTemplate={onEditTemplate}
              onDeleteTemplate={onDeleteTemplate}
              onTogglePin={onTogglePin}
              showEditControls={type === 'user'}
              showDeleteControls={type === 'user'}
              showPinControls={showPinControls}
              organizations={organizations}
              parentFolderHasOrgImage={folderShowsOrgImage} // Pass context!
              isInGlobalSearch={false}
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
                  pinnedFolderIds={pinnedFolderIds}
                />
              ))}

              {/* Templates with organization context */}
              {templates.map((template) => (
                <TemplateItem
                  key={`nav-template-${template.id}`}
                  template={template}
                  type={type}
                  onUseTemplate={onUseTemplate}
                  onEditTemplate={onEditTemplate}
                  onDeleteTemplate={onDeleteTemplate}
                  onTogglePin={onTogglePin}
                  showEditControls={type === 'user'}
                  showDeleteControls={type === 'user'}
                  showPinControls={showPinControls}
                  organizations={organizations}
                  parentFolderHasOrgImage={folderShowsOrgImage} // Pass context!
                  isInGlobalSearch={false}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};