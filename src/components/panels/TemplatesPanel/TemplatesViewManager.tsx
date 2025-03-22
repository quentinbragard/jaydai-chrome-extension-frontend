import React, { useState } from 'react';
import { Template, TemplateFolder } from './types';
import PinnedFoldersPanel from './PinnedFoldersPanel';
import BrowseFoldersPanel from './BrowseFoldersPanel';

export type TemplatesView = 'templates' | 'browse-official' | 'browse-organization';

interface TemplatesViewManagerProps {
  view: TemplatesView;
  onViewChange: (view: TemplatesView) => void;
  pinnedOfficialFolders: TemplateFolder[];
  pinnedOrganizationFolders: TemplateFolder[];
  userFolders: TemplateFolder[];
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
  onCreateTemplate: () => void;
  onToggleFolderPin: (folderId: number, isPinned: boolean, type: 'official' | 'organization') => Promise<void>;
  loading: boolean;
}

/**
 * This component manages different views for the Templates panel,
 * handling view switching between main templates list and browsing views.
 */
const TemplatesViewManager: React.FC<TemplatesViewManagerProps> = ({
  view,
  onViewChange,
  pinnedOfficialFolders,
  pinnedOrganizationFolders,
  userFolders,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCreateTemplate,
  onToggleFolderPin,
  loading
}) => {
  // Handler for when the user clicks "Browse More" for official folders
  const handleBrowseOfficialFolders = () => {
    onViewChange('browse-official');
  };

  // Handler for when the user clicks "Browse More" for organization folders
  const handleBrowseOrganizationFolders = () => {
    onViewChange('browse-organization');
  };

  // Go back to main templates view
  const handleBackToTemplates = () => {
    onViewChange('templates');
  };

  // Handle folder pin toggling
  const handleToggleFolderPin = async (folderId: number, isPinned: boolean, type: 'official' | 'organization') => {
    await onToggleFolderPin(folderId, isPinned, type);
  };

  switch (view) {
    case 'browse-official':
      return (
        <BrowseFoldersPanel
          folderType="official"
          pinnedFolderIds={pinnedOfficialFolders?.map(folder => folder.id) || []}
          onPinChange={(folderId, isPinned) => handleToggleFolderPin(folderId, isPinned, 'official')}
          onBackToTemplates={handleBackToTemplates}
          maxHeight="400px"
        />
      );
    case 'browse-organization':
      return (
        <BrowseFoldersPanel
          folderType="organization"
          pinnedFolderIds={pinnedOrganizationFolders?.map(folder => folder.id) || []}
          onPinChange={(folderId, isPinned) => handleToggleFolderPin(folderId, isPinned, 'organization')}
          onBackToTemplates={handleBackToTemplates}
          maxHeight="400px"
        />
      );
    case 'templates':
    default:
      return (
        <PinnedFoldersPanel
          pinnedOfficialFolders={pinnedOfficialFolders || []}
          pinnedOrganizationFolders={pinnedOrganizationFolders || []}
          userFolders={userFolders || []}
          onUseTemplate={onUseTemplate}
          onEditTemplate={onEditTemplate}
          onDeleteTemplate={onDeleteTemplate}
          onCreateTemplate={onCreateTemplate}
          openBrowseOfficialFolders={handleBrowseOfficialFolders}
          openBrowseOrganizationFolders={handleBrowseOrganizationFolders}
          handleTogglePin={async (folderId, isPinned, type) => {
            return handleToggleFolderPin(folderId, isPinned, type);
          }}
          loading={loading}
        />
      );
  }
};

export default TemplatesViewManager;