// src/components/panels/TemplatesPanel/TemplatesPanel.tsx
import React, { useCallback, memo, useMemo, useState } from 'react';
import { FolderOpen, RefreshCw, PlusCircle, Plus, ArrowLeft, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getMessage } from '@/core/utils/i18n';
import BasePanel from '../BasePanel';
import { usePanelNavigation } from '@/core/contexts/PanelNavigationContext';
import { trackEvent, EVENTS } from '@/utils/amplitude';

// Import unified components
import { FolderItem } from '@/components/prompts/folders/FolderItem';
import { TemplateItem } from '@/components/prompts/templates/TemplateItem';
import { useFolderNavigation } from '@/hooks/prompts/navigation/useFolderNavigation';

// Import hooks
import {
  usePinnedFolders,
  useUserFolders,
  useOrganizationFolders,
  useFolderMutations,
  useTemplateMutations,
  useTemplateActions
} from '@/hooks/prompts';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';
import { useOrganizations } from '@/hooks/organizations';

import { FolderSearch } from '@/components/prompts/folders';
import { LoadingState } from './LoadingState';
import { EmptyMessage } from './EmptyMessage';
import { TemplateFolder, Template } from '@/types/prompts/templates';

interface TemplatesPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
}

/**
 * Unified Templates Panel with simplified structure:
 * 1. Combined User + Organization section with navigation
 * 2. Pinned Organization section (tree view)
 * 3. Consistent component usage throughout
 */
