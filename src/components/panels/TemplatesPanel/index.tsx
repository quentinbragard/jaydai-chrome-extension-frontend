// src/components/panels/TemplatesPanel/index.tsx
import React, { useCallback, memo } from 'react';
import { FolderOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { getMessage } from '@/core/utils/i18n';
import BasePanel from '../BasePanel';

// Updated imports directly from hooks instead of TemplateService
import { 
  usePinnedFolders, 
  useUserFolders, 
  useUnorganizedTemplates,
  useToggleFolderPin,
  useDeleteFolder,
  useDeleteTemplate,
  useTemplateActions
} from '@/hooks/prompts';

import { 
  FolderSection, 
  FolderList 
} from '@/components/folders';

import { DIALOG_TYPES } from '@/types/dialog';
import { LoadingState } from './LoadingState';
import { EmptyMessage } from './EmptyMessage';

interface TemplatesPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
}

/**
 * Panel for browsing and managing templates
 */
const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  showBackButton,
  onBack,
  onClose
}) => {
  // Fetch data with React Query hooks
  const { 
    data: pinnedFolders = { official: [], organization: [] }, 
    isLoading: loadingPinned,
    error: pinnedError,
    refetch: refetchPinned
  } = usePinnedFolders();
  
  const { 
    data: userFolders = [], 
    isLoading: loadingUser,
    error: userError,
    refetch: refetchUser
  } = useUserFolders();

  const {
    data: unorganizedTemplates = [],
    isLoading: loadingUnorganized,
    error: unorganizedError,
    refetch: refetchUnorganized
  } = useUnorganizedTemplates();
  
  // Get mutations
  const { mutate: togglePin } = useToggleFolderPin();
  const { mutate: deleteFolder } = useDeleteFolder();
  const { mutate: deleteTemplate } = useDeleteTemplate();
  
  // Get template actions
  const { useTemplate, createTemplate, editTemplate } = useTemplateActions();
  
  // Combined loading and error states
  const isLoading = loadingPinned || loadingUser || loadingUnorganized;
  const error = pinnedError || userError || unorganizedError;
  
  // Determine if we have no folders and no unorganized templates
  const isEmpty = (
    (!pinnedFolders?.official?.length && 
     !pinnedFolders?.organization?.length && 
     !userFolders?.length &&
     !unorganizedTemplates?.length)
  );

  // Handle refresh with loading state
  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([
        refetchPinned(), 
        refetchUser(),
        refetchUnorganized()
      ]);
    } catch (error) {
      console.error('Failed to refresh templates:', error);
    }
  }, [refetchPinned, refetchUser, refetchUnorganized]);

  // Handle creating a new folder and immediately open template dialog
  const handleCreateFolderAndTemplate = useCallback(() => {
    try {
      // Open create folder dialog
      if (window.dialogManager) {
        window.dialogManager.openDialog(DIALOG_TYPES.CREATE_FOLDER, {
          onSaveFolder: async (folderData: { name: string; path: string; description: string }) => {
            // Return the folder data for folder creation
            return folderData;
          },
          onFolderCreated: (newFolder: any) => {
            // Open create template dialog with the new folder selected
            setTimeout(() => {
              createTemplate(newFolder);
            }, 100);
          }
        });
      }
    } catch (error) {
      console.error('Error in folder/template creation flow:', error);
    }
  }, [createTemplate]);

  // Handle creating a template directly
  const handleCreateTemplate = useCallback(() => {
    createTemplate();
  }, [createTemplate]);

  // Handle template deletion
  const handleDeleteTemplate = useCallback((templateId: number) => {
    if (window.dialogManager) {
      window.dialogManager.openDialog(DIALOG_TYPES.CONFIRMATION, {
        title: getMessage('deleteTemplate', undefined, 'Delete Template'),
        description: getMessage('deleteTemplateConfirmation', undefined, 'Are you sure you want to delete this template? This action cannot be undone.'),
        onConfirm: async () => {
          try {
            await deleteTemplate(templateId);
            return true;
          } catch (error) {
            console.error('Error deleting template:', error);
            return false;
          }
        }
      });
    }
  }, [deleteTemplate]);

  // Error handling display
  if (error) {
    return (
      <BasePanel
        title={getMessage('templates', undefined, "Templates")}
        icon={FolderOpen}
        showBackButton={showBackButton}
        onBack={onBack}
        onClose={onClose}
      >
        <Alert variant="destructive">
          <AlertDescription>
            <div className="flex flex-col items-center justify-center py-4">
              <p className="mb-2">Failed to load templates: {error.message}</p>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </BasePanel>
    );
  }

  return (
    <BasePanel
      title={getMessage('templates', undefined, "Templates")}
      icon={FolderOpen}
      showBackButton={showBackButton}
      onBack={onBack}
      onClose={onClose}
      className="w-80"
      maxHeight="750px"
    >
      {isLoading ? (
        <LoadingState />
      ) : isEmpty ? (
        <div className="py-8 px-4 text-center">
          <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground mb-4">
            {getMessage('noTemplates', undefined, "No templates available")}
          </p>
          <div className="flex flex-col items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCreateFolderAndTemplate}
              className="w-full"
            >
              {getMessage('createFirstTemplate', undefined, 'Create Your First Template')}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Official Templates Section */}
          {pinnedFolders?.official?.length > 0 && (
            <>
              <FolderSection
                title={getMessage('officialTemplates', undefined, 'Official Templates')}
                iconType="official"
                showBrowseMore={true}
              >
                <FolderList
                  folders={pinnedFolders.official}
                  type="official"
                  onTogglePin={(folderId, isPinned) => togglePin({ folderId, isPinned, type: 'official' })}
                  onUseTemplate={useTemplate}
                  showPinControls={true}
                  emptyMessage="No pinned official templates."
                />
              </FolderSection>
              <Separator />
            </>
          )}
          
          {/* Organization Templates Section */}
          <FolderSection
            title={getMessage('organizationTemplates', undefined, 'Organization Templates')}
            iconType="organization"
            isEmpty={!pinnedFolders?.organization?.length}
          >
            {pinnedFolders?.organization?.length > 0 ? (
              <FolderList
                folders={pinnedFolders.organization}
                type="organization"
                onTogglePin={(folderId, isPinned) => togglePin({ folderId, isPinned, type: 'organization' })}
                onUseTemplate={useTemplate}
                showPinControls={true}
                emptyMessage="No pinned organization templates."
              />
            ) : (
              <EmptyMessage>
                {getMessage('noPinnedOrganizationTemplates', undefined, 'No pinned organization templates.')}
              </EmptyMessage>
            )}
          </FolderSection>
          <Separator />
          
          {/* User Templates Section */}
          <FolderSection
            title={getMessage('myTemplates', undefined, 'My Templates')}
            iconType="user"
            onCreateTemplate={handleCreateTemplate}
            showCreateButton={true}
          >
            {userFolders?.length || unorganizedTemplates?.length ? (
              <>
                {/* Display user folders if any */}
                {userFolders?.length > 0 && (
                  <FolderList
                    folders={userFolders}
                    type="user"
                    onDeleteFolder={deleteFolder}
                    onUseTemplate={useTemplate}
                    showDeleteControls={true}
                    emptyMessage="No user templates. Create a template to get started."
                  />
                )}
                
                {/* Display unorganized templates section if any */}
                {unorganizedTemplates?.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1 px-2">
                      {getMessage('unorganizedTemplates', undefined, 'Unorganized Templates')}
                    </div>
                    <div className="space-y-1">
                      {unorganizedTemplates.map((template) => (
                        <TemplateItem
                          key={`template-${template.id}`}
                          template={template}
                          type="user"
                          onEditTemplate={editTemplate}
                          onDeleteTemplate={handleDeleteTemplate}
                          onUseTemplate={useTemplate}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyMessage>
                {getMessage('noUserTemplates', undefined, 'No user templates. Create a template to get started.')}
              </EmptyMessage>
            )}
          </FolderSection>
        </div>
      )}
    </BasePanel>
  );
};

// Wrap with memo to prevent unnecessary re-renders
export default memo(TemplatesPanel);

// Also provide a named import for compatibility
import { TemplateItem } from '@/components/templates/TemplateItem';