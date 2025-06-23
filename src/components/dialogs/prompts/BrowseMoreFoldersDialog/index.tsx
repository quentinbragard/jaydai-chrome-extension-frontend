import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import {
  useUserFolders,
  useOrganizationFolders,
  usePinnedFolders,
  useFolderMutations,
  useTemplateActions
} from '@/hooks/prompts';
import { FolderItem } from '@/components/prompts/folders/FolderItem';
import { FolderSearch } from '@/components/prompts/folders/FolderSearch';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useOrganizations } from '@/hooks/organizations';
import { LoadingState } from '@/components/panels/TemplatesPanel/LoadingState';
import { EmptyMessage } from '@/components/panels/TemplatesPanel/EmptyMessage';
import { useFolderSearch } from '@/hooks/prompts/utils/useFolderSearch';

export const BrowseMoreFoldersDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.BROWSE_MORE_FOLDERS);

  const { data: userFolders = [], isLoading: loadingUser } = useUserFolders();
  const { data: organizationFolders = [], isLoading: loadingOrg } = useOrganizationFolders();
  const { data: organizations = [] } = useOrganizations();
  const { data: pinnedData, refetch: refetchPinned } = usePinnedFolders();
  const { toggleFolderPin } = useFolderMutations();
  const { useTemplate } = useTemplateActions();

  const pinnedFolderIds = useMemo(() => pinnedData?.pinnedIds || [], [pinnedData]);
  const [localPinnedIds, setLocalPinnedIds] = useState<number[]>(pinnedFolderIds);

  useEffect(() => {
    setLocalPinnedIds(pinnedFolderIds);
  }, [pinnedFolderIds]);

  const allFolders = useMemo(() => [...userFolders, ...organizationFolders], [userFolders, organizationFolders]);
  const { searchQuery, setSearchQuery, filteredFolders, clearSearch } = useFolderSearch(allFolders);

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

  // Add pinned status based on localPinnedIds
  const foldersWithPin = useMemo(() => {
    return filteredFolders.map(f => ({
      ...f,
      is_pinned: localPinnedIds.includes(f.id)
    }));
  }, [filteredFolders, localPinnedIds]);

  if (!isOpen) return null;

  const loading = loadingUser || loadingOrg;

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
          ) : foldersWithPin.length === 0 ? (
            <EmptyMessage>No folders found</EmptyMessage>
          ) : (
            <div className="jd-space-y-1 jd-px-2">
              {foldersWithPin.map(folder => (
                <FolderItem
                  key={`browse-folder-${folder.id}`}
                  folder={folder}
                  type={folder.type as any}
                  enableNavigation={false}
                  onUseTemplate={useTemplate}
                  onTogglePin={(id, pinned) =>
                    handleTogglePin(id, pinned, folder.type as any)
                  }
                  organizations={organizations}
                  showPinControls={true}
                  showEditControls={false}
                  showDeleteControls={false}
                  pinnedFolderIds={localPinnedIds}
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
