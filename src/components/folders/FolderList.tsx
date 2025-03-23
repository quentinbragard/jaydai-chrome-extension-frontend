// src/components/folders/FolderList.tsx
import React from 'react';
import { TemplateFolder } from '@/types/templates';
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
}

/**
 * Component for rendering a list of folders
 */
export function FolderList({
  folders,
  type,
  onTogglePin,
  onDeleteFolder,
  onUseTemplate,
  showPinControls = false,
  showDeleteControls = false,
  emptyMessage
}: FolderListProps) {
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
      {folderArray.map(folder => (
        <FolderItem
          key={`folder-${folder.id}-${type}`}
          folder={folder}
          type={type}
          onTogglePin={onTogglePin}
          onDeleteFolder={onDeleteFolder}
          onUseTemplate={onUseTemplate}
          showPinControls={showPinControls}
          showDeleteControls={showDeleteControls}
        />
      ))}
    </div>
  );
}