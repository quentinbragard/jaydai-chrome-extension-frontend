// src/components/folders/FolderItem.tsx
import React, { useState, memo, useCallback } from 'react';
import { TemplateFolder } from '@/types/templates';
import { FolderHeader } from './FolderHeader';
import { TemplateItem } from '@/components/templates/TemplateItem';
import { PinButton } from './PinButton';
import { DeleteButton } from '@/components/templates/DeleteButton';

interface FolderItemProps {
  folder: TemplateFolder;
  type: 'official' | 'organization' | 'user';
  onTogglePin?: (folderId: number, isPinned: boolean) => Promise<void> | void;
  onDeleteFolder?: (folderId: number) => Promise<boolean> | void;
  onUseTemplate?: (templateId: number) => void;
  showPinControls?: boolean;
  showDeleteControls?: boolean;
  level?: number;
  initialExpanded?: boolean;
}

/**
 * Component for rendering a single folder with its templates and subfolders
 */
const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  type,
  onTogglePin,
  onDeleteFolder,
  onUseTemplate,
  showPinControls = false,
  showDeleteControls = false,
  level = 0,
  initialExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  // Skip rendering if folder is invalid
  if (!folder || !folder.id || !folder.name) {
    return null;
  }
  
  // Prevent infinite recursion by limiting depth
  if (level > 5) {
    return null;
  }
  
  // Ensure folder.templates is an array
  const allTemplates = Array.isArray(folder.templates) ? folder.templates : [];
  const templates = allTemplates.filter(template => template.folder_id !== null);
  
  // Ensure folder.Folders is an array
  const subfolders = Array.isArray(folder.Folders) ? folder.Folders : [];
  
  const isPinned = !!folder.is_pinned;
  const hasTemplates = templates.length > 0;
  const hasSubfolders = subfolders.length > 0;
  
  // Toggle folder expansion - memoized to prevent unnecessary re-renders
  const toggleExpansion = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  // Handle pin toggle - memoized to prevent unnecessary re-renders
  const handleTogglePin = useCallback((e: React.MouseEvent) => {
    if (onTogglePin) {
      e.stopPropagation();
      onTogglePin(folder.id, isPinned);
    }
  }, [folder.id, isPinned, onTogglePin]);
  
  // Handle folder deletion - memoized to prevent unnecessary re-renders
  const handleDeleteFolder = useCallback(async () => {
    if (onDeleteFolder) {
      return await onDeleteFolder(folder.id);
    }
    return false;
  }, [folder.id, onDeleteFolder]);
  
  // Create action buttons based on folder type
  const actionButtons = (
    <div className="flex items-center gap-1">
      {/* Pin button for official and organization folders */}
      {showPinControls && onTogglePin && (type === 'official' || type === 'organization') && (
        <PinButton isPinned={isPinned} onClick={handleTogglePin} className="" />
      )}
      
      {/* Delete button for user folders */}
      {showDeleteControls && onDeleteFolder && type === 'user' && (
        <DeleteButton
          onDelete={handleDeleteFolder}
          itemType="folder"
          stopPropagation={true}
          className="h-6 w-6 p-0"
        />
      )}
    </div>
  );

  return (
    <div className="folder-container mb-1">
      {/* Folder header */}
      <FolderHeader
        folder={folder}
        isExpanded={isExpanded}
        onToggle={toggleExpansion}
        actionButtons={actionButtons}
      />
      
      {/* Expanded content (templates and subfolders) */}
      {isExpanded && (
        <div className="folder-content pl-6 mt-1">
          {/* Templates */}
          {hasTemplates && templates.map(template => (
            <TemplateItem
              key={`template-${template.id}`}
              template={template}
              type={type}
              onUseTemplate={onUseTemplate ? () => onUseTemplate(template.id) : undefined}
            />
          ))}
          
          {/* Subfolders - recursive */}
          {hasSubfolders && subfolders.map(subfolder => (
            <FolderItem
              key={`subfolder-${subfolder.id}-${type}`}
              folder={subfolder}
              type={type}
              onTogglePin={onTogglePin}
              onDeleteFolder={onDeleteFolder}
              onUseTemplate={onUseTemplate}
              showPinControls={showPinControls}
              showDeleteControls={showDeleteControls}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(FolderItem);

// Also export a named export for compatibility
export { FolderItem };