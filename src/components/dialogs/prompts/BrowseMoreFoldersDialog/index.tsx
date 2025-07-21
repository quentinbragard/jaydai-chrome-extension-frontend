import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import {
  useUserFolders,
  useOrganizationFolders,
  usePinnedFolders,
  useFolderMutations,
  useTemplateMutations,
  useTemplateActions,
  useUnorganizedTemplates
} from '@/hooks/prompts';
import { FolderItem } from '@/components/prompts/folders/FolderItem';
import { FolderSearch } from '@/components/prompts/folders/FolderSearch';
import { TemplateItem } from '@/components/prompts/templates/TemplateItem';
import { Template } from '@/types/prompts/templates';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getMessage } from '@/core/utils/i18n';
import { useOrganizations } from '@/hooks/organizations';
import { LoadingState } from '@/components/panels/TemplatesPanel/LoadingState';
import { EmptyMessage } from '@/components/panels/TemplatesPanel/EmptyMessage';
import { useFolderSearch } from '@/hooks/prompts/utils/useFolderSearch';

export const BrowseMoreFoldersDialog: React.FC = () => {
  const { isOpen, dialogProps, close } = useDialog(
    DIALOG_TYPES.BROWSE_MORE_FOLDERS
  );

  const { data: userFolders = [], isLoading: loadingUser } = useUserFolders();
  const { data: organizationFolders = [], isLoading: loadingOrg } = useOrganizationFolders();
  const { data: organizations = [] } = useOrganizations();
  const { data: pinnedData, refetch: refetchPinned } = usePinnedFolders();
  const { toggleFolderPin } = useFolderMutations();
  const { toggleTemplatePin } = useTemplateMutations();
  const { useTemplate } = useTemplateActions();
  const { data: unorganizedTemplates = [], isLoading: loadingUnorganized } = useUnorganizedTemplates();

  const pinnedFolderIds = useMemo(() => pinnedData?.pinnedIds || [], [pinnedData]);
  const [localPinnedIds, setLocalPinnedIds] = useState<number[]>(pinnedFolderIds);

  useEffect(() => {
    setLocalPinnedIds(pinnedFolderIds);
  }, [pinnedFolderIds]);

  const allFolders = organizationFolders;
  const {
    searchQuery,
    setSearchQuery,
    filteredFolders,
    filteredTemplates,
    clearSearch
  } = useFolderSearch(allFolders, unorganizedTemplates);

  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const toggleExpanded = useCallback((id: number) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);


  const handleTogglePin = useCallback(
    async (
      folderId: number,
      isPinned: boolean,
      type: 'user' | 'organization' | 'company'
    ) => {
      // Optimistically update UI
      setLocalPinnedIds(prev =>
        isPinned ? prev.filter(id => id !== folderId) : [...prev, folderId]
      );

      try {
        await toggleFolderPin.mutateAsync({ folderId, isPinned, type });
        refetchPinned();
      } catch (error) {
        console.error('Error toggling pin:', error);
        // Revert on error
        setLocalPinnedIds(prev =>
          isPinned ? [...prev, folderId] : prev.filter(id => id !== folderId)
        );
      }
    },
    [toggleFolderPin, refetchPinned]
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

  // Add pinned status based on localPinnedIds
  const foldersWithPin = useMemo(() => {
    return filteredFolders.map(f => ({
      ...f,
      is_pinned: localPinnedIds.includes(f.id)
    }));
  }, [filteredFolders, localPinnedIds]);

  // Close the browse dialog when a template is used
  const handleUseTemplateFromDialog = useCallback(
    (template: Template) => {
      close();
      useTemplate(template);
    },
    [close, useTemplate]
  );

  if (!isOpen) return null;

  const loading = loadingUser || loadingOrg || loadingUnorganized;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title={getMessage('browseFoldersTitle', undefined, 'Browse Folders')}
      className="jd-max-w-lg"
    >
      <TooltipProvider>
        <FolderSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholderText={getMessage('searchFoldersPlaceholder', undefined, 'Search folders...')}
          onReset={clearSearch}
        />
        <Separator />
        {searchQuery.trim() ? (
          <div className="jd-overflow-y-auto jd-max-h-[70vh]">
            {loading ? (
              <LoadingState
                message={getMessage('loadingFoldersGeneric', undefined, 'Loading folders...')}
              />
            ) : foldersWithPin.length === 0 && filteredTemplates.length === 0 ? (
              <EmptyMessage>
                {getMessage('noFoldersOrTemplatesFound', undefined, 'No folders or templates found')}
              </EmptyMessage>
            ) : (
              <div className="jd-space-y-1 jd-px-2">
                {foldersWithPin.map(folder => (
                  <FolderItem
                    key={`browse-folder-${folder.id}`}
                    folder={folder}
                    type={folder.type as any}
                    enableNavigation={false}
                    onUseTemplate={handleUseTemplateFromDialog}
                    onToggleExpand={toggleExpanded}
                    isExpanded={expandedFolders.has(folder.id)}
                    onTogglePin={(id, pinned) =>
                      handleTogglePin(id, pinned, folder.type as any)
                    }
                    onToggleTemplatePin={handleToggleTemplatePin}
                    organizations={organizations}
                    showPinControls={true}
                    showEditControls={false}
                    showDeleteControls={false}
                    pinnedFolderIds={localPinnedIds}
                  />
                ))}
                {filteredTemplates.map(template => (
                  (template.type !== 'user') &&
                  <TemplateItem
                    key={`browse-template-${template.id}`}
                    template={template}
                    type="user"
                    onUseTemplate={handleUseTemplateFromDialog}
                    onTogglePin={(id, pinned) => handleToggleTemplatePin(id, pinned, 'user')}
                    showEditControls={false}
                    showDeleteControls={false}
                    showPinControls={true}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="jd-overflow-y-auto jd-max-h-[70vh]">
            {loading ? (
              <LoadingState message={getMessage('loadingFoldersGeneric', undefined, 'Loading folders...')} />
            ) : organizationFolders.length === 0 && unorganizedTemplates.length === 0 ? (
              <EmptyMessage>
                {getMessage('folderEmpty', undefined, 'This folder is empty')}
              </EmptyMessage>
            ) : (
              <div className="jd-space-y-1 jd-px-2">
                {organizationFolders.map(folder => (
                  <FolderItem
                    key={`org-folder-${folder.id}`}
                    folder={folder}
                    type="organization"
                    enableNavigation={false}
                    onToggleExpand={toggleExpanded}
                    isExpanded={expandedFolders.has(folder.id)}
                    onTogglePin={(id, pinned) => handleTogglePin(id, pinned, 'organization')}
                    onToggleTemplatePin={handleToggleTemplatePin}
                    onUseTemplate={handleUseTemplateFromDialog}
                    organizations={organizations}
                    showPinControls={true}
                    showEditControls={false}
                    showDeleteControls={false}
                    pinnedFolderIds={localPinnedIds}
                  />
                ))}
                {unorganizedTemplates.map(template => (
                  <TemplateItem
                    key={`org-template-${template.id}`}
                    template={template}
                    type="user"
                    onUseTemplate={handleUseTemplateFromDialog}
                    onTogglePin={(id, pinned) => handleToggleTemplatePin(id, pinned, 'user')}
                    showEditControls={false}
                    showDeleteControls={false}
                    showPinControls={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </TooltipProvider>
    </BaseDialog>
  );
};

export default BrowseMoreFoldersDialog;
