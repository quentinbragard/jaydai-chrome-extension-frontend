import React from 'react';
import { cn } from "@/core/utils/classNames";
import { toast } from 'sonner';
import { useTemplates } from './useTemplates';
import TemplateDialog from './TemplateDialog';
import PlaceholderEditor from './PlaceholderEditor';
import PinnedFoldersPanel from './PinnedFoldersPanel';
import BrowseFoldersPanel from './BrowseFoldersPanel';
import { Template } from './types';
import { promptApi } from '@/api/PromptApi';

export interface TemplatesPanelProps {
  view: 'templates' | 'browse-official' | 'browse-organization';
  onViewChange: (newView: 'templates' | 'browse-official' | 'browse-organization') => void;
  setIsPlaceholderEditorOpen: (isOpen: boolean) => void;
}

const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  view,
  onViewChange,
  setIsPlaceholderEditorOpen,
}) => {
  const {
    loading: templatesLoading,
    editDialogOpen,
    setEditDialogOpen,
    templateFormData,
    setTemplateFormData,
    placeholderEditorOpen,
    setPlaceholderEditorOpen,
    selectedTemplate,
    handleUseTemplate,
    handleFinalizeTemplate,
    openEditDialog,
    handleSaveTemplate,
    handleDeleteTemplate,
    pinnedOfficialFolders,
    pinnedOrganizationFolders,
    userFolders,
    refreshFolders,
  } = useTemplates();

  // Determine overall loading state
  const loading = templatesLoading;

  const onTemplateClick = (template: Template) => {
    handleUseTemplate(template);
  };

  const templatesPanelClass = cn(
    "transition-all duration-300",
    placeholderEditorOpen ? "editor-active opacity-30" : "opacity-100"
  );

  // Handle pin/unpin for official folders with improved error handling
  const handleToggleOfficialPin = async (folderId: number, isPinned: boolean) => {
    try {
      console.log(`Toggling official folder pin: ID ${folderId}, isPinned: ${isPinned}`);
      
      const response = await promptApi.toggleFolderPin(folderId, isPinned, 'official');
      console.log('Toggle pin response:', response);
      
      if (!response) {
        throw new Error('No response received from toggleFolderPin');
      }
      
      if (response.success) {
        toast.success(isPinned ? 'Folder unpinned' : 'Folder pinned');
        // Refresh folders after pin/unpin
        refreshFolders();
      } else {
        toast.error(`Failed to ${isPinned ? 'unpin' : 'pin'} folder: ${response.error || 'Unknown error'}`);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error toggling official folder pin:', error);
      toast.error(`Failed to update folder pin status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return Promise.reject(error);
    }
  };

  // Handle pin/unpin for organization folders with improved error handling
  const handleToggleOrganizationPin = async (folderId: number, isPinned: boolean) => {
    try {
      console.log(`Toggling organization folder pin: ID ${folderId}, isPinned: ${isPinned}`);
      
      // Use the correct 'organization' type
      const response = await promptApi.toggleFolderPin(folderId, isPinned, 'organization');
      console.log('Toggle organization pin response:', response);
      
      if (!response) {
        throw new Error('No response received from toggleFolderPin');
      }
      
      if (response.success) {
        toast.success(isPinned ? 'Folder unpinned' : 'Folder pinned');
        // Refresh folders after pin/unpin
        refreshFolders();
      } else {
        toast.error(`Failed to ${isPinned ? 'unpin' : 'pin'} folder: ${response.error || 'Unknown error'}`);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error toggling organization folder pin:', error);
      toast.error(`Failed to update folder pin status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return Promise.reject(error);
    }
  };

  const renderContent = () => {
    if (view === 'browse-official') {
      return (
        <BrowseFoldersPanel
          folderType="official"
          pinnedFolderIds={pinnedOfficialFolders?.map(folder => folder.id) || []}
          onPinChange={handleToggleOfficialPin}
        />
      );
    } else if (view === 'browse-organization') {
      return (
        <BrowseFoldersPanel
          folderType="organization"
          pinnedFolderIds={pinnedOrganizationFolders?.map(folder => folder.id) || []}
          onPinChange={handleToggleOrganizationPin}
        />
      );
    }
    // Default view: display pinned folders
    return (
      <PinnedFoldersPanel
        pinnedOfficialFolders={pinnedOfficialFolders || []}
        pinnedOrganizationFolders={pinnedOrganizationFolders || []}
        userFolders={userFolders || []}
        onUseTemplate={onTemplateClick}
        onEditTemplate={openEditDialog}
        onDeleteTemplate={handleDeleteTemplate}
        onCreateTemplate={() => openEditDialog(null)}
        openBrowseOfficialFolders={() => onViewChange('browse-official')}
        openBrowseOrganizationFolders={() => onViewChange('browse-organization')}
        handleTogglePin={async (folderId, isPinned, type) => {
          if (type === 'official') {
            return handleToggleOfficialPin(folderId, isPinned);
          } else {
            return handleToggleOrganizationPin(folderId, isPinned);
          }
        }}
        loading={loading}
      />
    );
  };

  return (
    <>
      {!selectedTemplate && (
        <div className={templatesPanelClass}>
          {renderContent()}
        </div>
      )}

      {editDialogOpen && (
        <TemplateDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          currentTemplate={selectedTemplate}
          formData={templateFormData}
          onFormChange={setTemplateFormData}
          onSaveTemplate={handleSaveTemplate}
        />
      )}

      {selectedTemplate && (
        <PlaceholderEditor
          open={placeholderEditorOpen}
          onOpenChange={(open) => {
            setPlaceholderEditorOpen(open);
            setIsPlaceholderEditorOpen(open);
          }}
          templateContent={selectedTemplate.content}
          templateTitle={selectedTemplate.title}
          onComplete={(finalContent) => handleFinalizeTemplate(finalContent, () => {})}
        />
      )}
    </>
  );
};

export default TemplatesPanel;