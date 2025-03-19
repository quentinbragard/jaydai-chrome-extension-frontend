import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pin, PinOff } from "lucide-react";
import FolderTree from './FolderTree';
import { TemplateFolder, Template } from './types';

interface BrowseMoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officialFolders: TemplateFolder[];
  organizationFolders: TemplateFolder[];
  pinnedOfficialFolderIds: number[];
  pinnedOrganizationFolderIds: number[];
  onPinFolder: (folderId: number, isOfficial: boolean) => Promise<void>;
  onUnpinFolder: (folderId: number, isOfficial: boolean) => Promise<void>;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
}

const BrowseMoreModal: React.FC<BrowseMoreModalProps> = ({
  open,
  onOpenChange,
  officialFolders,
  organizationFolders,
  pinnedOfficialFolderIds,
  pinnedOrganizationFolderIds,
  onPinFolder,
  onUnpinFolder,
  expandedFolders,
  onToggleFolder,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
}) => {
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
                  <div key={`official-folder-${folder.id}`} className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{folder.name}</span>
                      {pinnedOfficialFolderIds.includes(folder.id) ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onUnpinFolder(folder.id, true)}
                          className="h-7 px-2 text-xs"
                        >
                          <PinOff className="h-3.5 w-3.5 mr-1" />
                          {chrome.i18n.getMessage('unpinFolder')}
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onPinFolder(folder.id, true)}
                          className="h-7 px-2 text-xs"
                        >
                          <Pin className="h-3.5 w-3.5 mr-1" />
                          {chrome.i18n.getMessage('pinFolder')}
                        </Button>
                      )}
                    </div>
                    <FolderTree
                      folder={folder}
                      isPinned={pinnedOfficialFolderIds.includes(folder.id)}
                      expandedFolders={expandedFolders}
                      onToggleFolder={onToggleFolder}
                      onUseTemplate={onUseTemplate}
                      onEditTemplate={onEditTemplate}
                      onDeleteTemplate={onDeleteTemplate}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Organization Templates Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{chrome.i18n.getMessage('organizationTemplates')}</h3>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                {organizationFolders.length > 0 ? (
                  organizationFolders.map(folder => (
                    <div key={`org-folder-${folder.id}`} className="border rounded-md p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{folder.name}</span>
                        {pinnedOrganizationFolderIds.includes(folder.id) ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onUnpinFolder(folder.id, false)}
                            className="h-7 px-2 text-xs"
                          >
                            <PinOff className="h-3.5 w-3.5 mr-1" />
                            {chrome.i18n.getMessage('unpinFolder')}
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onPinFolder(folder.id, false)}
                            className="h-7 px-2 text-xs"
                          >
                            <Pin className="h-3.5 w-3.5 mr-1" />
                            {chrome.i18n.getMessage('pinFolder')}
                          </Button>
                        )}
                      </div>
                      <FolderTree
                        folder={folder}
                        isPinned={pinnedOrganizationFolderIds.includes(folder.id)}
                        expandedFolders={expandedFolders}
                        onToggleFolder={onToggleFolder}
                        onUseTemplate={onUseTemplate}
                        onEditTemplate={onEditTemplate}
                        onDeleteTemplate={onDeleteTemplate}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    No organization templates available
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BrowseMoreModal;