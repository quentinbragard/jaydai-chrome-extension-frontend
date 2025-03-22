import React, { useState, useEffect } from 'react';
import { cn } from "@/core/utils/classNames";
import { toast } from 'sonner';
import { useTemplates } from '@/hooks/templates';
import TemplateDialog from './TemplateDialog';
import PlaceholderEditor from './PlaceholderEditor';
import TemplatesViewManager, { TemplatesView } from './TemplatesViewManager';
import { Template } from './types';
import { promptApi } from '@/services/api/PromptApi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export interface TemplatesPanelProps {
  setIsPlaceholderEditorOpen: (isOpen: boolean) => void;
}

/**
 * Main Templates Panel component that serves as the entry point for template features
 */
const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  setIsPlaceholderEditorOpen,
}) => {
  // View state for templates/browse modes
  const [currentView, setCurrentView] = useState<TemplatesView>('templates');

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
    openEditor,
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

  // For debugging
  useEffect(() => {
    console.log('TemplatesPanel loading:', isLoading);
    console.log('templates loading', templatesLoading);
    console.log('current view:', currentView);
    console.log('folders:', {
      pinnedOfficialFolders,
      pinnedOrganizationFolders,
      userFolders
    });
  }, [isLoading, templatesLoading, pinnedOfficialFolders, pinnedOrganizationFolders, userFolders, currentView]);

  const onTemplateClick = (template: Template) => {
    handleUseTemplate(template);
  };
  
  const handleCreateTemplate = () => {
    openEditor(null);
  };

  const templatesPanelClass = cn(
    "transition-all duration-300",
    placeholderEditorOpen ? "editor-active opacity-30" : "opacity-100"
  );

  // Handle pin/unpin for folders with improved error handling
  const handleToggleFolderPin = async (folderId: number, isPinned: boolean, type: 'official' | 'organization') => {
    try {
      console.log(`Toggling ${type} folder pin: ID ${folderId}, isPinned: ${isPinned}`);
      
      const response = await promptApi.toggleFolderPin(folderId, isPinned, type);
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
    } catch (error) {
      console.error(`Error toggling ${type} folder pin:`, error);
      toast.error(`Failed to update folder pin status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
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

  return (
    <>
      {!selectedTemplate && (
        <div className={templatesPanelClass}>
          <TemplatesViewManager 
            view={currentView}
            onViewChange={setCurrentView}
            pinnedOfficialFolders={pinnedOfficialFolders || []}
            pinnedOrganizationFolders={pinnedOrganizationFolders || []}
            userFolders={userFolders || []}
            onUseTemplate={onTemplateClick}
            onEditTemplate={openEditor}
            onDeleteTemplate={handleDeleteTemplate}
            onCreateTemplate={handleCreateTemplate}
            onToggleFolderPin={handleToggleFolderPin}
            loading={isLoading}
          />
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