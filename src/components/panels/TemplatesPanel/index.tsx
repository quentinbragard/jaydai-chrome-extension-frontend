// src/components/panels/TemplatesPanel/index.tsx - Updated with global search
import React, { useCallback, memo, useMemo, useState, useEffect } from 'react';
import { FolderOpen, RefreshCw, PlusCircle, Plus, ArrowLeft, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getMessage } from '@/core/utils/i18n';
import BasePanel from '../BasePanel';

// Import enhanced components
import { FolderItem } from '@/components/prompts/folders/FolderItem';
import { TemplateItem } from '@/components/prompts/templates/TemplateItem';
import { UnifiedNavigation } from '@/components/prompts/navigation/UnifiedNavigation';
import { useBreadcrumbNavigation } from '@/hooks/prompts/navigation/useBreadcrumbNavigation';

// Import hooks and utilities
import {
  useAllPinnedFolders,
  useUserFolders,
  useOrganizationFolders,
  useFolderMutations,
  useTemplateMutations,
  useTemplateActions,
  useUnorganizedTemplates,
  usePinnedTemplates
} from '@/hooks/prompts';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';
import { useOrganizations } from '@/hooks/organizations';

import { FolderSearch } from '@/components/prompts/folders';
import { LoadingState } from './LoadingState';
import { EmptyMessage } from './EmptyMessage';
import EmptyState from './EmptyState';
import { TemplateFolder, Template } from '@/types/prompts/templates';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';

// Import the new global search hook
import { useGlobalTemplateSearch } from '@/hooks/prompts/utils/useGlobalTemplateSearch';

interface TemplatesPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
}

/**
 * Enhanced Templates Panel with global search functionality
 */
