// src/components/panels/TemplatesPanel/index.tsx - Enhanced with proper pinning support
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
  useAllPinnedFolders, // NEW: Use enhanced pinning hook
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
import EmptyState from './EmptyState';
import { TemplateFolder, Template } from '@/types/prompts/templates';

interface TemplatesPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
}

/**
 * Enhanced Templates Panel with proper nested folder pinning support
 */
const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  showBackButton,
  onBack,
  onClose
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Enhanced pinning - NEW: Use the enhanced hook
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

  const { data: organizations = [] } = useOrganizations();

  // Navigation hook for combined user + organization folders
  const navigation = useBreadcrumbNavigation({
    userFolders,
    organizationFolders
  });

  // Reset navigation to root when a search is initiated
  useEffect(() => {
    if (searchQuery && !navigation.isAtRoot) {
      navigation.navigateToRoot();
    }
  }, [searchQuery, navigation.isAtRoot, navigation.navigateToRoot]);

  // Utility functions for search filtering
  const templateMatchesQuery = useCallback(
    (template: Template, query: string) => {
      const q = query.toLowerCase();

      // Handle string or object content
      let content = '';
      if (typeof template.content === 'string') {
        content = template.content;
      } else if (template.content && typeof template.content === 'object') {
        content = Object.values(template.content).join(' ');
      }

      return (
        template.title?.toLowerCase().includes(q) ||
        template.description?.toLowerCase().includes(q) ||
        content.toLowerCase().includes(q)
      );
    },
    []
  );

  const folderMatchesQuery = useCallback(
    (folder: TemplateFolder, query: string): boolean => {
      const q = query.toLowerCase();

      if (folder.title?.toLowerCase().includes(q)) return true;

      if (folder.templates?.some(t => templateMatchesQuery(t, query))) return true;

      if (folder.Folders?.some(f => folderMatchesQuery(f, query))) return true;

      return false;
    },
    [templateMatchesQuery]
  );

  const filteredNavigationItems = useMemo(() => {
    if (!searchQuery.trim()) {
      // When there's no active search, only display user templates
      return navigation.currentItems.filter(
        (item) => navigation.getItemType(item) === 'user'
      );
    }
    return navigation.currentItems.filter(item => {
      if ('templates' in item) {
        return folderMatchesQuery(item, searchQuery);
      }
      return templateMatchesQuery(item, searchQuery);
    });
  }, [navigation.currentItems, searchQuery, folderMatchesQuery, templateMatchesQuery, navigation]);

  // NEW: Enhanced pinned folders filtering that includes nested pinned folders
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

  // Mutations and actions
  const { toggleFolderPin, deleteFolder, createFolder } = useFolderMutations();
  const { deleteTemplate } = useTemplateMutations();
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
        // Refetch to update pin status
        // The useAllPinnedFolders hook will automatically update
      } catch (error) {
        console.error('Error toggling pin:', error);
      }
    },
    [toggleFolderPin]
  );

  // Template pin handler (if templates support pinning)
  const handleToggleTemplatePin = useCallback(
    async (templateId: number, isPinned: boolean, type: 'user' | 'organization' | 'company') => {
      // Implementation for template pinning if supported
      console.log('Toggle template pin:', templateId, isPinned, type);
    },
    []
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
  const isLoading = loadingUser || loadingOrganization;

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

        {/* Main Navigation Section - Using enhanced components */}
        <div className="jd-space-y-4">
          <div>
            {/* Unified Navigation Header */}
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

            {/* Current Items using enhanced components with pin state */}
            <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
              {navigation.isAtRoot && userFolders.length === 0 && !searchQuery.trim() ? (
                <EmptyState
                  onCreateTemplate={createTemplate}
                  onRefresh={refetchUser}
                />
              ) : filteredNavigationItems.length === 0 ? (
                <EmptyMessage>
                  {navigation.isAtRoot
                    ? getMessage('noTemplates', undefined, 'No templates yet. Create your first template!')
                    : 'This folder is empty'}
                </EmptyMessage>
              ) : (
                filteredNavigationItems.map((item) => (
                  'templates' in item ? (
                    // Enhanced Folder Item with pin state
                    <FolderItem
                      key={`folder-${item.id}`}
                      folder={item}
                      type={navigation.getItemType(item)}
                      enableNavigation={true}
                      onNavigateToFolder={navigation.navigateToFolder}
                      onTogglePin={handleTogglePin}
                      onEditFolder={handleEditFolder}
                      onDeleteFolder={handleDeleteFolder}
                      onUseTemplate={useTemplate}
                      onEditTemplate={editTemplate}
                      onDeleteTemplate={handleDeleteTemplate}
                      organizations={organizations}
                      showPinControls={true}
                      showEditControls={navigation.getItemType(item) === 'user'}
                      showDeleteControls={navigation.getItemType(item) === 'user'}
                      pinnedFolderIds={allPinnedFolderIds} // NEW: Pass pinned IDs
                    />
                  ) : (
                    // Enhanced Template Item with pin support
                    <TemplateItem
                      key={`template-${item.id}`}
                      template={item}
                      type={navigation.getItemType(item)}
                      onUseTemplate={useTemplate}
                      onEditTemplate={editTemplate}
                      onDeleteTemplate={handleDeleteTemplate}
                      onTogglePin={handleToggleTemplatePin}
                      showPinControls={true}
                      showEditControls={navigation.getItemType(item) === 'user'}
                      showDeleteControls={navigation.getItemType(item) === 'user'}
                    />
                  )
                ))
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
                {/* NEW: Show count of pinned folders */}
                {allPinnedFolders.length > 0 && (
                  <span className="jd-ml-1 jd-text-xs jd-bg-primary/10 jd-text-primary jd-px-1.5 jd-py-0.5 jd-rounded-full">
                    {allPinnedFolders.length}
                  </span>
                )}
              </div>
              <Button variant="secondary" size="sm" className="jd-h-7 jd-px-2 jd-text-xs" onClick={openBrowseMoreFolders}>
                {getMessage('browseMore', undefined, 'Browse More')}
              </Button>
            </div>

            <div className="jd-space-y-1 jd-px-2 jd-max-h-96 jd-overflow-y-auto">
              {allPinnedFolders.length === 0 ? (
                <EmptyMessage>
                  {getMessage('noPinnedTemplates', undefined, 'No pinned templates. Pin your favorites for quick access.')}
                </EmptyMessage>
              ) : (
                <>
                  {/* User pinned folders (including nested ones) */}
                  {filteredPinned.user.map(folder => (
                    <FolderItem
                      key={`pinned-user-${folder.id}`}
                      folder={folder}
                      type="user"
                      enableNavigation={false} // Tree expansion mode for pinned
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
                      pinnedFolderIds={allPinnedFolderIds} // NEW: Pass pinned IDs
                    />
                  ))}
                  
                  {/* Organization pinned folders (including nested ones) */}
                  {filteredPinned.organization.map(folder => (
                    <FolderItem
                      key={`pinned-org-${folder.id}`}
                      folder={folder}
                      type="organization"
                      enableNavigation={false} // Tree expansion mode for pinned
                      onTogglePin={handleTogglePin}
                      onUseTemplate={useTemplate}
                      organizations={organizations}
                      showPinControls={true}
                      showEditControls={false}
                      showDeleteControls={false}
                      pinnedFolderIds={allPinnedFolderIds} // NEW: Pass pinned IDs
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