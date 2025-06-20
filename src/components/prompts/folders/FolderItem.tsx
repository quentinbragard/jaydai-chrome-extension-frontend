// src/components/prompts/folders/FolderItem.tsx
import React, { useState, useCallback } from 'react';
import { FolderOpen, ChevronRight, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PinButton } from '@/components/prompts/folders/PinButton';
import { OrganizationImage } from '@/components/organizations';
import { TemplateFolder } from '@/types/prompts/templates';
import { Organization } from '@/types/organizations';
import { TemplateItem } from '@/components/prompts/templates/TemplateItem';

const folderIconColors = {
  user: 'jd-text-blue-500',
  company: 'jd-text-red-500',
  organization: 'jd-text-gray-600'
} as const;

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
  enableNavigation?: boolean; // New prop to control navigation vs expansion
}

/**
 * Unified folder item component that works for all folder types and contexts
 * Supports both navigation mode (drilling down) and expansion mode (tree view)
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
  enableNavigation = false
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
    <div className="jd-folder-container jd-mb-1">
      {/* Folder Header */}
      <div 
        className="jd-group jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-cursor-pointer jd-rounded-sm jd-transition-colors"
        onClick={handleFolderClick}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expansion/Navigation Icon */}
        {enableNavigation ? (
          <ChevronRight className="jd-h-4 jd-w-4 jd-mr-1 jd-flex-shrink-0 jd-text-muted-foreground" />
        ) : totalItems > 0 ? (
          expanded ? 
            <ChevronDown className="jd-h-4 jd-w-4 jd-mr-1 jd-flex-shrink-0" /> : 
            <ChevronRight className="jd-h-4 jd-w-4 jd-mr-1 jd-flex-shrink-0" />
        ) : (
          <div className="jd-w-4 jd-h-4 jd-mr-1 jd-flex-shrink-0" />
        )}

        {/* Folder Icon */}
        <FolderOpen className={`jd-h-4 jd-w-4 jd-mr-2 jd-flex-shrink-0 ${folderIconColors[type]}`} />

        {/* Organization Image (for organization folders) */}
        {type === 'organization' && level === 0 && organization?.image_url && (
          <OrganizationImage
            imageUrl={organization.image_url}
            organizationName={organization.name || folder.name}
            size="sm"
            className="jd-mr-2"
          />
        )}

        {/* Folder Name (with optional description tooltip) */}
        <div className="jd-flex-1 jd-min-w-0">
          {folder.description ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="jd-text-sm jd-truncate jd-block">{folder.name}</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="jd-max-w-xs jd-z-50">
                <p>{folder.description}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="jd-text-sm jd-truncate jd-block">{folder.name}</span>
          )}
        </div>

        {/* Item Count */}
        {totalItems > 0 && (
          <span className="jd-text-xs jd-text-muted-foreground jd-mr-2 jd-flex-shrink-0">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </span>
        )}

        {/* Action Buttons */}
        <div className="jd-flex jd-items-center jd-gap-1">
          {/* Pin Button */}
          {showPinControls && onTogglePin && (
            <PinButton
              isPinned={!!folder.is_pinned}
              onClick={handleTogglePin}
              className=""
            />
          )}

          {/* Edit and Delete Buttons (only for user folders) */}
          {type === 'user' && (showEditControls || showDeleteControls) && (
            <div className="jd-flex jd-items-center jd-gap-1 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity">
              {showEditControls && onEditFolder && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={handleEditFolder} className="jd-h-6 jd-w-6 jd-p-0">
                        <Pencil className="jd-h-3.5 jd-w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Edit folder</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {showDeleteControls && onDeleteFolder && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="jd-h-6 jd-w-6 jd-p-0 jd-text-red-500 hover:jd-text-red-600 hover:jd-bg-red-100 jd-dark:hover:jd-bg-red-900/30"
                        onClick={handleDeleteFolder}
                      >
                        <Trash2 className="jd-h-3.5 jd-w-3.5" />
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
      </div>

      {/* Folder Contents (when expanded and not in navigation mode) */}
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
            />
          ))}
        </div>
      )}
    </div>
  );
};