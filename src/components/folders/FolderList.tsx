// src/components/folders/FolderList.tsx
import React, { memo } from 'react';
import { TemplateFolder } from '@/types/prompts/templates';
import { FolderItem } from './FolderItem';
import { EmptyMessage } from '@/components/panels/TemplatesPanel/EmptyMessage';

interface FolderListProps {
  folders: TemplateFolder[];
  type: 'official' | 'organization' | 'user';
  onTogglePin?: (folderId: number, isPinned: boolean) => Promise<void> | void;
  onDeleteFolder?: (folderId: number) => Promise<boolean> | void;
  onUseTemplate?: (templateId: number) => void;
  showPinControls?: boolean;
  showDeleteControls?: boolean;
  emptyMessage?: string;
  searchTerm?: string;
  expandedFolders?: Set<number>;
  onToggleExpand?: (folderId: number) => void;
}

/**
 * Component for rendering a list of folders
 */
const FolderList: React.FC<FolderListProps> = ({
  folders,
  type,
  onTogglePin,
  onDeleteFolder,
  onUseTemplate,
  showPinControls = false,
  showDeleteControls = false,
  emptyMessage,
  searchTerm,
  expandedFolders,
  onToggleExpand
}) => {
  // Ensure folders is an array
  const folderArray = Array.isArray(folders) ? folders : [];
  
  // If there are no folders, show empty message
  if (folderArray.length === 0) {
    return (
      <EmptyMessage>
        {emptyMessage || `No ${type} folders available.`}
      </EmptyMessage>
    );
  }
  
  return (
    <div className="space-y-1 px-2">
      {folderArray.map(folder => {
        // Skip invalid folders 
        if (!folder || !folder.id || !folder.name) {
          return null;
        }
        
        // Determine if folder should be expanded when a search term is present
        const initialExpanded = searchTerm ? true : expandedFolders?.has(folder.id) || false;
        
        return (
          <FolderItem
            key={`folder-${folder.id}-${type}`}
            folder={folder}
            type={type}
            onTogglePin={onTogglePin}
            onDeleteFolder={onDeleteFolder}
            onUseTemplate={onUseTemplate}
            showPinControls={showPinControls}
            showDeleteControls={showDeleteControls}
            initialExpanded={initialExpanded}
          />
        );
      })}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(FolderList);

// Also export a named export for compatibility
export { FolderList };