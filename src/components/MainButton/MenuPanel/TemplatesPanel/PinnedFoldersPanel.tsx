import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Plus, BookTemplate, Folder, Users, ChevronDown } from "lucide-react";
import { Template, TemplateFolder } from './types';
import SubFolder from './SubFolder';

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
  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium flex items-center">
          <FileText className="mr-2 h-4 w-4" />
          {chrome.i18n.getMessage('templates')}
        </CardTitle>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCreateTemplate}
            className="h-7 px-2 text-xs"
            title={chrome.i18n.getMessage('createTemplate')}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {chrome.i18n.getMessage('newTemplate')}
          </Button>
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="p-0">
        <div 
          className="overflow-y-auto py-1" 
          style={{ maxHeight }}
        >
          {loading ? (
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
                    onClick={openBrowseOfficialFolders}
                  >
                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                    {chrome.i18n.getMessage('browseMore')}
                  </Button>
                </div>
                
                {/* Pinned official folders */}
                {pinnedOfficialFolders && pinnedOfficialFolders.length > 0 ? (
                  pinnedOfficialFolders.map(folder => (
                    <SubFolder
                      key={`official-folder-${folder.id}`}
                      folder={folder}
                      onUseTemplate={onUseTemplate}
                      onEditTemplate={onEditTemplate}
                      onDeleteTemplate={onDeleteTemplate}
                      type="official"
                      isPinned={true}
                      onTogglePin={(folderId, isPinned, e) => handleTogglePin(folderId, isPinned, 'official')}
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
                    onClick={openBrowseOrganizationFolders}
                  >
                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                    {chrome.i18n.getMessage('browseMore')}
                  </Button>
                </div>
                
                {/* Pinned organization folders */}
                {pinnedOrganizationFolders && pinnedOrganizationFolders.length > 0 ? (
                  pinnedOrganizationFolders.map(folder => (
                    <SubFolder
                      key={`org-folder-${folder.id}`}
                      folder={folder}
                      onUseTemplate={onUseTemplate}
                      onEditTemplate={onEditTemplate}
                      onDeleteTemplate={onDeleteTemplate}
                      type="organization"
                      isPinned={true}
                      onTogglePin={(folderId, isPinned, e) => handleTogglePin(folderId, isPinned, 'organization')}
                    />
                  ))
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    No pinned organization templates. Click 'Browse More' to add some.
                  </div>
                )}
              </div>

              {/* User Templates Section */}
              {userFolders && userFolders.length > 0 && (
                <div className="p-2 border-t">
                  <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                    <Folder className="mr-2 h-4 w-4" />
                    {chrome.i18n.getMessage('myTemplates')}
                  </div>
                  
                  {/* User Template Folders */}
                  {userFolders.map(folder => (
                    <SubFolder
                      key={`user-folder-${folder.id}`}
                      folder={folder}
                      onUseTemplate={onUseTemplate}
                      onEditTemplate={onEditTemplate}
                      onDeleteTemplate={onDeleteTemplate}
                      type="user"
                    />
                  ))}
                </div>
              )}
              
              {/* Empty state - show when no templates or folders of any kind are found */}
              {pinnedOfficialFolders && pinnedOfficialFolders.length === 0 && 
               pinnedOrganizationFolders && pinnedOrganizationFolders.length === 0 && 
               userFolders && userFolders.length === 0 && (
                <div className="py-8 px-4 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">{chrome.i18n.getMessage('noTemplates')}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onCreateTemplate}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {chrome.i18n.getMessage('createFirstTemplate')}
                  </Button>
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