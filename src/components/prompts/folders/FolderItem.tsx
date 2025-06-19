// src/components/folders/FolderItem.tsx
import React, { useState, memo, useCallback, useRef } from 'react';
import { Template, TemplateFolder } from '@/types/prompts/templates';
import { Organization } from '@/types/organizations';
import { FolderHeader } from './FolderHeader';
import { TemplateItem } from '@/components/prompts/templates/TemplateItem';
import { PinButton } from './PinButton';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Number of items to display per page
const ITEMS_PER_PAGE = 5;

interface FolderItemProps {
  folder: TemplateFolder;
  type: 'company' | 'organization' | 'user';
  onTogglePin?: (folderId: number, isPinned: boolean, folderType?: 'official' | 'organization' | 'user') => Promise<void> | void;
  onDeleteFolder?: (folderId: number) => Promise<boolean> | void;
  onEditFolder?: (folder: TemplateFolder) => void;
  onUseTemplate?: (template: Template) => void;
  onEditTemplate?: (template: Template) => void;
  onDeleteTemplate?: (templateId: number) => Promise<boolean> | void;
  showPinControls?: boolean;
  showDeleteControls?: boolean;
  level?: number;
  initialExpanded?: boolean;
  organizations?: Organization[];
}

/**
 * Component for rendering a single folder with its templates and subfolders
 */