const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  showBackButton,
  onBack,
  onClose
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Enhanced pinning
  const {
    allPinnedFolderIds,
    allPinnedFolders,
    findFolderById,
    pinnedFolders: originalPinnedFolders
  } = useAllPinnedFolders();
  
  const {
    data: userFolders = [],
    isLoading: loadingUser,
    refetch: refetchUser
  } = useUserFolders();

  const {
    data: organizationFolders = [],
    isLoading: loadingOrganization,
    refetch: refetchOrganization
  } = useOrganizationFolders();

  const {
    data: unorganizedTemplates = [],
    isLoading: loadingUnorganized
  } = useUnorganizedTemplates();

  const {
    data: pinnedTemplateIds = [],
    refetch: refetchPinnedTemplates
  } = usePinnedTemplates();

  const { data: organizations = [] } = useOrganizations();

  // Global search hook
  const {
    searchQuery: globalSearchQuery,
    setSearchQuery: setGlobalSearchQuery,
    searchResults,
    clearSearch: clearGlobalSearch,
    hasResults: hasGlobalResults
  } = useGlobalTemplateSearch(userFolders, organizationFolders, unorganizedTemplates);

  // Sync search queries
  useEffect(() => {
    setGlobalSearchQuery(searchQuery);
  }, [searchQuery, setGlobalSearchQuery]);

  // Navigation hook for combined user + organization folders
  const navigation = useBreadcrumbNavigation({
    userFolders,
    organizationFolders,
    unorganizedTemplates
  });

  // Reset navigation to root when a search is initiated
  useEffect(() => {
    if (searchQuery && !navigation.isAtRoot) {
      navigation.navigateToRoot();
    }
  }, [searchQuery, navigation.isAtRoot, navigation.navigateToRoot]);

  // Utility functions for search filtering (for local navigation)
  const templateMatchesQuery = useCallback(
    (template: Template, query: string) => {
      const q = query.toLowerCase();
      const title = getLocalizedContent((template as any).title) || '';
      const description = getLocalizedContent((template as any).description) || '';
      const content = getLocalizedContent(template.content) || '';

      return (
        title.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        content.toLowerCase().includes(q)
      );
    },
    []
  );

  const folderMatchesQuery = useCallback(
    function folderMatches(folder: TemplateFolder, query: string): boolean {
      const q = query.toLowerCase();

      const title = getLocalizedContent(folder.title ?? folder.name) || '';
      if (title.toLowerCase().includes(q)) return true;

      if (folder.templates?.some(t => templateMatchesQuery(t, query))) return true;

      if (folder.Folders?.some(f => folderMatches(f, query))) return true;

      return false;
    },
    [templateMatchesQuery]
  );

  // When there's a search query, show global results; otherwise show navigation items
  const displayItems = useMemo(() => {
    if (searchQuery.trim()) {
      // Return global search results
      return {
        folders: searchResults.folders,
        templates: searchResults.templates,
        isGlobalSearch: true
      };
    } else {
      // Return navigation items (existing logic)
      const filteredItems = navigation.currentItems.filter(
        (item) => navigation.getItemType(item) === 'user'
      );
      
      const folders = filteredItems.filter(item => 'templates' in item) as TemplateFolder[];
      const templates = filteredItems.filter(item => !('templates' in item)) as Template[];
      
      return {
        folders,
        templates,
        isGlobalSearch: false
      };
    }
  }, [searchQuery, searchResults, navigation.currentItems, navigation]);

  // Enhanced pinned folders filtering that includes nested pinned folders
  const filteredPinned = useMemo(() => {
    if (!searchQuery.trim()) {
      // Group all pinned folders by type
      const grouped = {
        user: allPinnedFolders.filter(f => f.folderType === 'user'),
        organization: allPinnedFolders.filter(f => f.folderType === 'organization')
      };
      return grouped;
    }
    
    // Filter pinned folders based on search
    const filter = (folders: typeof allPinnedFolders) =>
      folders.filter(f => folderMatchesQuery(f, searchQuery));
    
    const filteredAll = filter(allPinnedFolders);
    return {
      user: filteredAll.filter(f => f.folderType === 'user'),
      organization: filteredAll.filter(f => f.folderType === 'organization')
    };
  }, [allPinnedFolders, searchQuery, folderMatchesQuery]);

  const pinnedTemplates = useMemo(() => {
    if (!pinnedTemplateIds.length) return [] as Array<Template & { type: 'user' | 'organization' }>;

    const gather = (folders: TemplateFolder[] = [], type: 'user' | 'organization') => {
      const result: Array<Template & { type: 'user' | 'organization' }> = [];
      const traverse = (folder: TemplateFolder) => {
        if (Array.isArray(folder.templates)) {
          folder.templates.forEach(t => {
            if (pinnedTemplateIds.includes(t.id)) {
              result.push({ ...t, type });
            }
          });
        }
        if (Array.isArray(folder.Folders)) {
          folder.Folders.forEach(traverse);
        }
      };
      folders.forEach(traverse);
      return result;
    };

    const templates: Array<Template & { type: 'user' | 'organization' }> = [];
    templates.push(...gather(userFolders, 'user'));
    templates.push(...gather(organizationFolders, 'organization'));
    unorganizedTemplates.forEach(t => {
      if (pinnedTemplateIds.includes(t.id)) {
        templates.push({ ...t, type: 'user' });
      }
    });

    return templates;
  }, [pinnedTemplateIds, userFolders, organizationFolders, unorganizedTemplates]);

  const filteredPinnedTemplates = useMemo(() => {
    if (!searchQuery.trim()) return pinnedTemplates;
    return pinnedTemplates.filter(t => templateMatchesQuery(t, searchQuery));
  }, [pinnedTemplates, searchQuery, templateMatchesQuery]);

  // Mutations and actions
  const { toggleFolderPin, deleteFolder, createFolder } = useFolderMutations();
  const { deleteTemplate, toggleTemplatePin } = useTemplateMutations();
  const { useTemplate, createTemplate, editTemplate } = useTemplateActions();
  const { openConfirmation, openFolderManager, openCreateFolder, openBrowseMoreFolders } = useDialogActions();

  // Enhanced pin handler that works with the navigation system
  const handleTogglePin = useCallback(
    async (folderId: number, isPinned: boolean, type: 'user' | 'organization' | 'company') => {
      try {
        await toggleFolderPin.mutateAsync({ 
          folderId, 
          isPinned, 
          type
        });
      } catch (error) {
        console.error('Error toggling pin:', error);
      }
    },
    [toggleFolderPin]
  );

  const handleToggleTemplatePin = useCallback(
    async (templateId: number, isPinned: boolean, type: 'user' | 'organization' | 'company') => {
      try {
        await toggleTemplatePin.mutateAsync({ templateId, isPinned, type });
      } catch (error) {
        console.error('Error toggling template pin:', error);
      }
    },
    [toggleTemplatePin]
  );

  // Enhanced folder handlers
  const handleEditFolder = useCallback((folder: TemplateFolder) => {
    openFolderManager({ folder, userFolders });
  }, [openFolderManager, userFolders]);

  const handleDeleteFolder = useCallback((folderId: number) => {
    openConfirmation({
      title: getMessage('deleteFolder', undefined, 'Delete Folder'),
      description: getMessage('deleteFolderConfirmation', undefined, 'Are you sure you want to delete this folder and all its templates? This action cannot be undone.'),
      onConfirm: async () => {
        try {
          await deleteFolder.mutateAsync(folderId);
          await refetchUser();
          navigation.navigateToRoot();
          return true;
        } catch (error) {
          console.error('Error deleting folder:', error);
          return false;
        }
      },
    });
  }, [openConfirmation, deleteFolder, refetchUser, navigation]);

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
      },
    });
  }, [openCreateFolder, createFolder, refetchUser]);

  // Template handlers
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

  // Loading state
  const isLoading = loadingUser || loadingOrganization || loadingUnorganized;

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
          placeholderText="Search templates and folders..."
          onReset={() => setSearchQuery('')}
        />

        {/* Main Navigation Section */}
        <div className="jd-space-y-1">
          <div>
            {/* Show different header based on search state */}
            {searchQuery.trim() ? (
              <div className="jd-flex jd-items-center jd-justify-between jd-text-sm jd-font-medium jd-text-muted-foreground jd-mb-2 jd-px-2">
                <div className="jd-flex jd-items-center">
                  <FolderOpen className="jd-mr-2 jd-h-4 jd-w-4" />
                  Search Results
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="jd-h-6 jd-px-2 jd-text-xs"
                >
                  Clear
                </Button>
              </div>
            ) : (
              <UnifiedNavigation
                isAtRoot={navigation.isAtRoot}
                currentFolderTitle={navigation.currentFolder?.title}
                navigationPath={navigation.breadcrumbs}
                onNavigateToRoot={navigation.navigateToRoot}
                onNavigateBack={navigation.navigateBack}
                onNavigateToPathIndex={navigation.navigateToPathIndex}
                onCreateTemplate={createTemplate}
                onCreateFolder={handleCreateFolder}
                showCreateTemplate={true}
                showCreateFolder={true}
              />
            )}

            {/* Display Items */}
            <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
              {displayItems.folders.length === 0 && displayItems.templates.length === 0 ? (
                <EmptyMessage>
                  {searchQuery.trim() 
                    ? `No results found for "${searchQuery}"`
                    : navigation.isAtRoot
                      ? getMessage('noTemplates', undefined, 'No templates yet. Create your first template!')
                      : 'This folder is empty'
                  }
                </EmptyMessage>
              ) : (
                <>
                  {/* Render folders */}
                  {displayItems.folders.map((folder) => (
                    <FolderItem
                      key={`${displayItems.isGlobalSearch ? 'search-' : ''}folder-${folder.id}`}
                      folder={folder}
                      type={navigation.getItemType(folder)}
                      enableNavigation={!displayItems.isGlobalSearch}
                      onNavigateToFolder={displayItems.isGlobalSearch ? undefined : navigation.navigateToFolder}
                      onTogglePin={handleTogglePin}
                      onEditFolder={handleEditFolder}
                      onDeleteFolder={handleDeleteFolder}
                      onUseTemplate={useTemplate}
                      onEditTemplate={editTemplate}
                      onDeleteTemplate={handleDeleteTemplate}
                      organizations={organizations}
                      showPinControls={true}
                      showEditControls={navigation.getItemType(folder) === 'user'}
                      showDeleteControls={navigation.getItemType(folder) === 'user'}
                      pinnedFolderIds={allPinnedFolderIds}
                    />
                  ))}

                  {/* Render templates */}
                  {displayItems.templates.map((template) => {
                    const templateType = displayItems.isGlobalSearch 
                      ? (template as any).folderType || 'user'
                      : navigation.getItemType(template);
                    
                    return (
                      <div key={`${displayItems.isGlobalSearch ? 'search-' : ''}template-${template.id}`}>
                        {/* Show folder path for global search results */}
                        {displayItems.isGlobalSearch && (template as any).folderPath && (
                          <div className="jd-text-xs jd-text-muted-foreground jd-px-2 jd-py-1 jd-bg-muted/30 jd-rounded-sm jd-mb-1">
                            📁 {(template as any).folderPath}
                          </div>
                        )}
                        <TemplateItem
                          template={template}
                          type={templateType}
                          onUseTemplate={useTemplate}
                          onEditTemplate={editTemplate}
                          onDeleteTemplate={handleDeleteTemplate}
                          onTogglePin={handleToggleTemplatePin}
                          showEditControls={templateType === 'user'}
                          showDeleteControls={templateType === 'user'}
                          showPinControls={true}
                          organizations={organizations}
                        />
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Enhanced Pinned Templates Section - now shows nested pinned folders */}
          <div>
            <div className="jd-flex jd-items-center jd-justify-between jd-text-sm jd-font-medium jd-text-muted-foreground jd-mb-2 jd-px-2">
              <div className="jd-flex jd-items-center">
                <FolderOpen className="jd-mr-2 jd-h-4 jd-w-4" />
                {getMessage('pinnedTemplates', undefined, 'Pinned Templates')}
                {(filteredPinnedTemplates.length + allPinnedFolders.length) > 0 && (
                  <span className="jd-ml-1 jd-text-xs jd-bg-primary/10 jd-text-primary jd-px-1.5 jd-py-0.5 jd-rounded-full">
                    {filteredPinnedTemplates.length + allPinnedFolders.length}
                  </span>
                )}
              </div>
              <Button variant="secondary" size="sm" className="jd-h-7 jd-px-2 jd-text-xs" onClick={openBrowseMoreFolders}>
                {getMessage('browseMore', undefined, 'Browse More')}
              </Button>
            </div>

            <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
              {(filteredPinnedTemplates.length + allPinnedFolders.length) === 0 ? (
                <EmptyMessage>
                  {getMessage('noPinnedTemplates', undefined, 'No pinned templates. Pin your favorites for quick access.')}
                </EmptyMessage>
              ) : (
                <>
                  {/* Pinned templates */}
                  {filteredPinnedTemplates.map(t => (
                    <TemplateItem
                      key={`pinned-template-${t.id}`}
                      template={t}
                      type={(t as any).type || 'user'}
                      onUseTemplate={useTemplate}
                      onEditTemplate={editTemplate}
                      onDeleteTemplate={handleDeleteTemplate}
                      onTogglePin={handleToggleTemplatePin}
                      showEditControls={(t as any).type === 'user'}
                      showDeleteControls={(t as any).type === 'user'}
                      showPinControls={true}
                      organizations={organizations}
                    />
                  ))}

                  {/* User pinned folders (including nested ones) */}
                  {filteredPinned.user.map(folder => (
                    <FolderItem
                      key={`pinned-user-${folder.id}`}
                      folder={folder}
                      type="user"
                      enableNavigation={false}
                      onTogglePin={handleTogglePin}
                      onUseTemplate={useTemplate}
                      onEditTemplate={editTemplate}
                      onDeleteTemplate={handleDeleteTemplate}
                      onEditFolder={handleEditFolder}
                      onDeleteFolder={handleDeleteFolder}
                      organizations={organizations}
                      showPinControls={true}
                      showEditControls={true}
                      showDeleteControls={true}
                      pinnedFolderIds={allPinnedFolderIds}
                    />
                  ))}
                  
                  {/* Organization pinned folders (including nested ones) */}
                  {filteredPinned.organization.map(folder => (
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
                      pinnedFolderIds={allPinnedFolderIds}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </BasePanel>
  );
};

export default memo(TemplatesPanel);