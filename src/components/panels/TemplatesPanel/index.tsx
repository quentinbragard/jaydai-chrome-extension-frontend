// src/components/panels/TemplatesPanel/index.tsx
import React, { useCallback, memo, useMemo, useState } from 'react';
import { FolderOpen, RefreshCw, PlusCircle, FileText, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { getMessage } from '@/core/utils/i18n';
import BasePanel from '../BasePanel';
import { usePanelNavigation } from '@/core/contexts/PanelNavigationContext';
import { trackEvent, EVENTS } from '@/utils/amplitude';

// Import hooks
import {
  usePinnedFolders,
  useUserFolders,
  useCompanyFolders,
  useMixedFolders,
  useFolderMutations,
  useTemplateMutations,
  useTemplateActions
} from '@/hooks/prompts';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';

import {
  FolderSection,
  FolderList
} from '@/components/prompts/folders';

import { TemplateItem } from '@/components/prompts/templates/TemplateItem';
import { LoadingState } from './LoadingState';
import { EmptyMessage } from './EmptyMessage';
import { Template, TemplateFolder } from '@/types/prompts/templates';

interface TemplatesPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
}

// Navigation state for folder drilling
interface FolderNavigation {
  path: { id: number; name: string }[];
  currentFolder: TemplateFolder | null;
}

// Scroll batch size
const ITEMS_PER_BATCH = 20;

/**
 * Updated TemplatesPanel with new structure:
 * 1. User folders and templates (with nested navigation)
 * 2. Company folders (pinned)
 * 3. Mixed organization + official folders (pinned)
 */