const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  showBackButton,
  onBack,
  onClose
}) => {
  // Panel navigation
  const { pushPanel } = usePanelNavigation();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Data fetching
  const {
    data: pinnedFolders = { organization: [] },
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
    data: organizationFolders = [],
    isLoading: loadingOrganization,
    error: organizationError,
    refetch: refetchOrganization
  } = useOrganizationFolders();

  const { data: organizations = [] } = useOrganizations();

  // Navigation hook for combined user + organization folders
  const navigation = useFolderNavigation({
    userFolders,
    organizationFolders
  });

  // Mutations and actions
  const { toggleFolderPin, deleteFolder, createFolder } = useFolderMutations();
  const { deleteTemplate } = useTemplateMutations();
  const { useTemplate, createTemplate, editTemplate } = useTemplateActions();
  const { openConfirmation, openFolderManager, openCreateFolder } = useDialogActions();

  // Loading and error states
  const { isLoading, hasError, errorMessage } = useMemo(() => ({
    isLoading: loadingPinned || loadingUser || loadingOrganization,
    hasError: !!pinnedError || !!userError || !!organizationError,
    errorMessage: (pinnedError || userError || organizationError)?.message || 'Unknown error'
  }), [
    loadingPinned, loadingUser, loadingOrganization,
    pinnedError, userError, organizationError
  ]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    trackEvent(EVENTS.TEMPLATE_REFRESH);
    try {
      await Promise.all([
        refetchPinned(),
        refetchUser(),
        refetchOrganization()
      ]);
    } catch (error) {
      console.error('Failed to refresh templates:', error);
    }
  }, [refetchPinned, refetchUser, refetchOrganization]);

  // Template and folder handlers
  const handleDeleteTemplate = useCallback((templateId: number) => {
    openConfirmation({
      title: getMessage('deleteTemplate', undefined, 'Delete Template'),
      description: getMessage('deleteTemplateConfirmation', undefined, 'Are you sure you want to delete this template? This action cannot be undone.'),
      onConfirm: async () => {
        try {
          await deleteTemplate.mutateAsync(templateId);
          await refetchUser();
          return true;
        } catch (error) {
          console.error('Error deleting template:', error);
          return false;
        }
      },
    });
  }, [openConfirmation, deleteTemplate, refetchUser]);

  const handleDeleteFolder = useCallback((folderId: number) => {
    openConfirmation({
      title: getMessage('deleteFolder', undefined, 'Delete Folder'),
      description: getMessage('deleteFolderConfirmation', undefined, 'Are you sure you want to delete this folder and all its templates? This action cannot be undone.'),
      onConfirm: async () => {
        try {
          await deleteFolder.mutateAsync(folderId);
          await refetchUser();
          navigation.navigateToRoot(); // Reset navigation after deletion
          return true;
        } catch (error) {
          console.error('Error deleting folder:', error);
          return false;
        }
      },
    });
  }, [openConfirmation, deleteFolder, refetchUser, navigation]);

  const handleEditFolder = useCallback((folder: TemplateFolder) => {
    openFolderManager({ folder, userFolders });
  }, [openFolderManager, userFolders]);

  const handleCreateFolder = useCallback(() => {
    openCreateFolder({
      onSaveFolder: async (folderData: { title: string; description?: string; parent_folder_id?: number | null }) => {
        try {
          const result = await createFolder.mutateAsync(folderData);
          return { success: true, folder: result };
        } catch (error) {
          console.error('Error creating folder:', error);
          return { success: false, error: 'Failed to create folder' };
        }
      },
      onFolderCreated: async (folder: TemplateFolder) => {
        await refetchUser();
        trackEvent(EVENTS.TEMPLATE_FOLDER_CREATED, {
          folder_id: folder.id,
          folder_name: folder.name,
        });
      },
    });
  }, [openCreateFolder, createFolder, refetchUser]);

  // Handle toggling pin status for both user and organization folders
  const handleTogglePin = useCallback(
    async (folderId: number, isPinned: boolean, type: 'user' | 'organization') => {
      try {
        // For user folders, we pin them as 'user' type, for org folders as 'organization'
        await toggleFolderPin.mutateAsync({ 
          folderId, 
          isPinned, 
          type: type // Keep the original type
        });
        await refetchPinned();
      } catch (error) {
        console.error('Error toggling pin:', error);
      }
    },
    [toggleFolderPin, refetchPinned]
  );

  // Browse more handler
  const handleBrowseMore = useCallback(() => {
    trackEvent(EVENTS.TEMPLATE_BROWSE_OFFICIAL);
    pushPanel({ 
      type: 'templatesBrowse',
      props: {
        folderType: 'organization', 
        pinnedFolderIds: [...pinnedFolders.organization.map(f => f.id)],
        onPinChange: async (folderId, isPinned, type) => {
          try {
            await toggleFolderPin.mutateAsync({ folderId, isPinned, type });
            await refetchPinned();
          } catch (error) {
            console.error('Error in pin change:', error);
          }
        }
      }
    });
  }, [pushPanel, pinnedFolders, toggleFolderPin, refetchPinned]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results: Array<TemplateFolder | Template> = [];
    
    // Helper to search through folders recursively
    const searchFolder = (folder: TemplateFolder, type: 'user' | 'organization') => {
      // Check folder name
      if (folder.name?.toLowerCase().includes(query)) {
        results.push({ ...folder, searchType: type });
      }
      
      // Check templates in folder
      if (folder.templates) {
        folder.templates.forEach(template => {
          if (template.title?.toLowerCase().includes(query) || 
              template.description?.toLowerCase().includes(query)) {
            results.push({ ...template, searchType: type });
          }
        });
      }
      
      // Search subfolders
      if (folder.Folders) {
        folder.Folders.forEach(subfolder => searchFolder(subfolder, type));
      }
    };
    
    // Search user folders
    userFolders.forEach(folder => searchFolder(folder, 'user'));
    
    // Search organization folders
    organizationFolders.forEach(folder => searchFolder(folder, 'organization'));
    
    // Search pinned folders
    pinnedFolders.organization.forEach(folder => searchFolder(folder, 'organization'));
    
    return results;
  }, [searchQuery, userFolders, organizationFolders, pinnedFolders]);

  // Error handling
  if (hasError) {
    return (
      <BasePanel
        title={getMessage('templates', undefined, "Templates")}
        icon={FolderOpen}
        showBackButton={showBackButton}
        onBack={onBack}
        onClose={onClose}
        className="jd-w-80"
      >
        <Alert variant="destructive">
          <AlertDescription>
            <div className="jd-flex jd-flex-col jd-items-center jd-justify-center jd-py-4">
              <p className="jd-mb-2">Failed to load templates: {errorMessage}</p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="jd-mt-2">
                <RefreshCw className="jd-mr-2 jd-h-4 jd-w-4" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </BasePanel>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <BasePanel
        title={getMessage('templates', undefined, "Templates")}
        icon={FolderOpen}
        showBackButton={showBackButton}
        onBack={onBack}
        onClose={onClose}
        className="jd-w-80"
      >
        <LoadingState />
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
      className="jd-w-80"
    >
      <TooltipProvider>
        {/* Search */}
        <FolderSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholderText="Search templates..."
          onReset={() => setSearchQuery('')}
        />

        {/* Search Results */}
        {searchQuery ? (
          <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
            {searchResults.length === 0 ? (
              <EmptyMessage>
                {`No items matching "${searchQuery}"`}
              </EmptyMessage>
            ) : (
              searchResults.map(item => (
                'title' in item ? (
                  <TemplateItem
                    key={`search-template-${item.id}`}
                    template={item}
                    type={(item as any).searchType}
                    onUseTemplate={useTemplate}
                    onEditTemplate={editTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                  />
                ) : (
                  <FolderItem
                    key={`search-folder-${item.id}`}
                    folder={item}
                    type={(item as any).searchType}
                    enableNavigation={false}
                    showPinControls={false}
                  />
                )
              ))
            )}
          </div>
        ) : (
          <div className="jd-space-y-4">
            {/* Main Section: User + Organization Templates */}
            <div>
              <div className="jd-flex jd-items-center jd-justify-between jd-text-sm jd-font-medium jd-text-muted-foreground jd-mb-2 jd-px-2">
                <div className="jd-flex jd-items-center">
                  <FolderOpen className="jd-mr-2 jd-h-4 jd-w-4" />
                  {navigation.isAtRoot ? 'My Templates' : navigation.navigationState.currentFolder?.name}
                </div>
                <div className="jd-flex jd-items-center jd-gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={createTemplate}
                    title={getMessage('newTemplate', undefined, 'New Template')}
                  >
                    <PlusCircle className="jd-h-4 jd-w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCreateFolder}
                    title={getMessage('newFolder', undefined, 'New Folder')}
                  >
                    <Plus className="jd-h-4 jd-w-4" />
                  </Button>
                </div>
              </div>

              {/* Navigation Breadcrumb */}
              {!navigation.isAtRoot && (
                <div className="jd-flex jd-items-center jd-gap-1 jd-px-2 jd-py-2 jd-mb-2 jd-bg-accent/20 jd-rounded-md jd-text-xs">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={navigation.navigateToRoot} 
                    className="jd-h-6 jd-px-2 jd-text-muted-foreground hover:jd-text-foreground"
                    title="Go to root"
                  >
                    <Home className="jd-h-3 jd-w-3" />
                  </Button>
                  
                  <div className="jd-flex jd-items-center jd-gap-1 jd-flex-1 jd-min-w-0">
                    {navigation.navigationState.path.map((folder, index) => (
                      <React.Fragment key={folder.id}>
                        <ChevronRight className="jd-h-3 jd-w-3 jd-text-muted-foreground jd-flex-shrink-0" />
                        <button
                          onClick={() => navigation.navigateToPathIndex(index)}
                          className={`jd-truncate jd-text-left jd-hover:jd-text-foreground jd-transition-colors ${
                            index === navigation.navigationState.path.length - 1 
                              ? 'jd-text-foreground jd-font-medium' 
                              : 'jd-text-muted-foreground jd-hover:jd-underline'
                          }`}
                          title={folder.name}
                        >
                          {folder.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={navigation.navigateBack} 
                    className="jd-h-6 jd-px-2 jd-text-muted-foreground hover:jd-text-foreground jd-flex-shrink-0"
                    title="Go back"
                  >
                    <ArrowLeft className="jd-h-3 jd-w-3" />
                  </Button>
                </div>
              )}

              {/* Current Items */}
              <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
                {navigation.currentItems.length === 0 ? (
                  <EmptyMessage>
                    {navigation.isAtRoot 
                      ? getMessage('noTemplates', undefined, 'No templates yet. Create your first template!')
                      : 'This folder is empty'
                    }
                  </EmptyMessage>
                ) : (
                  navigation.currentItems.map((item) => (
                    'templates' in item ? (
                      // It's a folder
                      <FolderItem
                        key={`folder-${item.id}`}
                        folder={item}
                        type={navigation.getItemType(item)}
                        enableNavigation={true}
                        onNavigateToFolder={navigation.navigateToFolder}
                        onTogglePin={handleTogglePin}
                        onEditFolder={handleEditFolder}
                        onDeleteFolder={handleDeleteFolder}
                        organizations={organizations}
                        showPinControls={true} // Show pin controls for both user and organization folders
                        showEditControls={navigation.getItemType(item) === 'user'}
                        showDeleteControls={navigation.getItemType(item) === 'user'}
                      />
                    ) : (
                      // It's a template
                      <TemplateItem
                        key={`template-${item.id}`}
                        template={item}
                        type={navigation.getItemType(item)}
                        onUseTemplate={useTemplate}
                        onEditTemplate={editTemplate}
                        onDeleteTemplate={handleDeleteTemplate}
                        showEditControls={navigation.getItemType(item) === 'user'}
                        showDeleteControls={navigation.getItemType(item) === 'user'}
                      />
                    )
                  ))
                )}
              </div>
            </div>

            <Separator />

            {/* Pinned Templates Section */}
            <div>
              <div className="jd-flex jd-items-center jd-justify-between jd-text-sm jd-font-medium jd-text-muted-foreground jd-mb-2 jd-px-2">
                <div className="jd-flex jd-items-center">
                  <FolderOpen className="jd-mr-2 jd-h-4 jd-w-4" />
                  {getMessage('pinnedTemplates', undefined, 'Pinned Templates')}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBrowseMore}
                  className="jd-h-7 jd-px-2 jd-text-xs"
                >
                  <FolderOpen className="jd-h-3.5 jd-w-3.5 jd-mr-1" />
                  {getMessage('browseMore', undefined, 'Browse More')}
                </Button>
              </div>

              <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
                {/* Show both user and organization pinned folders */}
                {[...(pinnedFolders.user || []), ...(pinnedFolders.organization || [])].length === 0 ? (
                  <EmptyMessage>
                    {getMessage('noPinnedTemplates', undefined, 'No pinned templates. Pin your favorites for quick access.')}
                  </EmptyMessage>
                ) : (
                  <>
                    {/* User pinned folders */}
                    {(pinnedFolders.user || []).map(folder => (
                      <FolderItem
                        key={`pinned-user-${folder.id}`}
                        folder={folder}
                        type="user"
                        enableNavigation={false}
                        onTogglePin={handleTogglePin}
                        onUseTemplate={useTemplate}
                        onEditTemplate={editTemplate}
                        onDeleteTemplate={handleDeleteTemplate}
                        organizations={organizations}
                        showPinControls={true}
                        showEditControls={true}
                        showDeleteControls={true}
                      />
                    ))}
                    
                    {/* Organization pinned folders */}
                    {(pinnedFolders.organization || []).map(folder => (
                      <FolderItem
                        key={`pinned-org-${folder.id}`}
                        folder={folder}
                        type="organization"
                        enableNavigation={false}
                        onTogglePin={handleTogglePin}
                        onUseTemplate={useTemplate}
                        organizations={organizations}
                        showPinControls={true}
                        showEditControls={false}
                        showDeleteControls={false}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </TooltipProvider>
    </BasePanel>
  );
};

export default memo(TemplatesPanel);