const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  type,
  onTogglePin,
  onDeleteFolder,
  onEditFolder,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  showPinControls = false,
  showDeleteControls = false,
  level = 0,
  initialExpanded = false,
  organizations
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isPinned, setIsPinned] = useState(!!folder.is_pinned);
  const [currentPage, setCurrentPage] = useState(0);
  const isPinOperationInProgress = useRef(false);
  
  // Skip rendering if folder is invalid
  if (!folder || !folder.id || !folder.name) {
    return null;
  }
  
  // Prevent infinite recursion by limiting depth
  if (level > 5) {
    return null;
  }
  
  // FIXED: Ensure arrays exist and filter out null/undefined items
  const allTemplates = Array.isArray(folder.templates) 
    ? folder.templates.filter(template => template && typeof template === 'object' && template.id) 
    : [];
  const templates = allTemplates.filter(template => template.folder_id !== null);
  
  const subfolders = Array.isArray(folder.Folders) 
    ? folder.Folders.filter(subfolder => subfolder && typeof subfolder === 'object' && subfolder.id) 
    : [];
  
  // FIXED: Add additional safety checks when combining items
  const allItems = [
    ...templates
      .filter(template => template && template.id) // Extra safety check
      .map(template => ({ type: 'template' as const, data: template })),
    ...subfolders
      .filter(subfolder => subfolder && subfolder.id) // Extra safety check
      .map(subfolder => ({ type: 'folder' as const, data: subfolder }))
  ];
  
  // Calculate total pages and current items
  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, allItems.length);
  const currentItems = allItems.slice(startIdx, endIdx);
  
  const hasMoreItems = allItems.length > ITEMS_PER_PAGE;
  
  // Navigation handlers
  const goToPrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);
  
  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);
  
  const toggleExpansion = useCallback(() => {
    if (isExpanded) {
      setCurrentPage(0);
    }
    setIsExpanded(prev => !prev);
  }, [isExpanded]);
  
  const handleTogglePin = useCallback((e: React.MouseEvent) => {
    if (onTogglePin && !isPinOperationInProgress.current) {
      e.stopPropagation();
      isPinOperationInProgress.current = true;
      setIsPinned(prevPinned => !prevPinned);
      
      Promise.resolve(onTogglePin(folder.id, isPinned, folder.type))
        .catch(err => {
          console.error('Pin operation failed:', err);
          setIsPinned(isPinned);
        })
        .finally(() => {
          setTimeout(() => {
            isPinOperationInProgress.current = false;
          }, 1000);
        });
    }
  }, [folder.id, isPinned, onTogglePin]);
  
  const handleDeleteFolder = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteFolder) {
      onDeleteFolder(folder.id);
    }
  }, [folder.id, onDeleteFolder]);

  const handleEditFolder = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditFolder) {
      onEditFolder(folder);
    }
  }, [folder, onEditFolder]);
  
  // Create action buttons for folder header
  const actionButtons = (
    <div className="jd-flex jd-items-center jd-gap-2">
      {showPinControls && onTogglePin && (type === 'official' || type === 'organization') && (
        <PinButton 
          isPinned={isPinned} 
          onClick={handleTogglePin} 
          disabled={isPinOperationInProgress.current}
          className="" 
        />
      )}
      
      {type === 'user' && (
        <div className="jd-flex jd-items-center jd-gap-2 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity">
          {onEditFolder && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleEditFolder}>
                    <Pencil className="jd-h-4 jd-w-4" />
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
                    className="jd-text-red-500 hover:jd-text-red-600 hover:jd-bg-red-100 jd-dark:hover:jd-bg-red-900/30"
                    onClick={handleDeleteFolder}
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
  );

  return (
    <div className="jd-folder-container jd-mb-1 jd-group">
      <FolderHeader
        folder={folder}
        isExpanded={isExpanded}
        onToggle={toggleExpansion}
        actionButtons={actionButtons}
        level={level}
        organizations={organizations}
      />
      
      {isExpanded && (
        <div className="jd-folder-content jd-pl-6 jd-mt-1">
          {/* FIXED: Add null check and better error handling for map */}
          {currentItems
            .filter(item => item && item.data) // Additional safety filter
            .map((item, index) => {
              // Extra safety check
              if (!item || !item.data || !item.type) {
                console.warn('Invalid item found in currentItems:', item);
                return null;
              }

              if (item.type === 'template') {
                const template = item.data as Template;
                // Ensure template has required properties
                if (!template || !template.id) {
                  console.warn('Invalid template found:', template);
                  return null;
                }
                
                return (
                  <TemplateItem
                    key={`template-${template.id}`}
                    template={template}
                    type={type}
                    onUseTemplate={onUseTemplate ? () => onUseTemplate(template) : undefined}
                    onEditTemplate={onEditTemplate ? () => onEditTemplate(template) : undefined}
                    onDeleteTemplate={template.id && onDeleteTemplate ? 
                      () => onDeleteTemplate(template.id as number) : undefined
                    }
                  />
                );
              } else if (item.type === 'folder') {
                const subfolder = item.data as TemplateFolder;
                // Ensure subfolder has required properties
                if (!subfolder || !subfolder.id) {
                  console.warn('Invalid subfolder found:', subfolder);
                  return null;
                }
                
                return (
                  <FolderItem
                    key={`subfolder-${subfolder.id}-${type}`}
                    folder={subfolder}
                    type={type}
                    onTogglePin={onTogglePin}
                    onDeleteFolder={onDeleteFolder}
                    onUseTemplate={onUseTemplate}
                    onEditTemplate={onEditTemplate}
                    onDeleteTemplate={onDeleteTemplate}
                    showPinControls={showPinControls}
                    showDeleteControls={showDeleteControls}
                    level={level + 1}
                    organizations={organizations}
                  />
                );
              }
              
              // Should never reach here, but just in case
              console.warn('Unknown item type:', item.type);
              return null;
            })
            .filter(Boolean) // Remove any null items
          }
          
          {/* Pagination controls */}
          {hasMoreItems && (
            <div className="jd-flex jd-justify-end jd-mt-2 jd-pr-1">
              <div className="jd-flex jd-items-center jd-space-x-1 jd-bg-background/80 jd-border jd-border-border/30 jd-rounded jd-px-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={goToPrevPage}
                  disabled={currentPage === 0}
                  title="Previous items"
                >
                  <ChevronLeft className="jd-h-4 jd-w-4" />
                </Button>
                <span className="jd-text-xs jd-text-muted-foreground jd-px-1">
                  {currentPage + 1}/{totalPages}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  title="Next items"
                >
                  <ChevronRight className="jd-h-4 jd-w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(FolderItem);
export { FolderItem };