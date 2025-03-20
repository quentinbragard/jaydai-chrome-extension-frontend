import React from 'react';
import { cn } from "@/core/utils/classNames";
import { toast } from 'sonner';
import { useTemplates } from './useTemplates';
import TemplateDialog from './TemplateDialog';
import PlaceholderEditor from './PlaceholderEditor';
import PinnedFoldersPanel from './PinnedFoldersPanel';
import BrowseFoldersPanel from './BrowseFoldersPanel';
import { Template } from './types';

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

  const renderContent = () => {
    if (view === 'browse-official') {
      return (
        <BrowseFoldersPanel
          folderType="official"
          pinnedFolderIds={pinnedOfficialFolders && pinnedOfficialFolders.map(folder => folder.id)}
          onPinChange={async (folderId, isPinned) => {
            // Implement pin toggling logic here
            try {
              // Mock implementation for now
              toast.success(isPinned ? 'Folder unpinned' : 'Folder pinned');
              return Promise.resolve();
            } catch (error) {
              toast.error('Failed to update folder pin status');
              return Promise.reject(error);
            }
          }}
        />
      );
    } else if (view === 'browse-organization') {
      return (
        <BrowseFoldersPanel
          folderType="organization"
          pinnedFolderIds={pinnedOrganizationFolders && pinnedOrganizationFolders.map(folder => folder.id)}
          onPinChange={async (folderId, isPinned) => {
            // Implement pin toggling logic here
            try {
              // Mock implementation for now
              toast.success(isPinned ? 'Folder unpinned' : 'Folder pinned');
              return Promise.resolve();
            } catch (error) {
              toast.error('Failed to update folder pin status');
              return Promise.reject(error);
            }
          }}
        />
      );
    }
    // Default view: display pinned folders
    return (
      <PinnedFoldersPanel
        pinnedOfficialFolders={pinnedOfficialFolders}
        pinnedOrganizationFolders={pinnedOrganizationFolders}
        userFolders={userFolders}
        onUseTemplate={onTemplateClick}
        onEditTemplate={openEditDialog}
        onDeleteTemplate={handleDeleteTemplate}
        onCreateTemplate={() => openEditDialog(null)}
        openBrowseOfficialFolders={() => onViewChange('browse-official')}
        openBrowseOrganizationFolders={() => onViewChange('browse-organization')}
        handleTogglePin={async (folderId, isPinned, type) => {
          // Implement pin toggling logic here
          try {
            // Mock implementation for now
            toast.success(isPinned ? 'Folder unpinned' : 'Folder pinned');
            return Promise.resolve();
          } catch (error) {
            toast.error('Failed to update folder pin status');
            return Promise.reject(error);
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