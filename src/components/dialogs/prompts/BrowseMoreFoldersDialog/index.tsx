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
  const { searchQuery, setSearchQuery, filteredFolders, clearSearch } = useFolderSearch(allFolders);

  // Filter unorganized templates based on search query
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return unorganizedTemplates;
    const q = searchQuery.toLowerCase();
    return unorganizedTemplates.filter(t =>
      (t.type !== 'user') &&
      (t.title || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  }, [unorganizedTemplates, searchQuery]);

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
      title="Browse Folders"
      className="jd-max-w-lg"
    >
      <TooltipProvider>
        <FolderSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholderText="Search folders..."
          onReset={clearSearch}
        />
        <Separator />
          <div className="jd-overflow-y-auto jd-max-h-[70vh]">
            {loading ? (
              <LoadingState message="Loading folders..." />
            ) : foldersWithPin.length === 0 && filteredTemplates.length === 0 ? (
              <EmptyMessage>No folders or templates found</EmptyMessage>
            ) : (
              <div className="jd-space-y-1 jd-px-2">
                {foldersWithPin.map(folder => (
                  <FolderItem
                    key={`browse-folder-${folder.id}`}
                    folder={folder}
                    type={folder.type as any}
                    enableNavigation={false}
                    onUseTemplate={handleUseTemplateFromDialog}
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
      </TooltipProvider>
    </BaseDialog>
  );
};

export default BrowseMoreFoldersDialog;
