// src/components/panels/BrowseTemplatesPanel/BrowseTemplatesPanel.tsx
import React, { useCallback, memo, useState, useEffect } from 'react';
import { FolderOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import BasePanel from '../BasePanel';
import {
  useAllFoldersOfType,
  useFolderMutations,
  useTemplateActions,
  usePinnedFolders,
  usePinnedTemplates,
  useTemplateMutations
} from '@/hooks/prompts';
import { useOrganizations } from '@/hooks/organizations';
import { FolderSearch } from '@/components/prompts/folders';
import { LoadingState } from '@/components/panels/TemplatesPanel/LoadingState';
import { EmptyMessage } from '@/components/panels/TemplatesPanel/EmptyMessage';
import { FolderItem } from '@/components/prompts/folders/FolderItem';
import { TemplateItem } from '@/components/prompts/templates/TemplateItem';
import { useFolderSearch } from '@/hooks/prompts/utils/useFolderSearch';
import { Template, TemplateFolder } from '@/types/prompts/templates';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { getMessage } from '@/core/utils/i18n';

interface BrowseTemplatesPanelProps {
  folderType: 'organization' | 'company';
  pinnedFolderIds?: number[];
  onPinChange?: (folderId: number, isPinned: boolean) => Promise<void>;
  onBackToTemplates: () => void;
  maxHeight?: string;
}

/**
 * Unified Browse Templates Panel using the new unified components
 * Provides consistent display for browsing and pinning template folders
 */
const BrowseTemplatesPanel: React.FC<BrowseTemplatesPanelProps> = ({
  folderType,
  pinnedFolderIds = [],
  onPinChange,
  onBackToTemplates,
  maxHeight = '75vh'
}) => {
  // Local state to track pinned folders (initialized with prop)
  const [localPinnedIds, setLocalPinnedIds] = useState<number[]>(pinnedFolderIds);
  
  // If the pinnedFolderIds prop changes, update our local state
  useEffect(() => {
    setLocalPinnedIds(pinnedFolderIds);
  }, [pinnedFolderIds]);
  
  // Fetch all folders of this type using React Query
  const {
    data: folders = [],
    isLoading,
    error,
    refetch: refetchFolders
  } = useAllFoldersOfType(folderType);

  const { data: organizations = [] } = useOrganizations();

  // Get pinned folders query client for invalidation
  const { refetch: refetchPinnedFolders } = usePinnedFolders();
  
  // Use folder search hook for filtering
  const {
    searchQuery,
    setSearchQuery,
    filteredFolders,
    clearSearch
  } = useFolderSearch(folders);

  useEffect(() => {
    trackEvent(EVENTS.TEMPLATE_SEARCH, { search_content: searchQuery });
  }, [searchQuery]);
  
  // Get folder mutations
  const { toggleFolderPin } = useFolderMutations();

  // Pinned template ids and pin mutation for templates
  const { data: pinnedTemplateIds = [] } = usePinnedTemplates();
  const { toggleTemplatePin } = useTemplateMutations();

  const pinnedTemplates = React.useMemo(() => {
    if (!pinnedTemplateIds.length) return [] as Template[];
    const templates: Template[] = [];
    const traverse = (list: TemplateFolder[]) => {
      list.forEach(folder => {
        if (folder.templates) {
          folder.templates.forEach(t => {
            if (pinnedTemplateIds.includes(t.id)) {
              templates.push(t);
            }
          });
        }
        if (folder.Folders) {
          traverse(folder.Folders);
        }
      });
    };
    traverse(folders);
    return templates;
  }, [pinnedTemplateIds, folders]);
  
  // Template actions
  const { useTemplate } = useTemplateActions();
  
  // Handle toggling pin status
  const handleTogglePin = useCallback(async (folderId: number, isPinned: boolean) => {
    // Update local state immediately for better UX
    if (isPinned) {
      // If currently pinned, remove from local pinned IDs
      setLocalPinnedIds(prev => prev.filter(id => id !== folderId));
    } else {
      // If not pinned, add to local pinned IDs
      setLocalPinnedIds(prev => [...prev, folderId]);
    }
    
    try {
      // Call the mutation to update the backend
      // Use the original folderType (don't map it)
      await toggleFolderPin.mutateAsync({
        folderId,
        isPinned,
        type: folderType
      });
      
      // Call the onPinChange prop if provided (after successful backend update)
      if (onPinChange) {
        await onPinChange(folderId, isPinned);
      }
      
      // Invalidate the pinned folders query to ensure fresh data
      refetchPinnedFolders();
    } catch (error) {
      console.error('Error toggling pin:', error);
      // Revert local state on error
      if (isPinned) {
        setLocalPinnedIds(prev => [...prev, folderId]);
      } else {
        setLocalPinnedIds(prev => prev.filter(id => id !== folderId));
      }
    }
  }, [toggleFolderPin, folderType, onPinChange, refetchPinnedFolders]);

  // Toggle pin for templates
  const handleToggleTemplatePin = useCallback(
    async (templateId: number, isPinned: boolean) => {
      try {
        await toggleTemplatePin.mutateAsync({ templateId, isPinned, type: folderType });
      } catch (error) {
        console.error('Error toggling template pin:', error);
      }
    },
    [toggleTemplatePin, folderType]
  );

  // Add pinned status to folders using our local state
  const foldersWithPinStatus = React.useMemo(() => {
    if (!folders?.length) return [];
    
    return folders.map(folder => ({
      ...folder,
      is_pinned: localPinnedIds.includes(folder.id)
    }));
  }, [folders, localPinnedIds]);

  return (
    <BasePanel
      title={folderType === 'company' ? getMessage('company_templates_cta_title', undefined, 'Company Templates') : getMessage('organization_templates_title', undefined, 'Organization Templates')}
      icon={FolderOpen}
      showBackButton={true}
      onBack={onBackToTemplates}
      className="jd-w-80"
      maxHeight={maxHeight}
    >
      <TooltipProvider>
        {/* Search input */}
        <FolderSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholderText={`Search ${folderType} folders...`}
          onReset={clearSearch}
        />
        
        <Separator />
        
        {/* Content area with conditional rendering based on state */}
        <div className="jd-overflow-y-auto">
          {isLoading ? (
            <LoadingState message={`Loading ${folderType} folders...`} />
          ) : error ? (
            <EmptyMessage>
              {getMessage('error_loading_folders', undefined, 'Error loading folders')}: {error instanceof Error ? error.message : 'Unknown error'}
            </EmptyMessage>
          ) : (
            <>
              {pinnedTemplates.length > 0 && (
                <div className="jd-space-y-1 jd-px-2 jd-mb-2">
                  {pinnedTemplates.map(t => (
                    <TemplateItem
                      key={`pinned-template-${t.id}`}
                      template={t}
                      type={folderType}
                      onUseTemplate={useTemplate}
                      onTogglePin={handleToggleTemplatePin}
                      showPinControls={true}
                      showEditControls={false}
                      showDeleteControls={false}
                      organizations={organizations}
                    />
                  ))}
                  <Separator />
                </div>
              )}
              {filteredFolders.length === 0 ? (
                <EmptyMessage>
                  {searchQuery
                    ? getMessage('no_folders_matching', undefined, 'No folders matching') + ` "${searchQuery}"`
                    : getMessage('no_folders_available', undefined, 'No folders available')}
                </EmptyMessage>
              ) : (
                <div className="jd-space-y-1 jd-px-2">
                  {foldersWithPinStatus.map(folder => (
                    <FolderItem
                      key={`${folderType}-folder-${folder.id}`}
                      folder={folder}
                      type={folderType}
                      enableNavigation={false}
                      onUseTemplate={useTemplate}
                      onTogglePin={handleTogglePin}
                      onToggleTemplatePin={handleToggleTemplatePin}
                      organizations={organizations}
                      showPinControls={true}
                      showEditControls={false}
                      showDeleteControls={false}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </TooltipProvider>
    </BasePanel>
  );
};

export default memo(BrowseTemplatesPanel);