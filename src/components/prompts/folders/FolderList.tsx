// src/components/folders/FolderList.tsx
import React, { memo, useMemo } from 'react';
import { Template, TemplateFolder } from '@/types/prompts/templates';
import { Organization } from '@/types/organizations';
import { FolderItem } from './FolderItem';
import { EmptyMessage } from '@/components/panels/TemplatesPanel/EmptyMessage';

interface FolderListProps {
  folders: TemplateFolder[];
  type: 'company' | 'organization' | 'user';
  onTogglePin?: (folderId: number, isPinned: boolean, folderType?: 'company' | 'organization' | 'user') => Promise<void> | void;
  onToggleTemplatePin?: (templateId: number, isPinned: boolean, folderType?: 'company' | 'organization' | 'user') => Promise<void> | void;
  onDeleteFolder?: (folderId: number) => Promise<boolean> | void;
  onEditFolder?: (folder: TemplateFolder) => void;
  onUseTemplate?: (template: Template) => void;
  onEditTemplate?: (template: Template) => void;
  onDeleteTemplate?: (templateId: number) => Promise<boolean> | void;
  showPinControls?: boolean;
  showDeleteControls?: boolean;
  emptyMessage?: string;
  searchTerm?: string;
  expandedFolders?: Set<number>;
  onToggleExpand?: (folderId: number) => void;
  organizations?: Organization[];
}

/**
 * Component for rendering a list of folders with performance optimizations
 */
const FolderList: React.FC<FolderListProps> = ({
  folders,
  type,
  onTogglePin,
  onToggleTemplatePin,
  onDeleteFolder,
  onEditFolder,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  showPinControls = false,
  showDeleteControls = false,
  emptyMessage,
  searchTerm,
  expandedFolders,
  onToggleExpand,
  organizations
}) => {
  // Use memo to avoid unnecessary array processing
  const validFolders = useMemo(() => {
    // Safely ensure folders is an array and filter out invalid items
    const folderArray = Array.isArray(folders) ? folders : [];
    return folderArray.filter(folder => folder && folder.id && folder.title);
  }, [folders]);
  
  // If there are no folders, show empty message
  if (validFolders.length === 0) {
    return (
      <EmptyMessage>
        {emptyMessage || `No ${type} folders available.`}
      </EmptyMessage>
    );
  }
  
  return (
    <div className="jd-space-y-1 jd-px-2">
      {validFolders.map(folder => {
        // Determine if folder should be expanded when a search term is present
        const initialExpanded = searchTerm 
          ? true 
          : expandedFolders?.has(folder.id) || false;
        
        return (
          <FolderItem
            key={`folder-${folder.id}-${type}`}
            folder={folder}
            type={type}
            onTogglePin={onTogglePin ? ((id, pinned) => onTogglePin(id, pinned, folder.type)) : undefined}
            onToggleTemplatePin={onToggleTemplatePin ? ((id, pinned) => onToggleTemplatePin(id, pinned, folder.type)) : undefined}
            onDeleteFolder={onDeleteFolder}
            onEditFolder={onEditFolder}
            onUseTemplate={onUseTemplate}
            onEditTemplate={onEditTemplate}
            onDeleteTemplate={onDeleteTemplate}
            showPinControls={showPinControls}
            showDeleteControls={showDeleteControls}
            initialExpanded={initialExpanded}
            level={0}
            organizations={organizations}
          />
        );
      })}
    </div>
  );
};

// Use React.memo with a custom comparator function for more precise memoization
export default memo(FolderList, (prevProps, nextProps) => {
  // Custom comparator to determine if component should re-render
  
  // Compare search terms (different search terms should cause re-render)
  if (prevProps.searchTerm !== nextProps.searchTerm) return false;
  
  // Compare folder counts (different counts should cause re-render)
  const prevCount = Array.isArray(prevProps.folders) ? prevProps.folders.length : 0;
  const nextCount = Array.isArray(nextProps.folders) ? nextProps.folders.length : 0;
  if (prevCount !== nextCount) return false;
  
  // Compare expanded folders set
  const prevExpandedSize = prevProps.expandedFolders?.size || 0;
  const nextExpandedSize = nextProps.expandedFolders?.size || 0;
  if (prevExpandedSize !== nextExpandedSize) return false;
  
  // Default to true (don't re-render) if nothing major changed
  return true;
});

// Also export a named export for compatibility
export { FolderList };