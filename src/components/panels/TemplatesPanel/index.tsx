// src/components/panels/TemplatesPanel/index.tsx
import React, { useState, useCallback } from 'react';
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
  useToggleFolderPin,
  useTemplateActions,
  useDeleteFolder,
  useCreateFolder
} from '@/services/TemplateService';
import { 
  FolderSection, 
  FolderList, 
} from '@/components/folders';
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
 * Simplified with React Query and smaller components
 */
const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  showBackButton,
  onBack,
  onClose
}) => {
  const { pushPanel } = usePanelNavigation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
  
  // Mutations
  const { mutate: togglePin } = useToggleFolderPin();
  const { mutate: deleteFolder } = useDeleteFolder();
  const { mutate: createFolder } = useCreateFolder();
  
  // Template actions
  const { useTemplate, createTemplate } = useTemplateActions();
  
  // Combined loading and error states
  const isLoading = loadingPinned || loadingUser;
  const error = pinnedError || userError;
  
  // Determine if we have no folders
  const isEmpty = 
    (!pinnedFolders?.official?.length && !pinnedFolders?.organization?.length && !userFolders?.length);

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
      await Promise.all([refetchPinned(), refetchUser()]);
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

  // Helper function to handle useTemplate with correct type
  const handleUseTemplate = (template: Template) => {
    useTemplate(template);
  };

  return (
    <BasePanel
      title={getMessage('templates', undefined, "Templates")}
      icon={FolderOpen}
      showBackButton={showBackButton}
      onBack={onBack}
      onClose={onClose}
      className="w-80"
      maxHeight="500px"
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
                onUseTemplate={handleUseTemplate}
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
            onBrowseMore={() => {}}
            showBrowseMore={false}
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-4 shadow-sm">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  {getMessage('unlockTeamTemplates', undefined, 'Unlock Team Templates')}
                </h4>
                <p className="text-xs text-muted-foreground leading-tight max-w-[90%]">
                  {getMessage('teamTemplatesDescription', undefined, 'Share prompt templates with your team, enforce standards, and track usage across your organization.')}
                </p>
                <Button 
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none"
                  onClick={() => window.open('mailto:contact@jayd.ai?subject=Enterprise%20Plan%20Inquiry', '_blank')}
                >
                  {getMessage('upgradeEnterprise', undefined, 'Upgrade to Enterprise')}
                </Button>
              </div>
            </div>
          </FolderSection>

          <Separator />
          
          {/* User Templates Section */}
          <FolderSection
            title={getMessage('myTemplates', undefined, 'My Templates')}
            iconType="user"
            onCreateTemplate={handleCreateTemplate}
            showCreateButton={true}
          >
            {typedUserFolders?.length ? (
              <FolderList
                folders={typedUserFolders}
                type="user"
                onDeleteFolder={deleteFolder}
                onUseTemplate={handleUseTemplate}
                showDeleteControls={true}
                emptyMessage="No user templates. Create a template to get started."
              />
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