// src/components/panels/TemplatesPanel/index.tsx - Complete optimized version
import React, { useCallback, memo, useMemo, useState, useEffect } from 'react';
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getMessage } from '@/core/utils/i18n';
import BasePanel from '../BasePanel';
import { toast } from 'sonner';
import { Separator } from "@/components/ui/separator";

// Import onboarding components
import { OnboardingChecklist } from './OnboardingChecklist';
import { useOnboardingChecklist } from '@/hooks/onboarding/useOnboardingChecklist';

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
import { VirtualizedList } from '@/components/common/VirtualizedList';
import { promptApi, getWhichTemplate } from '@/services/api';

import { OptimizedFolderSearch } from '@/components/prompts/folders/OptimizedFolderSearch';
import { useOptimizedSearch } from '@/hooks/prompts/utils/useOptimizedSearch';
import { LoadingState } from './LoadingState';
import { EmptyMessage } from './EmptyMessage';
import { TemplateFolder, Template } from '@/types/prompts/templates';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';
import { getFolderTitle } from '@/utils/prompts/folderUtils';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { useBlockActions } from '@/hooks/prompts/actions/useBlockActions';

interface TemplatesPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
}

interface SearchFilters {
  type: 'all' | 'templates' | 'folders';
  source: 'all' | 'user' | 'organization' | 'company';
}

/**
 * Enhanced Templates Panel with optimized search functionality and performance improvements
 */
