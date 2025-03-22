import React from 'react';
import { Card, CardContent} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookTemplate, Folder as FolderIcon, Users, ChevronDown, RefreshCw, PlusCircle } from "lucide-react";
import { Template, TemplateFolder } from '@/types/templates';
import FolderItem from './FolderItem';
import { useTemplates } from '@/hooks/templates';
import { dialogManager } from '@/core/managers/DialogManager'; // Import dialogManager

interface PinnedFoldersPanelProps {
  pinnedOfficialFolders: TemplateFolder[];
  pinnedOrganizationFolders: TemplateFolder[];
  userFolders: TemplateFolder[];
  onUseTemplate: (template: Template) => void;
  onEditTemplate: (template: Template) => void;
  onDeleteTemplate: (template: Template, e: React.MouseEvent) => void;
  onCreateTemplate: () => void;
  openBrowseOfficialFolders: () => void;
  openBrowseOrganizationFolders: () => void;
  handleTogglePin: (folderId: number, isPinned: boolean, type: 'official' | 'organization') => Promise<void>;
  loading: boolean;
  maxHeight?: string;
}

const PinnedFoldersPanel: React.FC<PinnedFoldersPanelProps> = ({
  pinnedOfficialFolders,
  pinnedOrganizationFolders,
  userFolders,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCreateTemplate,
  openBrowseOfficialFolders,
  openBrowseOrganizationFolders,
  handleTogglePin,
  loading,
  maxHeight = '400px'
}) => {
  const { deleteFolder, refreshFolders } = useTemplates();
  
  // Add local timeout for loading state to prevent infinite loading
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);
  
  React.useEffect(() => {
    if (loading) {
      // Set a timeout to show loading indicator for max 5 seconds
      setLoadingTimeout(true);
      const timer = setTimeout(() => {
        setLoadingTimeout(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);
  
  // Determine if we should show loading state
  const showLoading = loading && loadingTimeout;

  const handleDeleteFolder = async (folderId: number) => {
    return await deleteFolder(folderId);
  };

  // Handle create template button click
  const handleCreateTemplate = () => {
    // Use dialogManager directly
    dialogManager.openDialog('createTemplate');
  };

  // Handle browse more button click
  const handleBrowseMore = (type: 'official' | 'organization') => {
    if (type === 'official') {
      openBrowseOfficialFolders();
    } else {
      openBrowseOrganizationFolders();
    }
  };

  return (
    <Card className="w-80 shadow-lg">
      <CardContent className="p-0">
        <div 
          className="overflow-y-auto py-1" 
          style={{ maxHeight }}
        >
          {showLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">
                {chrome.i18n.getMessage('loadingTemplates')}
              </p>
            </div>
          ) : (
            <div>
              {/* Official Templates Section */}
              <div className="p-2">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-2">
                  <div className="flex items-center">
                    <BookTemplate className="mr-2 h-4 w-4" />
                    {chrome.i18n.getMessage('officialTemplates')}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleBrowseMore('official')}
                  >
                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                    {chrome.i18n.getMessage('browseMore')}
                  </Button>
                </div>
                
                {/* Pinned official folders */}
                {pinnedOfficialFolders && pinnedOfficialFolders.length > 0 ? (
                  pinnedOfficialFolders.map(folder => (
                    <FolderItem
                      key={`official-folder-${folder.id}`}
                      folder={folder}
                      onUseTemplate={onUseTemplate}
                      onEditTemplate={onEditTemplate}
                      onDeleteTemplate={onDeleteTemplate}
                      type="official"
                      isPinned={true}
                      onTogglePin={(folderId, isPinned, e) => handleTogglePin(folderId, isPinned, 'official')}
                      onDeleteFolder={undefined} // Can't delete official folders
                    />
                  ))
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    No pinned official templates. Click 'Browse More' to add some.
                  </div>
                )}
              </div>

              {/* Organization Templates Section */}
              <div className="p-2 border-t">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-2">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    {chrome.i18n.getMessage('organizationTemplates')}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleBrowseMore('organization')}
                  >
                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                    {chrome.i18n.getMessage('browseMore')}
                  </Button>
                </div>
                
                {/* Pinned organization folders */}
                {pinnedOrganizationFolders && pinnedOrganizationFolders.length > 0 ? (
                  pinnedOrganizationFolders.map(folder => (
                    <FolderItem
                      key={`org-folder-${folder.id}`}
                      folder={folder}
                      onUseTemplate={onUseTemplate}
                      onEditTemplate={onEditTemplate}
                      onDeleteTemplate={onDeleteTemplate}
                      type="organization"
                      isPinned={true}
                      onTogglePin={(folderId, isPinned, e) => handleTogglePin(folderId, isPinned, 'organization')}
                      onDeleteFolder={undefined} // Can't delete organization folders as a regular user
                    />
                  ))
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    No pinned organization templates. Click 'Browse More' to add some.
                  </div>
                )}
              </div>

              {/* User Templates Section */}
              <div className="p-2 border-t">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-2">
                  <div className="flex items-center">
                    <FolderIcon className="mr-2 h-4 w-4" />
                    {chrome.i18n.getMessage('myTemplates')}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={handleCreateTemplate}
                    title={chrome.i18n.getMessage('newTemplate')}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* User Template Folders */}
                {userFolders && userFolders.length > 0 ? (
                  userFolders.map(folder => (
                    <FolderItem
                      key={`user-folder-${folder.id}`}
                      folder={folder}
                      onUseTemplate={onUseTemplate}
                      onEditTemplate={onEditTemplate}
                      onDeleteTemplate={onDeleteTemplate}
                      type="user"
                      onDeleteFolder={handleDeleteFolder}
                    />
                  ))
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    No user folders. Create a template with a new folder to get started.
                  </div>
                )}
              </div>
              
              {/* Empty state - show when no templates or folders of any kind are found */}
              {pinnedOfficialFolders.length === 0 && 
               pinnedOrganizationFolders.length === 0 && 
               userFolders.length === 0 && (
                <div className="py-8 px-4 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">{chrome.i18n.getMessage('noTemplates')}</p>
                  <div className="flex flex-col items-center justify-center gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCreateTemplate}
                      className="flex items-center w-full"
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      {chrome.i18n.getMessage('createFirstTemplate')}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={refreshFolders}
                      className="flex items-center mt-2"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PinnedFoldersPanel;