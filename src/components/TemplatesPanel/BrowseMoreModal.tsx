import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import FolderTree from './FolderTree';
import { TemplateFolder } from './types';
import { userApi } from '@/api/UserApi';
import { toast } from 'sonner';

interface BrowseMoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officialFolders: TemplateFolder[];
  organizationFolders: TemplateFolder[];
  pinnedOfficialFolderIds: number[];
  pinnedOrganizationFolderIds: number[];
  onFoldersPinned: (pinnedOfficialFolderIds: number[], pinnedOrganizationFolderIds: number[]) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onUseTemplate: (template: any) => void;
  onEditTemplate: (template: any) => void;
  onDeleteTemplate: (template: any, e: React.MouseEvent) => void;
}

const BrowseMoreModal: React.FC<BrowseMoreModalProps> = ({
  open,
  onOpenChange,
  officialFolders,
  organizationFolders,
  pinnedOfficialFolderIds,
  pinnedOrganizationFolderIds,
  onFoldersPinned,
  expandedFolders,
  onToggleFolder,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
}) => {
  const handlePinFolder = async (folderId: number, isOfficial: boolean) => {
    try {
      const response = await userApi.saveUserMetadata({
        pinned_official_folder_ids: isOfficial 
          ? [...pinnedOfficialFolderIds, folderId]
          : pinnedOfficialFolderIds,
        pinned_organization_folder_ids: isOfficial
          ? pinnedOrganizationFolderIds
          : [...pinnedOrganizationFolderIds, folderId]
      });

      if (response.success) {
        toast.success(chrome.i18n.getMessage('pinFolder'));
        onFoldersPinned(
          isOfficial ? [...pinnedOfficialFolderIds, folderId] : pinnedOfficialFolderIds,
          isOfficial ? pinnedOrganizationFolderIds : [...pinnedOrganizationFolderIds, folderId]
        );
      } else {
        toast.error('Failed to pin folder');
      }
    } catch (error) {
      console.error('Error pinning folder:', error);
      toast.error('Failed to pin folder');
    }
  };

  const handleUnpinFolder = async (folderId: number, isOfficial: boolean) => {
    try {
      const response = await userApi.saveUserMetadata({
        pinned_official_folder_ids: isOfficial 
          ? pinnedOfficialFolderIds.filter(id => id !== folderId)
          : pinnedOfficialFolderIds,
        pinned_organization_folder_ids: isOfficial
          ? pinnedOrganizationFolderIds
          : pinnedOrganizationFolderIds.filter(id => id !== folderId)
      });

      if (response.success) {
        toast.success(chrome.i18n.getMessage('unpinFolder'));
        onFoldersPinned(
          isOfficial ? pinnedOfficialFolderIds.filter(id => id !== folderId) : pinnedOfficialFolderIds,
          isOfficial ? pinnedOrganizationFolderIds : pinnedOrganizationFolderIds.filter(id => id !== folderId)
        );
      } else {
        toast.error('Failed to unpin folder');
      }
    } catch (error) {
      console.error('Error unpinning folder:', error);
      toast.error('Failed to unpin folder');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col z-50 border-primary/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle>{chrome.i18n.getMessage('browseMoreTitle')}</DialogTitle>
          <DialogDescription>
            {chrome.i18n.getMessage('browseMoreDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 flex-grow overflow-hidden">
          {/* Official Templates Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{chrome.i18n.getMessage('officialTemplates')}</h3>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                {officialFolders.map(folder => (
                  <FolderTree
                    key={`official-folder-${folder.path}`}
                    folder={folder}
                    isPinned={pinnedOfficialFolderIds.includes(folder.id)}
                    onTogglePin={() => pinnedOfficialFolderIds.includes(folder.id)
                      ? handleUnpinFolder(folder.id, true)
                      : handlePinFolder(folder.id, true)
                    }
                    expandedFolders={expandedFolders}
                    onToggleFolder={onToggleFolder}
                    onUseTemplate={onUseTemplate}
                    onEditTemplate={onEditTemplate}
                    onDeleteTemplate={onDeleteTemplate}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Organization Templates Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{chrome.i18n.getMessage('organizationTemplates')}</h3>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                {organizationFolders.map(folder => (
                  <FolderTree
                    key={`org-folder-${folder.path}`}
                    folder={folder}
                    isPinned={pinnedOrganizationFolderIds.includes(folder.id)}
                    onTogglePin={() => pinnedOrganizationFolderIds.includes(folder.id)
                      ? handleUnpinFolder(folder.id, false)
                      : handlePinFolder(folder.id, false)
                    }
                    expandedFolders={expandedFolders}
                    onToggleFolder={onToggleFolder}
                    onUseTemplate={onUseTemplate}
                    onEditTemplate={onEditTemplate}
                    onDeleteTemplate={onDeleteTemplate}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BrowseMoreModal; 