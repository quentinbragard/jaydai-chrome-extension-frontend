// src/components/panels/TemplatesPanel/index.tsx - Updated with onboarding
import React, { useCallback, memo, useMemo, useState, useEffect } from 'react';
import { FolderOpen, Shield, ChevronRight, Building2, Mail, Lock, Star, Users, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getMessage } from '@/core/utils/i18n';
import BasePanel from '../BasePanel';
import { toast } from 'sonner';
import { Separator } from "@/components/ui/separator";

// Import onboarding components
import { OnboardingChecklist } from './OnboardingChecklist';
import { KeyboardShortcutDialog } from '@/components/dialogs/onboarding/KeyboardShortcutDialog';
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
  useCompanyFolders,
  useFolderMutations,
  useTemplateMutations,
  useTemplateActions,
  useUnorganizedTemplates,
  usePinnedTemplates
} from '@/hooks/prompts';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';
import { useOrganizations } from '@/hooks/organizations';
import { VirtualizedList } from '@/components/common/VirtualizedList';

import { FolderSearch } from '@/components/prompts/folders';
import { LoadingState } from './LoadingState';
import { EmptyMessage } from './EmptyMessage';
import { TemplateFolder, Template } from '@/types/prompts/templates';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';
import { getFolderTitle } from '@/utils/prompts/folderUtils';
import { trackEvent, EVENTS } from '@/utils/amplitude';

// Enhanced Enterprise CTA Component
const EnhancedEnterpriseCTA: React.FC<{ onContactSales: () => void }> = ({ onContactSales }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="jd-my-2 jd-rounded-xl jd-relative jd-overflow-hidden jd-transition-all jd-duration-300 jd-transform hover:jd-scale-[1.02] jd-group jd-cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onContactSales}
    >
      {/* Animated background gradient */}
      <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-br jd-from-blue-500/10 jd-via-purple-500/10 jd-to-indigo-500/10 jd-dark:jd-from-blue-600/20 jd-dark:jd-via-purple-600/20 jd-dark:jd-to-indigo-600/20"></div>
      
      {/* Subtle animated shimmer effect */}
      <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-transparent jd-via-white/5 jd-to-transparent jd-translate-x-[-100%] group-hover:jd-translate-x-[100%] jd-transition-transform jd-duration-1000"></div>
      
      {/* Border with gradient */}
      <div className="jd-absolute jd-inset-0 jd-rounded-xl jd-border jd-border-blue-200/60 jd-dark:jd-border-blue-500/30 group-hover:jd-border-blue-300/80 jd-dark:group-hover:jd-border-blue-400/50 jd-transition-colors jd-duration-300"></div>
      
      <div className="jd-relative jd-p-4 jd-space-y-3">
        {/* Header section with enhanced visuals */}
        <div className="jd-flex jd-items-start jd-justify-between">
          <div className="jd-flex jd-items-start jd-gap-3">
            {/* Enhanced icon with glow effect */}
            <div className="jd-relative jd-p-2 jd-rounded-lg jd-bg-gradient-to-br jd-from-blue-500/20 jd-to-purple-500/20 jd-dark:jd-from-blue-600/30 jd-dark:jd-to-purple-600/30">
              <Building2 className="jd-w-5 jd-h-5 jd-text-primary" />
              {isHovered && (
                <div className="jd-absolute jd-inset-0 jd-rounded-lg jd-bg-primary/20 jd-animate-pulse"></div>
              )}
            </div>
            
            <div className="jd-flex jd-flex-col jd-gap-1">
              <div className="jd-flex jd-items-center jd-gap-2">
                <h3 className="jd-text-sm jd-font-semibold jd-text-primary">
                  {getMessage('company_templates_cta_title', undefined, 'Company Templates')}
                </h3>
                <div className="jd-flex jd-items-center jd-gap-1 jd-px-2 jd-py-0.5 jd-rounded-full jd-bg-gradient-to-r jd-from-amber-400/20 jd-to-orange-400/20 jd-border jd-border-amber-300/30">
                  <Star className="jd-h-2.5 jd-w-2.5 jd-text-amber-600 jd-dark:jd-text-amber-400" />
                  <span className="jd-text-xs jd-font-medium jd-text-amber-700 jd-dark:jd-text-amber-400">
                    {getMessage('premium', undefined, 'Premium')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Animated arrow that appears on hover */}
          <ChevronRight 
            className={`jd-w-4 jd-h-4 jd-text-blue-500 jd-dark:jd-text-blue-400 jd-transition-all jd-duration-300 ${
              isHovered ? 'jd-translate-x-1 jd-opacity-100' : 'jd-translate-x-0 jd-opacity-60'
            }`} 
          />
        </div>

        {/* Enhanced CTA button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContactSales();
          }}
          className="jd-group jd-relative jd-w-full jd-overflow-hidden jd-rounded-lg jd-bg-gradient-to-r jd-from-blue-600 jd-to-purple-600 jd-p-3 jd-text-white jd-transition-all jd-duration-300 hover:jd-from-blue-700 hover:jd-to-purple-700 hover:jd-shadow-lg hover:jd-shadow-blue-500/25 jd-dark:hover:jd-shadow-blue-400/20"
        >
          {/* Button shimmer effect */}
          <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-bg-secondary jd-translate-x-[-100%] group-hover:jd-translate-x-[100%] jd-transition-transform jd-duration-700"></div>
          
          <div className="jd-relative jd-flex jd-items-center jd-justify-center jd-gap-2">
            <Mail className=" jd-text-secondary-foreground jd-h-4 jd-w-4 jd-transition-transform jd-duration-300 group-hover:jd-scale-110" />
            <span className="jd-text-sm jd-font-medium jd-text-secondary-foreground">
              {getMessage('get_enterprise_access', undefined, 'Get Enterprise Access')}
            </span>
            <Sparkles className="jd-h-3 jd-w-3 jd-opacity-70 jd-transition-all jd-duration-300 group-hover:jd-opacity-100 group-hover:jd-rotate-12" />
          </div>
        </button>

        {/* Subtle social proof */}
        <div className="jd-flex jd-items-center jd-justify-center jd-gap-1 jd-text-xs jd-text-secondary-foreground">
          <span>✨</span>
          <span>{getMessage('join_50_teams_already_using_enterprise', undefined, 'Join 50+ teams already using Enterprise')}</span>
        </div>
      </div>
    </div>
  );
};