const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  showBackButton,
  onBack,
  onClose
}) => {
  // Search state and filters
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    type: 'all',
    source: 'all'
  });

  // Enhanced pinning data
  const {
    allPinnedFolderIds,
    allPinnedFolders,
    findFolderById,
    pinnedFolders: originalPinnedFolders
  } = useAllPinnedFolders();
  
  // Core data hooks
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
    isLoading: loadingUnorganized,
    refetch: refetchUnorganized
  } = useUnorganizedTemplates();

  const {
    data: pinnedTemplateIds = [],
    refetch: refetchPinnedTemplates
  } = usePinnedTemplates();

  const { data: organizations = [] } = useOrganizations();

  // OPTIMIZED onboarding hook with caching and background updates
  const {
    checklist,
    isLoading: onboardingLoading,
    isUpdating: onboardingUpdating,
    dismissOnboarding,
    markTemplateCreated,
    markTemplateUsed,
    markKeyboardShortcutUsed,
    shouldShow: shouldShowOnboarding
  } = useOnboardingChecklist();

  // Optimized search hook
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    clearSearch,
    hasResults,
    isSearching,
    totalIndexedItems
  } = useOptimizedSearch(
    userFolders,
    organizationFolders,
    unorganizedTemplates
  );

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

  // Apply search filters
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return { templates: [], folders: [] };
    }

    let filteredTemplates = searchResults.templates;
    let filteredFolders = searchResults.folders;

    // Apply type filter
    if (searchFilters.type === 'templates') {
      filteredFolders = [];
    } else if (searchFilters.type === 'folders') {
      filteredTemplates = [];
    }

    // Apply source filter
    if (searchFilters.source !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.folderType === searchFilters.source);
      filteredFolders = filteredFolders.filter(f => f.folderType === searchFilters.source);
    }

    return {
      templates: filteredTemplates,
      folders: filteredFolders
    };
  }, [searchResults, searchFilters, searchQuery]);

  // When there's a search query, show filtered results; otherwise show navigation items
  const displayItems = useMemo(() => {
    const getTitle = (item: TemplateFolder | Template) =>
      'templates' in item || 'Folders' in item
        ? getFolderTitle(item as TemplateFolder)
        : getLocalizedContent((item as Template).title) || '';

    const sortAll = (items: Array<TemplateFolder | Template>) =>
      [...items].sort((a, b) => getTitle(a).localeCompare(getTitle(b), undefined, { sensitivity: 'base' }));

    if (searchQuery.trim()) {
      const items = sortAll([...filteredSearchResults.folders, ...filteredSearchResults.templates]);
      return { items, isGlobalSearch: true };
    } else {
      const filteredItems = navigation.currentItems.filter(
        (item) => navigation.getItemType(item) === 'user'
      );
      const items = sortAll(filteredItems);
      return { items, isGlobalSearch: false };
    }
  }, [searchQuery, filteredSearchResults, navigation.currentItems, navigation]);

  const userTemplateCount = useMemo(
    () =>
      displayItems.items.filter(
        item => !('templates' in item || 'Folders' in item)
      ).length,
    [displayItems.items]
  );

  const showCreateTemplateCTA = useMemo(
    () =>
      navigation.isAtRoot && !searchQuery.trim() && userTemplateCount < 5,
    [navigation.isAtRoot, searchQuery, userTemplateCount]
  );

  // OPTIMIZED check for showing onboarding with early returns
  const showOnboardingChecklist = useMemo(() => {
    // Fast early returns for performance
    if (onboardingLoading) return false;
    if (!checklist) return false;
    if (searchQuery.trim()) return false; // Don't show while searching
    
    return shouldShowOnboarding;
  }, [onboardingLoading, checklist, searchQuery, shouldShowOnboarding]);

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
    
    // When searching, show pinned items that match the search
    const filter = (folders: typeof allPinnedFolders) =>
      folders.filter(f => {
        const title = getFolderTitle(f);
        return title.toLowerCase().includes(searchQuery.toLowerCase());
      });
    
    const filteredAll = filter(allPinnedFolders);
    return {
      user: filteredAll.filter(f => f.folderType === 'user'),
      organization: filteredAll.filter(f => f.folderType === 'organization')
    };
  }, [allPinnedFolders, searchQuery]);

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

    if (navigation.currentFolder?.templates) {
      navigation.currentFolder.templates.forEach(t => {
        if (pinnedTemplateIds.includes(t.id)) {
          templates.push({ ...t, type: navigation.getItemType(navigation.currentFolder as any) });
        }
      });
    }

    return templates;
  }, [pinnedTemplateIds, userFolders, organizationFolders, unorganizedTemplates, navigation.currentFolder]);

  const filteredPinnedTemplates = useMemo(() => {
    if (!searchQuery.trim()) return pinnedTemplates;
    
    return pinnedTemplates.filter(t => {
      const title = getLocalizedContent((t as any).title) || '';
      const content = getLocalizedContent(t.content) || '';
      const description = getLocalizedContent((t as any).description) || '';
      const searchTerm = searchQuery.toLowerCase();
      
      return title.toLowerCase().includes(searchTerm) ||
             content.toLowerCase().includes(searchTerm) ||
             description.toLowerCase().includes(searchTerm);
    });
  }, [pinnedTemplates, searchQuery]);

  const getPinnedItemTitle = (item: TemplateFolder | Template) =>
    'templates' in item || 'Folders' in item
      ? getFolderTitle(item as TemplateFolder)
      : getLocalizedContent((item as Template).title) || '';

  const sortedPinnedFolders = useMemo(() => {
    const folders = [...filteredPinned.user, ...filteredPinned.organization];
    return folders.sort((a, b) =>
      getPinnedItemTitle(a).localeCompare(getPinnedItemTitle(b), undefined, {
        sensitivity: 'base',
      })
    );
  }, [filteredPinned]);

  const sortedPinnedTemplates = useMemo(() => {
    return [...filteredPinnedTemplates].sort((a, b) =>
      getPinnedItemTitle(a).localeCompare(getPinnedItemTitle(b), undefined, {
        sensitivity: 'base',
      })
    );
  }, [filteredPinnedTemplates]);

  const sortedPinnedItems = useMemo(
    () => [...sortedPinnedFolders, ...sortedPinnedTemplates],
    [sortedPinnedFolders, sortedPinnedTemplates]
  );

  // Mutations and actions
  const { toggleFolderPin, deleteFolder, createFolder } = useFolderMutations();
  const { deleteTemplate, toggleTemplatePin } = useTemplateMutations();
  const { useTemplate, createTemplate, editTemplate } = useTemplateActions();
  const { openConfirmation, openFolderManager, openCreateFolder, openBrowseMoreFolders, openCreateBlock, openKeyboardShortcut, openShareDialog } = useDialogActions();
  const { createBlock } = useBlockActions();

  // MEMOIZED onboarding handlers to prevent re-renders
  const onboardingHandlers = useMemo(() => ({
    handleCreateTemplate: () => {
      createTemplate();
      // markTemplateCreated will be called automatically via optimistic updates
    },
    
    handleUseTemplate: async () => {
      try {
        const response = await getWhichTemplate();
        if (response.success && response.data) {
          await useTemplate(response.data as Template);
          // markTemplateUsed will be called automatically via optimistic updates
        } else {
          toast.error(getMessage('noTemplateToUse', undefined, 'No template available to use. Create one first!'));
        }
      } catch (error) {
        console.error('Error using template:', error);
        toast.error(getMessage('errorUsingTemplate', undefined, 'Failed to use template'));
      }
    },

    handleCreateBlock: () => {
      createBlock(undefined, 'OnboardingChecklist');
      // markBlockCreated will be called automatically via optimistic updates
    },

    handleShowKeyboardShortcut: () => {
      openKeyboardShortcut({ 
        onShortcutUsed: markKeyboardShortcutUsed 
      });
    }
  }), [createTemplate, useTemplate, createBlock, openKeyboardShortcut, markKeyboardShortcutUsed]);

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
          return { success: false, error: getMessage('failedToCreateFolder', undefined, 'Failed to create folder') };
        }
      },
      onFolderCreated: async (folder: TemplateFolder) => {
        await refetchUser();
        trackEvent(EVENTS.TEMPLATE_FOLDER_CREATED, {
          folder_id: folder.id,
          folder_name: typeof folder.title === 'string' ? folder.title : (folder.title as any)?.en || folder.name,
          source: 'TemplatesPanel'
        });
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

  // PERFORMANCE: Early loading state return
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

  // Calculate total results for search
  const totalSearchResults = filteredSearchResults.templates.length + filteredSearchResults.folders.length;

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
        {/* Optimized Search */}
        <OptimizedFolderSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholderText={getMessage('searchTemplatesAndFolders', undefined, 'Search templates and folders...')}
          onReset={clearSearch}
          isSearching={isSearching}
          totalResults={totalSearchResults}
          totalIndexedItems={totalIndexedItems}
          showFilters={true}
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
        />

        {/* OPTIMIZED onboarding checklist with conditional rendering */}
        {showOnboardingChecklist && (
          <OnboardingChecklist
            checklist={checklist}
            onCreateTemplate={onboardingHandlers.handleCreateTemplate}
            onUseTemplate={onboardingHandlers.handleUseTemplate}
            onSelectTemplate={useTemplate}
            onCreateBlock={onboardingHandlers.handleCreateBlock}
            onShowKeyboardShortcut={onboardingHandlers.handleShowKeyboardShortcut}
            onDismiss={dismissOnboarding}
            isLoading={onboardingUpdating}
          />
        )}

        {/* Main Navigation Section */}
        <div className="jd-space-y-1">
          <div>
            {/* 
              This section shows different headers based on search state:
              
              1. SEARCH STATE (when searchQuery.trim() is truthy):
                 - Shows "Search Results" header with a clear button
                 - The FolderOpen icon indicates we're viewing search results
                 - Clear button allows users to quickly exit search mode
                 
              2. NORMAL NAVIGATION STATE (when no search):
                 - Shows the UnifiedNavigation component
                 - Provides breadcrumb navigation through folder hierarchy
                 - Shows current folder title and navigation path
                 - Includes action buttons for creating templates/folders/blocks
                 
              This conditional rendering ensures the UI adapts to user context:
              - When searching: Focus on search results and quick exit
              - When browsing: Full navigation capabilities and creation tools
            */}
            {searchQuery.trim() ? (
              <div className="jd-flex jd-items-center jd-justify-between jd-text-sm jd-font-medium jd-text-muted-foreground jd-mb-2 jd-px-2">
                <div className="jd-flex jd-items-center">
                  <FolderOpen className="jd-mr-2 jd-h-4 jd-w-4" />
                  {getMessage('searchResults', undefined, 'Search Results')}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="jd-h-6 jd-px-2 jd-text-xs"
                >
                  {getMessage('clear', undefined, 'Clear')}
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
                onCreateBlock={() => openCreateBlock({ source: 'TemplatesPanel' })}
                showCreateTemplate={true}
                showCreateFolder={true}
                showCreateBlock={true}
              />
            )}

            {/* 
              Display Items Section:
              
              This handles three main scenarios:
              
              1. EMPTY STATE (no items and no onboarding):
                 - Shows contextual empty messages based on current state
                 - Different messages for: search with no results, root with no templates, empty folder
                 
              2. VIRTUALIZED RENDERING (>30 items, not searching):
                 - Uses VirtualizedList for performance with large datasets
                 - Only renders visible items to maintain smooth scrolling
                 - Each item gets proper key and type handling
                 
              3. NORMAL RENDERING (≤30 items or searching):
                 - Standard React rendering for smaller lists
                 - Better for search results where virtualization might be overkill
                 - Maintains full functionality for all item types
              
              Items can be either folders or templates, each with their own:
              - Rendering component (FolderItem vs TemplateItem)
              - Action handlers (edit, delete, pin, navigate)
              - Access control (based on user permissions)
              - Type determination (user vs organization vs company)
            */}
            <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
              {displayItems.items.length === 0 && !showOnboardingChecklist ? (
                <EmptyMessage>
                  {searchQuery.trim()
                    ? getMessage(
                        'noResultsForQuery',
                        [searchQuery],
                        `No results found for "${searchQuery}"`
                      )
                    : navigation.isAtRoot
                      ? getMessage('noTemplates', undefined, 'No templates yet. Create your first template!')
                      : getMessage('folderEmpty', undefined, 'This folder is empty')
                  }
                </EmptyMessage>
              ) : (
                <>
                  {displayItems.items.length > 30 && !searchQuery.trim() ? (
                    <VirtualizedList
                      items={displayItems.items}
                      height={384}
                      itemHeight={60}
                      renderItem={(item) => {
                        const isFolder = 'templates' in item || 'Folders' in item;
                        if (isFolder) {
                          const folder = item as TemplateFolder;
                          return (
                            <FolderItem
                              key={`${displayItems.isGlobalSearch ? 'search-' : ''}folder-${folder.id}`}
                              folder={folder}
                              type={navigation.getItemType(folder)}
                              enableNavigation={!displayItems.isGlobalSearch}
                              onNavigateToFolder={displayItems.isGlobalSearch ? undefined : navigation.navigateToFolder}
                              onTogglePin={handleTogglePin}
                              onToggleTemplatePin={handleToggleTemplatePin}
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
                              isInGlobalSearch={displayItems.isGlobalSearch}
                            />
                          );
                        }
                        const template = item as Template;
                        const templateType = displayItems.isGlobalSearch
                          ? (template as any).folderType || 'user'
                          : navigation.getItemType(template);
                        return (
                          <div key={`${displayItems.isGlobalSearch ? 'search-' : ''}template-${template.id}`}> 
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
                      }}
                    />
                  ) : (
                    displayItems.items.map(item => {
                      const isFolder = 'templates' in item || 'Folders' in item;
                      if (isFolder) {
                        const folder = item as TemplateFolder;
                        return (
                          <FolderItem
                            key={`${displayItems.isGlobalSearch ? 'search-' : ''}folder-${folder.id}`}
                            folder={folder}
                            type={navigation.getItemType(folder)}
                            enableNavigation={!displayItems.isGlobalSearch}
                            onNavigateToFolder={displayItems.isGlobalSearch ? undefined : navigation.navigateToFolder}
                            onTogglePin={handleTogglePin}
                            onToggleTemplatePin={handleToggleTemplatePin}
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
                            isInGlobalSearch={displayItems.isGlobalSearch}
                          />
                        );
                      }
                      const template = item as Template;
                      const templateType = displayItems.isGlobalSearch
                        ? (template as any).folderType || 'user'
                        : navigation.getItemType(template);
                      return (
                        <div key={`${displayItems.isGlobalSearch ? 'search-' : ''}template-${template.id}`}> 
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
                    })
                  )}
                </>
              )}
            </div>
          </div>

          {showCreateTemplateCTA && (
            <div className="jd-px-2 jd-mt-2">
              <Button
                className="jd-w-full"
                variant="secondary"
                onClick={onboardingHandlers.handleCreateTemplate}
              >
                {getMessage('createTemplate', undefined, 'Create Template')}
              </Button>
            </div>
          )}

        <Separator />

        {/* Pinned Folders Section */}
        <div>
          <div className="jd-flex jd-items-center jd-justify-between jd-text-sm jd-font-medium jd-text-muted-foreground jd-mb-2 jd-px-2">
            <div className="jd-flex jd-items-center">
              <FolderOpen className="jd-mr-2 jd-h-4 jd-w-4" />
              {getMessage('pinnedFolders', undefined, 'Pinned Folders')}
              {sortedPinnedItems.length > 0 && (
                <span className="jd-ml-1 jd-text-xs jd-bg-primary/10 jd-text-primary jd-px-1.5 jd-py-0.5 jd-rounded-full">
                  {sortedPinnedItems.length}
                </span>
              )}
            </div>
            <Button variant="secondary" size="sm" className="jd-h-7 jd-px-2 jd-text-xs" onClick={openBrowseMoreFolders}>
              {getMessage('browseMore', undefined, 'Browse More')}
            </Button>
          </div>

          <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
            {sortedPinnedItems.length === 0 ? (
              <EmptyMessage>
                {getMessage('noPinnedTemplates', undefined, 'No pinned templates. Pin your favorites for quick access.')}
              </EmptyMessage>
            ) : (
              <>
                {sortedPinnedItems.map(item => {
                  const isFolder = 'templates' in item || 'Folders' in item;
                  if (isFolder) {
                    const folder = item as TemplateFolder;
                    const folderType = (item as any).folderType || 'user';
                    return (
                      <FolderItem
                        key={`pinned-folder-${folder.id}`}
                        folder={folder}
                        type={folderType}
                        enableNavigation={false}
                        onTogglePin={handleTogglePin}
                        onToggleTemplatePin={handleToggleTemplatePin}
                        onUseTemplate={useTemplate}
                        onEditTemplate={editTemplate}
                        onDeleteTemplate={handleDeleteTemplate}
                        onEditFolder={handleEditFolder}
                        onDeleteFolder={handleDeleteFolder}
                        organizations={organizations}
                        showPinControls={true}
                        showEditControls={folderType === 'user'}
                        showDeleteControls={folderType === 'user'}
                        pinnedFolderIds={allPinnedFolderIds}
                        isInGlobalSearch={false}
                      />
                    );
                  }
                  const template = item as Template;
                  const templateType = (template as any).type || 'user';
                  return (
                    <TemplateItem
                      key={`pinned-template-${template.id}`}
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
                  );
                })}
              </>
            )}
          </div>

        </div>
        <div className="jd-px-2 jd-mt-2">
          <Button className="jd-w-full" variant="secondary" onClick={openShareDialog}>
            {getMessage('shareJaydai', undefined, 'Share Jaydai')}
          </Button>
        </div>
        </div>

      </TooltipProvider>
    </BasePanel>
  );
};

export default memo(TemplatesPanel);