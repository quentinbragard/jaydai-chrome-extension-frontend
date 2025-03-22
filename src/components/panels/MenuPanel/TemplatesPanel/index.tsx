import React, { useState, useEffect } from 'react';
import { cn } from "@/core/utils/classNames";
import { toast } from 'sonner';
import { useTemplates } from '@/components/MainButton/hooks/useTemplates';
import TemplateDialog from '@/components/panels/MenuPanel/TemplatesPanel/TemplateDialog';
import PlaceholderEditor from '@/components/panels/MenuPanel/TemplatesPanel/PlaceholderEditor';
import PinnedFoldersPanel from '@/components/panels/MenuPanel/TemplatesPanel/PinnedFoldersPanel';
import BrowseFoldersPanel from '@/components/panels/MenuPanel/TemplatesPanel/BrowseFoldersPanel';
import { Template } from '@/components/panels/MenuPanel/TemplatesPanel/types';
import { promptApi } from '@/api/PromptApi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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
    error
  } = useTemplates();

  // Local loading state with a timeout to prevent infinite loading
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTimeoutId, setLoadingTimeoutId] = useState<number | null>(null);
  
  // Create a timeout to set loading to false after a reasonable time
  useEffect(() => {
    setIsLoading(templatesLoading);
    
    // Clear any existing timeout
    if (loadingTimeoutId) {
      window.clearTimeout(loadingTimeoutId);
    }
    
    // Safety timeout - if loading takes more than 8 seconds, stop showing loading
    if (templatesLoading) {
      const timeoutId = window.setTimeout(() => {
        console.warn('Loading timeout reached - forcing loading state to false');
        setIsLoading(false);
      }, 8000);
      
      setLoadingTimeoutId(timeoutId);
    }
    
    return () => {
      if (loadingTimeoutId) {
        window.clearTimeout(loadingTimeoutId);
      }
    };
  }, [templatesLoading]);

  // Log loading state for debugging
  useEffect(() => {
    console.log('TemplatesPanel loading:', isLoading);
    console.log('templates loading', templatesLoading);
    console.log('folders:', {
      pinnedOfficialFolders,
      pinnedOrganizationFolders,
      userFolders
    });
  }, [isLoading, templatesLoading, pinnedOfficialFolders, pinnedOrganizationFolders, userFolders]);

  const onTemplateClick = (template: Template) => {
    handleUseTemplate(template);
  };
  
  const handleCreateTemplate = () => {
    openEditDialog(null);
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

  // Show error state if there's an error
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          <div className="flex flex-col items-center justify-center py-4">
            <p className="mb-2">Failed to load templates: {error}</p>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => refreshFolders()}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

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
        onCreateTemplate={handleCreateTemplate}
        openBrowseOfficialFolders={() => onViewChange('browse-official')}
        openBrowseOrganizationFolders={() => onViewChange('browse-organization')}
        handleTogglePin={async (folderId, isPinned, type) => {
          if (type === 'official') {
            return handleToggleOfficialPin(folderId, isPinned);
          } else {
            return handleToggleOrganizationPin(folderId, isPinned);
          }
        }}
        loading={isLoading}
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
          userFolders={userFolders}
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