// Import the new global search hook
import { useGlobalTemplateSearch } from '@/hooks/prompts/utils/useGlobalTemplateSearch';

interface TemplatesPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
}

/**
 * Enhanced Templates Panel with onboarding functionality
 */
const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  showBackButton,
  onBack,
  onClose
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Onboarding state
  const [showKeyboardDialog, setShowKeyboardDialog] = useState(false);

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
    data: companyFolders = [],
    isLoading: loadingCompany,
    refetch: refetchCompany
  } = useCompanyFolders();

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

  // Onboarding hook
  const {
    checklist,
    isLoading: onboardingLoading,
    isUpdating: onboardingUpdating,
    dismissOnboarding,
    markTemplateCreated,
    markTemplateUsed,
    markBlockCreated,
    markKeyboardShortcutUsed
  } = useOnboardingChecklist();

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
    const getTitle = (item: TemplateFolder | Template) =>
      'templates' in item || 'Folders' in item
        ? getFolderTitle(item as TemplateFolder)
        : getLocalizedContent((item as Template).title) || '';

    const sortAll = (items: Array<TemplateFolder | Template>) =>
      [...items].sort((a, b) => getTitle(a).localeCompare(getTitle(b), undefined, { sensitivity: 'base' }));

    if (searchQuery.trim()) {
      const items = sortAll([...searchResults.folders, ...searchResults.templates]);
      return { items, isGlobalSearch: true };
    } else {
      const filteredItems = navigation.currentItems.filter(
        (item) => navigation.getItemType(item) === 'user'
      );
      const items = sortAll(filteredItems);
      return { items, isGlobalSearch: false };
    }
  }, [searchQuery, searchResults, navigation.currentItems, navigation]);

  // Check if we should show onboarding
  const shouldShowOnboarding = useMemo(() => {
    if (onboardingLoading || !checklist || checklist.is_dismissed) return false;
    
    // Show onboarding if no user templates exist
    const hasUserTemplates = displayItems.items.some(item => {
      if ('templates' in item || 'Folders' in item) {
        // It's a folder, check if it has templates
        const folder = item as TemplateFolder;
        return folder.templates && folder.templates.length > 0;
      } else {
        // It's a template
        return true;
      }
    });

    const hasUnorganizedTemplates = unorganizedTemplates.length > 0;
    
    return !hasUserTemplates && !hasUnorganizedTemplates && !searchQuery.trim();
  }, [onboardingLoading, checklist, displayItems.items, unorganizedTemplates, searchQuery]);

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

    if (navigation.currentFolder?.templates) {
      navigation.currentFolder.templates.forEach(t => {
        if (pinnedTemplateIds.includes(t.id)) {
          templates.push({ ...t, type: navigation.getItemType(navigation.currentFolder as any) });
        }
      });
    }

    return templates;
  }, [pinnedTemplateIds, userFolders, organizationFolders, unorganizedTemplates, navigation.currentFolder]);

  const companyTemplates = useMemo(() => {
    const templates: Template[] = [];
    const traverse = (folders: TemplateFolder[]) => {
      folders.forEach(folder => {
        if (Array.isArray(folder.templates)) {
          templates.push(...folder.templates);
        }
        if (Array.isArray(folder.Folders)) {
          traverse(folder.Folders);
        }
      });
    };
    traverse(companyFolders);
    return templates;
  }, [companyFolders]);

  const filteredPinnedTemplates = useMemo(() => {
    if (!searchQuery.trim()) return pinnedTemplates;
    return pinnedTemplates.filter(t => templateMatchesQuery(t, searchQuery));
  }, [pinnedTemplates, searchQuery, templateMatchesQuery]);

  const sortedPinnedItems = useMemo(() => {
    const getTitle = (item: TemplateFolder | Template) =>
      'templates' in item || 'Folders' in item
        ? getFolderTitle(item as TemplateFolder)
        : getLocalizedContent((item as Template).title) || '';

    const all = [
      ...filteredPinnedTemplates,
      ...filteredPinned.user,
      ...filteredPinned.organization,
    ];

    return [...all].sort((a, b) => getTitle(a).localeCompare(getTitle(b), undefined, { sensitivity: 'base' }));
  }, [filteredPinnedTemplates, filteredPinned]);

  // Mutations and actions
  const { toggleFolderPin, deleteFolder, createFolder } = useFolderMutations();
  const { deleteTemplate, toggleTemplatePin } = useTemplateMutations();
  const { useTemplate, createTemplate, editTemplate } = useTemplateActions();
  const { openConfirmation, openFolderManager, openCreateFolder, openBrowseMoreFolders, openCreateBlock } = useDialogActions();

  // Onboarding action handlers
  const handleCreateTemplate = useCallback(() => {
    createTemplate();
    // The markTemplateCreated will be called when template is successfully created
  }, [createTemplate]);

  const handleUseTemplate = useCallback(async () => {
    try {
      // Find the first available user template
      let firstTemplate = null;
      
      // Check unorganized templates first
      if (unorganizedTemplates.length > 0) {
        firstTemplate = unorganizedTemplates[0];
      } else {
        // Check in folders
        for (const folder of userFolders) {
          if (folder.templates && folder.templates.length > 0) {
            firstTemplate = folder.templates[0];
            break;
          }
        }
      }

      if (firstTemplate) {
        await useTemplate(firstTemplate);
        // The markTemplateUsed will be called when template is successfully used
      } else {
        toast.error(getMessage('noTemplateToUse', undefined, 'No template available to use. Create one first!'));
      }
    } catch (error) {
      console.error('Error using template:', error);
      toast.error(getMessage('errorUsingTemplate', undefined, 'Failed to use template'));
    }
  }, [useTemplate, unorganizedTemplates, userFolders]);

  const handleCreateBlock = useCallback(() => {
    openCreateBlock({ 
      source: 'OnboardingChecklist',
      onBlockCreated: async (blockData: any) => {
        // Mark onboarding action as completed when block is created
        markBlockCreated();
        return true;
      }
    });
  }, [openCreateBlock, markBlockCreated]);

  const handleShowKeyboardShortcut = useCallback(() => {
    setShowKeyboardDialog(true);
  }, []);

  const handleKeyboardShortcutUsed = useCallback(() => {
    markKeyboardShortcutUsed();
    setShowKeyboardDialog(false);
  }, [markKeyboardShortcutUsed]);

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

  const handleContactSales = useCallback(() => {
    trackEvent(EVENTS.ENTERPRISE_CTA_CLICKED, { source: 'templates_panel' });
    window.open('https://www.jayd.ai/#Contact', '_blank');
  }, []);

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
  const isLoading =
    loadingUser || loadingOrganization || loadingCompany || loadingUnorganized;

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
          placeholderText={getMessage('searchTemplatesAndFolders', undefined, 'Search templates and folders...')}
          onReset={() => setSearchQuery('')}
        />

        {/* Show onboarding checklist if conditions are met */}
        {shouldShowOnboarding && checklist && (
          <OnboardingChecklist
            checklist={checklist}
            onCreateTemplate={handleCreateTemplate}
            onUseTemplate={handleUseTemplate}
            onCreateBlock={handleCreateBlock}
            onShowKeyboardShortcut={handleShowKeyboardShortcut}
            onDismiss={dismissOnboarding}
            isLoading={onboardingUpdating}
          />
        )}

        {/* Main Navigation Section */}
        <div className="jd-space-y-1">
          <div>
            {/* Show different header based on search state */}
            {searchQuery.trim() ? (
              <div className="jd-flex jd-items-center jd-justify-between jd-text-sm jd-font-medium jd-text-muted-foreground jd-mb-2 jd-px-2">
                <div className="jd-flex jd-items-center">
                  <FolderOpen className="jd-mr-2 jd-h-4 jd-w-4" />
                  {getMessage('searchResults', undefined, 'Search Results')}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
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

            {/* Display Items */}
            <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
              {displayItems.items.length === 0 && !shouldShowOnboarding ? (
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
                  {displayItems.items.length > 30 ? (
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

          <Separator />

{/* Company Templates Section with Enhanced CTA */}
<div>
  <div className="jd-flex jd-items-center jd-justify-between jd-text-sm jd-font-medium jd-text-muted-foreground jd-mb-2 jd-px-2">
    <div className="jd-flex jd-items-center">
      <FolderOpen className="jd-mr-2 jd-h-4 jd-w-4" />
      Company Templates
      {companyTemplates.length > 0 && (
        <span className="jd-ml-1 jd-text-xs jd-bg-primary/10 jd-text-primary jd-px-1.5 jd-py-0.5 jd-rounded-full">
          {companyTemplates.length}
        </span>
      )}
    </div>
  </div>

  <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
    {companyTemplates.length === 0 ? (
      <EnhancedEnterpriseCTA onContactSales={handleContactSales} />
    ) : (
      <>
        {companyTemplates.map(template => (
          <TemplateItem
            key={`company-template-${template.id}`}
            template={template}
            type="company"
            onUseTemplate={useTemplate}
            onTogglePin={(id, pinned) =>
              handleToggleTemplatePin(id, pinned, 'company')
            }
            showEditControls={false}
            showDeleteControls={false}
            showPinControls={true}
            organizations={organizations}
          />
        ))}
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
        </div>

        {/* Keyboard Shortcut Dialog */}
        <KeyboardShortcutDialog
          open={showKeyboardDialog}
          onOpenChange={setShowKeyboardDialog}
          onShortcutUsed={handleKeyboardShortcutUsed}
        />
      </TooltipProvider>
    </BasePanel>
  );
};

export default memo(TemplatesPanel);