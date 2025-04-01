// src/components/panels/TemplatesPanel/index.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { FolderOpen, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { getMessage } from '@/core/utils/i18n';
import BasePanel from '../BasePanel';
import { usePanelNavigation } from '@/core/contexts/PanelNavigationContext';
import { 
  usePinnedFolders, 
  useUserFolders, 
  useUnorganizedTemplates,
  useToggleFolderPin,
  useTemplateActions,
  useDeleteFolder,
  useCreateFolder,
  useDeleteTemplate
} from '@/services/TemplateService';
import { 
  FolderSection, 
  FolderList, 
} from '@/components/folders';
import { 
  TemplateItem,
} from '@/components/templates';
import { Template, TemplateFolder } from '@/types/templates';
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
  const { pushPanel } = usePanelNavigation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasTemplateChanged, setHasTemplateChanged] = useState(false);

  // Data fetching with React Query
  const { 
    data: pinnedFolders, 
    isLoading: loadingPinned,
    error: pinnedError,
    refetch: refetchPinned
  } = usePinnedFolders();
  
  const { 
    data: userFolders, 
    isLoading: loadingUser,
    error: userError,
    refetch: refetchUser
  } = useUserFolders();

  // Fetch unorganized templates directly from API
  const {
    data: unorganizedTemplates = [],
    isLoading: loadingUnorganized,
    error: unorganizedError,
    refetch: refetchUnorganized
  } = useUnorganizedTemplates();
  
  // Mutations
  const { mutate: togglePin } = useToggleFolderPin();
  const { mutate: deleteFolder } = useDeleteFolder();
  const { mutate: createFolder } = useCreateFolder();
  const { mutate: deleteTemplate } = useDeleteTemplate();
  
  // Get template actions
  const templateActionsOriginal = useTemplateActions();
  
  // Effect to refresh data when templates change
  useEffect(() => {
    if (hasTemplateChanged) {
      const refreshData = async () => {
        console.log('Refreshing data due to template changes');
        setIsRefreshing(true);
        try {
          await Promise.all([
            refetchPinned(),
            refetchUser(),
            refetchUnorganized()
          ]);
        } catch (error) {
          console.error('Error refreshing data:', error);
        } finally {
          setIsRefreshing(false);
          setHasTemplateChanged(false);
        }
      };
      
      refreshData();
    }
  }, [hasTemplateChanged, refetchPinned, refetchUser, refetchUnorganized]);

  // Wrap template actions to trigger refresh
  const wrapTemplateAction = useCallback((action: Function, ...args: any[]) => {
    const result = action(...args);
    // Set flag to refresh data after template operations
    setTimeout(() => setHasTemplateChanged(true), 300);
    return result;
  }, []);

  // Wrapped template actions
  const useTemplate = useCallback(
    (template: Template) => wrapTemplateAction(templateActionsOriginal.useTemplate, template),
    [templateActionsOriginal.useTemplate, wrapTemplateAction]
  );
  
  const createTemplate = useCallback(
    (folder?: any) => wrapTemplateAction(templateActionsOriginal.createTemplate, folder),
    [templateActionsOriginal.createTemplate, wrapTemplateAction]
  );
  
  const editTemplate = useCallback(
    (template: Template) => wrapTemplateAction(templateActionsOriginal.editTemplate, template),
    [templateActionsOriginal.editTemplate, wrapTemplateAction]
  );
  
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

  // Handle browse more templates 
  const handleBrowseMore = (type: 'official' | 'organization') => {
    const folderIds = type === 'official' 
      ? pinnedFolders?.official?.map(f => f.id) || []
      : pinnedFolders?.organization?.map(f => f.id) || [];
      
    pushPanel({ 
      type: 'templatesBrowse', 
      props: { 
        folderType: type, 
        pinnedFolderIds: folderIds
      } 
    });
  };

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchPinned(), 
        refetchUser(),
        refetchUnorganized()
      ]);
    } catch (error) {
      console.error('Failed to refresh templates:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle creating a new folder and immediately open template dialog
  const handleCreateFolderAndTemplate = useCallback(async () => {
    try {
      // Open create folder dialog
      if (window.dialogManager) {
        window.dialogManager.openDialog(DIALOG_TYPES.CREATE_FOLDER, {
          onSaveFolder: async (folderData: { name: string; path: string; description: string }) => {
            // Create the folder
            const result = await createFolder(folderData);
            
            if (result && result.success && result.folder) {
              const newFolder = result.folder;
              
              // Wait a moment to ensure the folder is created
              setTimeout(() => {
                // Open create template dialog with the new folder selected
                createTemplate(newFolder as Template);
                
                // Set flag to refresh data after folder creation
                setHasTemplateChanged(true);
              }, 100);
            }
            
            return result;
          }
        });
      }
    } catch (error) {
      console.error('Error in folder/template creation flow:', error);
    }
  }, [createFolder, createTemplate]);

  // Handle creating a template directly
  const handleCreateTemplate = useCallback(() => {
    createTemplate();
  }, [createTemplate]);

  // Handle template deletion
  const handleDeleteTemplate = useCallback((templateId: number) => {
    if (window.dialogManager) {
      window.dialogManager.openDialog(DIALOG_TYPES.DELETE_CONFIRMATION, {
        title: getMessage('deleteTemplate', undefined, 'Delete Template'),
        message: getMessage('deleteTemplateConfirmation', undefined, 'Are you sure you want to delete this template? This action cannot be undone.'),
        onConfirm: async () => {
          try {
            await deleteTemplate(templateId);
            // Set flag to refresh data after template deletion
            setHasTemplateChanged(true);
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
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Retry'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </BasePanel>
    );
  }

  // Create typed folders to satisfy TypeScript
  const typedUserFolders: TemplateFolder[] = userFolders || [];
  const typedOfficialFolders: TemplateFolder[] = pinnedFolders?.official || [];
  const typedOrgFolders: TemplateFolder[] = pinnedFolders?.organization || [];

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
              disabled={isRefreshing}
              className="mt-2"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Official Templates Section */}
          <FolderSection
            title={getMessage('officialTemplates', undefined, 'Official Templates')}
            iconType="official"
            onBrowseMore={() => handleBrowseMore('official')}
            showBrowseMore={true}
          >
            {typedOfficialFolders?.length ? (
              <FolderList
                folders={typedOfficialFolders}
                type="official"
                onTogglePin={(folderId, isPinned) => togglePin({ folderId, isPinned, type: 'official' })}
                onUseTemplate={useTemplate}
                showPinControls={true}
                emptyMessage="No pinned official templates. Click Browse More to add some."
              />
            ) : (
              <EmptyMessage>
                {getMessage('noPinnedOfficialTemplates', undefined, 'No pinned official templates. Click Browse More to add some.')}
              </EmptyMessage>
            )}
          </FolderSection>

          <Separator />
          
           {/* Organization Templates Section */}
            <FolderSection
              title={getMessage('organizationTemplates', undefined, 'Organization Templates')}
              iconType="organization"
              onBrowseMore={() => handleBrowseMore('organization')}
              showBrowseMore={false}
              isEmpty={true} // Add this to always show the CTA
            >
              {typedOrgFolders?.length ? (
                <FolderList
                  folders={typedOrgFolders}
                  type="organization"
                  onTogglePin={(folderId, isPinned) => togglePin({ folderId, isPinned, type: 'organization' })}
                  onUseTemplate={useTemplate}
                  showPinControls={true}
                  emptyMessage="No pinned organization templates. Click Browse More to add some."
                />
              ) : (
                <EmptyMessage>
                  {getMessage('noPinnedOrganizationTemplates', undefined, 'No pinned organization templates. Click Browse More to add some.')}
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
            {typedUserFolders?.length || unorganizedTemplates?.length ? (
              <>
                {/* Display user folders if any */}
                {typedUserFolders?.length > 0 && (
                  <FolderList
                    folders={typedUserFolders}
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
                      {unorganizedTemplates.map((template: Template) => (
                        <TemplateItem
                          key={`template-${template.id}`}
                          template={template}
                          type="user"
                          onEditTemplate={editTemplate}
                          onDeleteTemplate={handleDeleteTemplate}
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

export default TemplatesPanel;