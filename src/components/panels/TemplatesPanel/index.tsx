// src/components/panels/TemplatesPanel/index.tsx
import React, { useState } from 'react';
import { FolderOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import BasePanel from '../BasePanel';
import { usePanelNavigation } from '@/core/contexts/PanelNavigationContext';
import { 
  usePinnedFolders, 
  useUserFolders, 
  useToggleFolderPin,
  useTemplateActions,
  useDeleteFolder
} from '@/services/TemplateService';
import { 
  FolderSection, 
  FolderList, 
} from '@/components/folders';

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

  // Error handling display
  if (error) {
    return (
      <BasePanel
        title={chrome.i18n.getMessage('templates') || "Templates"}
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

  return (
    <BasePanel
      title={chrome.i18n.getMessage('templates') || "Templates"}
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
            {chrome.i18n.getMessage('noTemplates') || "No templates available"}
          </p>
          <div className="flex flex-col items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={createTemplate}
              className="w-full"
            >
              {chrome.i18n.getMessage('createFirstTemplate') || 'Create Your First Template'}
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
            title={chrome.i18n.getMessage('officialTemplates') || 'Official Templates'}
            iconType="official"
            onBrowseMore={() => handleBrowseMore('official')}
            showBrowseMore={true}
          >
            {pinnedFolders?.official?.length ? (
              <FolderList
                folders={pinnedFolders.official}
                type="official"
                onTogglePin={(folderId, isPinned) => togglePin({ folderId, isPinned, type: 'official' })}
                onUseTemplate={useTemplate}
                showPinControls={true}
                emptyMessage="No pinned official templates. Click Browse More to add some."
              />
            ) : (
              <EmptyMessage>
                {chrome.i18n.getMessage('noPinnedOfficialTemplates') || 
                'No pinned official templates. Click Browse More to add some.'}
              </EmptyMessage>
            )}
          </FolderSection>

          <Separator />
          
          {/* Organization Templates Section */}
          <FolderSection
            title={chrome.i18n.getMessage('organizationTemplates') || 'Organization Templates'}
            iconType="organization"
            onBrowseMore={() => handleBrowseMore('organization')}
            showBrowseMore={true}
          >
            {pinnedFolders?.organization?.length ? (
              <FolderList
                folders={pinnedFolders.organization}
                type="organization"
                onTogglePin={(folderId, isPinned) => togglePin({ folderId, isPinned, type: 'organization' })}
                onUseTemplate={useTemplate}
                showPinControls={true}
                emptyMessage="No pinned organization templates. Click Browse More to add some."
              />
            ) : (
              <EmptyMessage>
                {chrome.i18n.getMessage('noPinnedOrganizationTemplates') || 
                'No pinned organization templates. Click Browse More to add some.'}
              </EmptyMessage>
            )}
          </FolderSection>

          <Separator />
          
          {/* User Templates Section */}
          <FolderSection
            title={chrome.i18n.getMessage('myTemplates') || 'My Templates'}
            iconType="user"
            onCreateTemplate={createTemplate}
            showCreateButton={true}
          >
            {userFolders?.length ? (
              <FolderList
                folders={userFolders}
                type="user"
                onDeleteFolder={deleteFolder}
                onUseTemplate={useTemplate}
                showDeleteControls={true}
                emptyMessage="No user templates. Create a template to get started."
              />
            ) : (
              <EmptyMessage>
                {chrome.i18n.getMessage('noUserTemplates') || 
                'No user templates. Create a template to get started.'}
              </EmptyMessage>
            )}
          </FolderSection>
        </div>
      )}
    </BasePanel>
  );
};

export default TemplatesPanel;