const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  showBackButton,
  onBack,
  onClose
}) => {
  // Panel navigation
  const { pushPanel } = usePanelNavigation();

  // Folder navigation state
  const [userFolderNav, setUserFolderNav] = useState<FolderNavigation>({
    path: [],
    currentFolder: null
  });
  
  // Visible item counts for scrollable sections
  const [userVisibleCount, setUserVisibleCount] = useState(ITEMS_PER_BATCH);
  const [companyVisibleCount, setCompanyVisibleCount] = useState(ITEMS_PER_BATCH);
  const [mixedVisibleCount, setMixedVisibleCount] = useState(ITEMS_PER_BATCH);

  // Data fetching
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
    data: companyFolders = [],
    isLoading: loadingCompany,
    error: companyError,
    refetch: refetchCompany
  } = useCompanyFolders();

  const {
    data: mixedFoldersData = [],
    isLoading: loadingMixed,
    error: mixedError,
    refetch: refetchMixed
  } = useMixedFolders();

  console.log("userFolders", userFolders);

  // Mutations and actions
  const { toggleFolderPin, deleteFolder } = useFolderMutations();
  const { deleteTemplate } = useTemplateMutations();
  const { useTemplate, createTemplate, editTemplate, createFolderAndTemplate } = useTemplateActions();
  const { openConfirmation } = useDialogActions();

  // Loading and error states
  const { isLoading, hasError, errorMessage } = useMemo(() => ({
    isLoading:
      loadingPinned ||
      loadingUser ||
      loadingCompany ||
      loadingMixed,
    hasError:
      !!pinnedError ||
      !!userError ||
      !!companyError ||
      !!mixedError,
    errorMessage:
      (pinnedError || userError || companyError || mixedError)?.message ||
      'Unknown error'
  }), [
    loadingPinned,
    loadingUser,
    loadingCompany,
    loadingMixed,
    pinnedError,
    userError,
    companyError,
    mixedError
  ]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    trackEvent(EVENTS.TEMPLATE_REFRESH);
    try {
      await Promise.all([
        refetchPinned(),
        refetchUser(),
        refetchCompany(),
        refetchMixed()
      ]);
    } catch (error) {
      console.error('Failed to refresh templates:', error);
    }
  }, [refetchPinned, refetchUser, refetchCompany, refetchMixed]);

  // Navigation handlers
  const handleBrowseMore = useCallback(() => {
    trackEvent(EVENTS.TEMPLATE_BROWSE_OFFICIAL);
    pushPanel({ 
      type: 'templatesBrowse',
      props: {
        folderType: 'mixed', // New mixed type for official + organization
        pinnedFolderIds: [...pinnedFolders.official.map(f => f.id), ...pinnedFolders.organization.map(f => f.id)],
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

  // User folder navigation
  const navigateToFolder = useCallback((folder: TemplateFolder) => {
    setUserFolderNav(prev => ({
      path: [...prev.path, { id: folder.id, name: folder.name }],
      currentFolder: folder
    }));
    setUserVisibleCount(ITEMS_PER_BATCH); // Reset visible count when navigating
  }, []);

  const navigateBack = useCallback(() => {
    setUserFolderNav(prev => {
      if (prev.path.length <= 1) {
        return { path: [], currentFolder: null };
      }
      const newPath = prev.path.slice(0, -1);
      // Find the new current folder from userFolders
      const newCurrentFolder = findFolderById(userFolders, newPath[newPath.length - 1]?.id);
      return {
        path: newPath,
        currentFolder: newCurrentFolder
      };
    });
    setUserVisibleCount(ITEMS_PER_BATCH);
  }, [userFolders]);

  const navigateToRoot = useCallback(() => {
    setUserFolderNav({ path: [], currentFolder: null });
    setUserVisibleCount(ITEMS_PER_BATCH);
  }, []);

  // Helper function to find folder by ID
  const findFolderById = useCallback((folders: TemplateFolder[], id: number): TemplateFolder | null => {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      if (folder.Folders) {
        const found = findFolderById(folder.Folders, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Get current items for display
  const getCurrentUserItems = useMemo(() => {
    let items: (TemplateFolder | Template)[] = [];
    
    if (!userFolderNav.currentFolder) {
      // Root level: show all user folders and root templates
      items = [
        ...userFolders,
        // Add root templates (templates not in any folder)
        ...(userFolders.flatMap(f => f.templates?.filter(t => !t.folder_id) || []))
      ];
    } else {
      // Inside a folder: show subfolders and templates
      const currentFolder = userFolderNav.currentFolder;
      items = [
        ...(currentFolder.Folders || []),
        ...(currentFolder.templates || [])
      ];
    }
    
    return items;
  }, [userFolders, userFolderNav.currentFolder]);

  // Helper to slice visible items
  const getVisibleItems = useCallback((items: any[], count: number) => {
    return {
      items: items.slice(0, count),
      hasMore: count < items.length
    };
  }, []);

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
          return true;
        } catch (error) {
          console.error('Error deleting folder:', error);
          return false;
        }
      },
    });
    return Promise.resolve(false);
  }, [openConfirmation, deleteFolder, refetchUser]);

  const handleEditTemplate = useCallback((template: Template) => {
    editTemplate(template);
  }, [editTemplate]);

  // Get mixed official + organization folders
  const mixedFolders = useMemo(
    () => mixedFoldersData,
    [mixedFoldersData]
  );

  // Error handling
  if (hasError) {
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
        className="w-80"
      >
        <LoadingState />
      </BasePanel>
    );
  }

  // Get visible data for each section
  const userItems = getVisibleItems(getCurrentUserItems, userVisibleCount);
  const companyItems = getVisibleItems(companyFolders, companyVisibleCount);
  const mixedItems = getVisibleItems(mixedFolders, mixedVisibleCount);

  return (
    <BasePanel
      title={getMessage('templates', undefined, "Templates")}
      icon={FolderOpen}
      showBackButton={showBackButton}
      onBack={onBack}
      onClose={onClose}
      className="w-80"
    >
      <div className="jd-space-y-4">
        
        {/* User Templates and Folders Section */}
        <FolderSection
          title={getMessage('myTemplates', undefined, 'My Templates')}
          iconType="user"
          onCreateTemplate={createTemplate}
          showCreateButton={true}
        >
          {/* Navigation breadcrumb */}
          {userFolderNav.path.length > 0 && (
            <div className="jd-flex jd-items-center jd-gap-2 jd-px-2 jd-py-1 jd-mb-2 jd-text-xs jd-text-muted-foreground">
              <Button variant="ghost" size="sm" onClick={navigateToRoot} className="jd-h-6 jd-px-1">
                <FolderOpen className="jd-h-3 jd-w-3" />
              </Button>
              {userFolderNav.path.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <span>/</span>
                  <span className="jd-truncate">{folder.name}</span>
                </React.Fragment>
              ))}
              <Button variant="ghost" size="sm" onClick={navigateBack} className="jd-h-6 jd-px-1 jd-ml-auto">
                <ArrowLeft className="jd-h-3 jd-w-3" />
              </Button>
            </div>
          )}

          {userItems.items.length === 0 ? (
            <div className="jd-p-4 jd-bg-accent/30 jd-border jd-border-[var(--border)] jd-rounded-lg jd-mb-4">
              <div className="jd-flex jd-flex-col jd-items-center jd-space-y-3 jd-text-center jd-py-3">
                <FileText className="jd-h-8 jd-w-8 jd-text-[var(--primary)]/40" />
                <div className="jd-space-y-1">
                  <p className="jd-text-sm jd-text-[var(--foreground)]">
                    {getMessage('noTemplates', undefined, 'No templates yet')}
                  </p>
                  <p className="jd-text-xs jd-text-[var(--muted-foreground)]">
                    {getMessage('createFirstTemplate', undefined, 'Create templates to save time')}
                  </p>
                </div>
                <Button 
                  size="sm"
                  className="jd-mt-1 jd-bg-primary jd-text-primary-foreground"
                  onClick={createTemplate}
                >
                  <Plus className="jd-h-3.5 jd-w-3.5 jd-mr-1.5" />
                  {getMessage('createFirstTemplate', undefined, 'Create your first template')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Items display */}
              <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
                {userItems.items.map((item) => (
                  'templates' in item ? (
                    // It's a folder
                    <div 
                      key={`folder-${item.id}`}
                      className="jd-group jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-cursor-pointer jd-rounded-sm"
                      onClick={() => navigateToFolder(item)}
                    >
                      <FolderOpen className="jd-h-4 jd-w-4 jd-mr-2 jd-text-muted-foreground" />
                      <span className="jd-text-sm jd-flex-1 jd-truncate">{item.name}</span>
                      <span className="jd-text-xs jd-text-muted-foreground jd-mr-2">
                        {((item.Folders?.length || 0) + (item.templates?.length || 0))} items
                      </span>
                      <div className="jd-flex jd-items-center jd-gap-2 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="jd-text-red-500 hover:jd-text-red-600 hover:jd-bg-red-100 jd-dark:hover:jd-bg-red-900/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(item.id);
                          }}
                        >
                          <FileText className="jd-h-4 jd-w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // It's a template
                    <TemplateItem
                      key={`template-${item.id}`}
                      template={item}
                      type="user"
                      onUseTemplate={(template) => useTemplate(template)}
                      onEditTemplate={handleEditTemplate}
                      onDeleteTemplate={handleDeleteTemplate}
                    />
                  )
                ))}
              </div>

              {/* Load more */}
              {userItems.hasMore && (
                <div className="jd-flex jd-justify-center jd-mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setUserVisibleCount(c => c + ITEMS_PER_BATCH)}>
                    {getMessage('loadMore', undefined, 'Load More')}
                  </Button>
                </div>
              )}
            </>
          )}
        </FolderSection>

        <Separator />

        {/* Company Templates Section */}
        <FolderSection
          title={getMessage('companyTemplates', undefined, 'Company Templates')}
          iconType="organization"
          showBrowseMore={false}
        >
          {companyItems.items.length === 0 ? (
            <EmptyMessage>
              {getMessage('noCompanyAccess', undefined, 'Contact your company admin to access company templates.')}
            </EmptyMessage>
          ) : (
            <div className="jd-max-h-96 jd-overflow-y-auto">
              <FolderList
                folders={companyItems.items as TemplateFolder[]}
                type="organization"
                onUseTemplate={useTemplate}
              />
            </div>
          )}
          {companyItems.hasMore && (
            <div className="jd-flex jd-justify-center jd-mt-2">
              <Button variant="ghost" size="sm" onClick={() => setCompanyVisibleCount(c => c + ITEMS_PER_BATCH)}>
                {getMessage('loadMore', undefined, 'Load More')}
              </Button>
            </div>
          )}
        </FolderSection>

        <Separator />

        {/* Mixed Official + Organization Section */}
        <FolderSection
          title={getMessage('pinnedTemplates', undefined, 'Pinned Templates')}
          iconType="official"
          showBrowseMore={true}
          onBrowseMore={handleBrowseMore}
        >
          {mixedItems.items.length === 0 ? (
            <div className="jd-p-4 jd-bg-accent/30 jd-border jd-border-[var(--border)] jd-rounded-lg jd-mb-4">
              <div className="jd-flex jd-flex-col jd-items-center jd-space-y-3 jd-text-center jd-py-3">
                <FolderOpen className="jd-h-8 jd-w-8 jd-text-[var(--primary)]/40" />
                <div className="jd-space-y-1">
                  <p className="jd-text-sm jd-text-[var(--foreground)]">
                    {getMessage('noPinnedTemplates', undefined, 'No pinned templates')}
                  </p>
                  <p className="jd-text-xs jd-text-[var(--muted-foreground)]">
                    {getMessage('browseToPinTemplates', undefined, 'Browse templates to pin your favorites')}
                  </p>
                </div>
                <Button 
                  size="sm"
                  variant="outline"
                  className="jd-mt-1"
                  onClick={handleBrowseMore}
                >
                  <FolderOpen className="jd-h-3.5 jd-w-3.5 jd-mr-1.5" />
                  {getMessage('browseTemplates', undefined, 'Browse Templates')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Mixed folders display */}
              <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
                {mixedItems.items.map((folder) => (
                  <div
                    key={`mixed-folder-${folder.id}`}
                    className="jd-group jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-cursor-pointer jd-rounded-sm"
                  >
                    <FolderOpen className="jd-h-4 jd-w-4 jd-mr-2 jd-text-muted-foreground" />
                    <span className="jd-text-sm jd-flex-1 jd-truncate">{folder.name}</span>
                    {folder.templates?.length > 0 && (
                      <span className="jd-text-xs jd-text-muted-foreground jd-mr-2">
                        {folder.templates.length} templates
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="jd-opacity-0 group-hover:jd-opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        const type = (folder as TemplateFolder).type === 'official' ? 'official' : 'organization';
                        toggleFolderPin.mutate({ folderId: folder.id, isPinned: true, type });
                      }}
                    >
                      📌
                    </Button>
                  </div>
                ))}
              </div>

              {/* Load more */}
              {mixedItems.hasMore && (
                <div className="jd-flex jd-justify-center jd-mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setMixedVisibleCount(c => c + ITEMS_PER_BATCH)}>
                    {getMessage('loadMore', undefined, 'Load More')}
                  </Button>
                </div>
              )}
            </>
          )}
        </FolderSection>
      </div>
    </BasePanel>
  );
};

export default memo(TemplatesPanel);