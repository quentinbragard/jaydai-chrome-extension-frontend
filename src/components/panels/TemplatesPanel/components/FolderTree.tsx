// src/components/panels/TemplatesPanel/components/FolderTree.tsx

import React, { useState } from 'react';
import { Template, TemplateFolder } from '@/types/templates';
import FolderItem from './FolderItem';

interface FolderTreeProps {
  folders: TemplateFolder[];
  type: 'official' | 'organization' | 'user';
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
  onTogglePin?: (folderId: number, isPinned: boolean) => Promise<void>;
  onDeleteFolder?: (folderId: number) => Promise<boolean>;
  showPinControls?: boolean;
  showDeleteControls?: boolean;
  level?: number;
}

/**
 * Recursive folder tree component that can render nested folders
 */
const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  type,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onTogglePin,
  onDeleteFolder,
  showPinControls = false,
  showDeleteControls = false,
  level = 0
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  // Toggle folder expansion
  const toggleFolderExpansion = (folderId: number) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Debug output to check folder structure
  console.log(`Rendering folders for type ${type}:`, folders);

  // Ensure folders is an array and has items before mapping
  if (!folders || !Array.isArray(folders) || folders.length === 0) {
    return (
      <div className="text-center py-2 text-xs text-muted-foreground">
        No folders available for this section.
      </div>
    );
  }

  return (
    <div className="space-y-1 px-2">
      {folders.map(folder => {
        // Skip invalid folders
        if (!folder || !folder.id) {
          console.warn('Invalid folder found:', folder);
          return null;
        }

        // Debug folder templates
        console.log(`Folder ${folder.name} (${folder.id}) templates:`, folder.templates);

        return (
          <FolderItem
            key={`folder-${folder.id}-${type}`}
            folder={folder}
            isExpanded={expandedFolders.has(folder.id)}
            onToggleExpand={toggleFolderExpansion}
            onUseTemplate={onUseTemplate}
            onEditTemplate={onEditTemplate}
            onDeleteTemplate={onDeleteTemplate}
            onTogglePin={onTogglePin}
            onDeleteFolder={onDeleteFolder}
            showPinControls={showPinControls && !!onTogglePin}
            showDeleteControls={showDeleteControls && type === 'user' && !!onDeleteFolder}
            type={type}
            level={level}
          />
        );
      })}
    </div>
  );
};

export default FolderTree;