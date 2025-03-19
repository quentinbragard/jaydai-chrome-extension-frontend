import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Plus, X, BookTemplate, Folder, Users, ChevronDown } from "lucide-react";
import { useTemplates } from './useTemplates';
import { TemplatesPanelProps, Template } from './types';
import { TemplateItem } from './TemplateItem';
import FolderTree from './FolderTree';
import TemplateDialog from './TemplateDialog';
import PlaceholderEditor from './PlaceholderEditor';
import BrowseMoreModal from './BrowseMoreModal';
import { cn } from "@/core/utils/classNames";
import { userApi } from '@/api/UserApi';

const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ 
  onClose, 
  maxHeight = '400px',
  onPlaceholderEditorOpenChange
}) => {
  const {
    templateCollection,
    loading,
    expandedFolders,
    editDialogOpen,
    setEditDialogOpen,
    currentTemplate,
    templateFormData,
    setTemplateFormData,
    placeholderEditorOpen,
    setPlaceholderEditorOpen,
    selectedTemplate,
    toggleFolder,
    handleUseTemplate,
    handleFinalizeTemplate,
    openEditDialog,
    handleSaveTemplate,
    handleDeleteTemplate,
    captureCurrentPromptAsTemplate,
    handlePinFolder,
    handleUnpinFolder
  } = useTemplates();

  const [browseMoreOpen, setBrowseMoreOpen] = useState(false);
  const [pinnedOfficialFolderIds, setPinnedOfficialFolderIds] = useState<number[]>([]);
  const [pinnedOrganizationFolderIds, setPinnedOrganizationFolderIds] = useState<number[]>([]);

  // Load pinned folders from user metadata
  useEffect(() => {
    const loadPinnedFolders = async () => {
      try {
        const response = await userApi.getUserMetadata();
        if (response.success && response.data) {
          setPinnedOfficialFolderIds(response.data.pinned_official_folder_ids || []);
          setPinnedOrganizationFolderIds(response.data.pinned_organization_folder_ids || []);
        }
      } catch (error) {
        console.error('Error loading pinned folders:', error);
      }
    };
    loadPinnedFolders();
  }, []);

  // Safely access template collections with fallbacks
  const officialTemplates = templateCollection?.officialTemplates?.templates || [];
  const officialFolders = templateCollection?.officialTemplates?.folders || [];
  const userTemplates = templateCollection?.userTemplates?.templates || [];
  const userFolders = templateCollection?.userTemplates?.folders || [];
  const organizationTemplates = templateCollection?.organizationTemplates?.templates || [];
  const organizationFolders = templateCollection?.organizationTemplates?.folders || [];

  // Filter folders based on pinned status
  const pinnedOfficialFolders = officialFolders.filter(folder => 
    pinnedOfficialFolderIds.includes(folder.id)
  );
  const pinnedOrganizationFolders = organizationFolders.filter(folder => 
    pinnedOrganizationFolderIds.includes(folder.id)
  );

  // Function to handle pinning a folder
  const handleFolderPin = async (folderId: number, isOfficial: boolean) => {
    try {
      const result = await handlePinFolder(
        folderId, 
        isOfficial, 
        pinnedOfficialFolderIds, 
        pinnedOrganizationFolderIds
      );
      
      if (result) {
        setPinnedOfficialFolderIds(result.pinnedOfficialFolderIds);
        setPinnedOrganizationFolderIds(result.pinnedOrganizationFolderIds);
      }
    } catch (error) {
      console.error('Error pinning folder:', error);
    }
  };
  
  // Function to handle unpinning a folder
  const handleFolderUnpin = async (folderId: number, isOfficial: boolean) => {
    try {
      const result = await handleUnpinFolder(
        folderId, 
        isOfficial, 
        pinnedOfficialFolderIds, 
        pinnedOrganizationFolderIds
      );
      
      if (result) {
        setPinnedOfficialFolderIds(result.pinnedOfficialFolderIds);
        setPinnedOrganizationFolderIds(result.pinnedOrganizationFolderIds);
      }
    } catch (error) {
      console.error('Error unpinning folder:', error);
    }
  };

  // Function to call handleUseTemplate with onClose callback
  const onTemplateClick = (template: Template) => {
    handleUseTemplate(template, onClose);
  };

  // Add a class when the placeholder editor is open to help with styles
  const templatesPanelClass = cn(
    "w-96 shadow-lg transition-all duration-300", 
    placeholderEditorOpen ? "editor-active opacity-30" : "opacity-100"
  );

  return (
    <>
      {!selectedTemplate && (
        <Card className={templatesPanelClass}>
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              {chrome.i18n.getMessage('templates')}
            </CardTitle>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={captureCurrentPromptAsTemplate}
                className="h-7 px-2 text-xs"
                title={chrome.i18n.getMessage('createTemplate')}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {chrome.i18n.getMessage('newTemplate')}
              </Button>
              {onClose && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
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
                  <p className="text-sm text-muted-foreground mt-2">{chrome.i18n.getMessage('loadingNotifications')}</p>
                </div>
              ) : (
                <div>
                  {/* Official Templates Section */}
                  {(officialTemplates.length > 0 || pinnedOfficialFolders.length > 0) && (
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
                          onClick={() => setBrowseMoreOpen(true)}
                        >
                          <ChevronDown className="h-3.5 w-3.5 mr-1" />
                          {chrome.i18n.getMessage('browseMore')}
                        </Button>
                      </div>
                      
                      {/* Pinned official folders */}
                      {pinnedOfficialFolders.map(folder => (
                        <FolderTree
                          key={`official-folder-${folder.id}`}
                          folder={folder}
                          isPinned={true}
                          expandedFolders={expandedFolders}
                          onToggleFolder={toggleFolder}
                          onUseTemplate={onTemplateClick}
                          onEditTemplate={openEditDialog}
                          onDeleteTemplate={handleDeleteTemplate}
                          onTogglePin={() => handleFolderUnpin(folder.id, true)}
                        />
                      ))}
                      
                      {/* Non-folder official templates */}
                      {officialTemplates
                        .filter(t => !t.folder_id) // Only show root-level templates
                        .map((template) => (
                          <TemplateItem 
                            key={`official-${template.id}`} 
                            template={template}
                            onUseTemplate={onTemplateClick}
                            onEditTemplate={openEditDialog}
                            onDeleteTemplate={handleDeleteTemplate}
                          />
                        ))
                      }
                    </div>
                  )}

                  {/* Organization Templates Section */}
                  {(organizationTemplates.length > 0 || pinnedOrganizationFolders.length > 0) && (
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
                          onClick={() => setBrowseMoreOpen(true)}
                        >
                          <ChevronDown className="h-3.5 w-3.5 mr-1" />
                          {chrome.i18n.getMessage('browseMore')}
                        </Button>
                      </div>
                      
                      {/* Pinned organization folders */}
                      {pinnedOrganizationFolders.map(folder => (
                        <FolderTree
                          key={`org-folder-${folder.id}`}
                          folder={folder}
                          isPinned={true}
                          expandedFolders={expandedFolders}
                          onToggleFolder={toggleFolder}
                          onUseTemplate={onTemplateClick}
                          onEditTemplate={openEditDialog}
                          onDeleteTemplate={handleDeleteTemplate}
                          onTogglePin={() => handleFolderUnpin(folder.id, false)}
                        />
                      ))}
                      
                      {/* Non-folder organization templates */}
                      {organizationTemplates
                        .filter(t => !t.folder_id) // Only show root-level templates
                        .map((template) => (
                          <TemplateItem 
                            key={`org-${template.id}`} 
                            template={template}
                            onUseTemplate={onTemplateClick}
                            onEditTemplate={openEditDialog}
                            onDeleteTemplate={handleDeleteTemplate}
                          />
                        ))
                      }
                    </div>
                  )}

                  {/* User Templates Section */}
                  {(userTemplates.length > 0 || userFolders.length > 0) && (
                    <div className="p-2 border-t">
                      <div className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                        <Folder className="mr-2 h-4 w-4" />
                        {chrome.i18n.getMessage('myTemplates')}
                      </div>
                      
                      {/* User Template Folders */}
                      {userFolders.map(folder => (
                        <FolderTree
                          key={`user-folder-${folder.id}`}
                          folder={folder}
                          expandedFolders={expandedFolders}
                          onToggleFolder={toggleFolder}
                          onUseTemplate={onTemplateClick}
                          onEditTemplate={openEditDialog}
                          onDeleteTemplate={handleDeleteTemplate}
                        />
                      ))}
                      
                      {/* Root-level user templates */}
                      {userTemplates
                        .filter(t => !t.folder_id)
                        .map(template => (
                          <TemplateItem
                            key={`user-${template.id}`}
                            template={template}
                            onUseTemplate={onTemplateClick}
                            onEditTemplate={openEditDialog}
                            onDeleteTemplate={handleDeleteTemplate}
                          />
                        ))}
                    </div>
                  )}
                  
                  {/* Empty state */}
                  {officialTemplates.length === 0 && 
                   userTemplates.length === 0 && 
                   organizationTemplates.length === 0 && 
                   pinnedOfficialFolders.length === 0 &&
                   pinnedOrganizationFolders.length === 0 && (
                    <div className="py-8 px-4 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                      <p className="text-sm text-muted-foreground">{chrome.i18n.getMessage('noTemplates')}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditDialog(null)}
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
      )}
      
      {/* Only render the dialog when it's open */}
      {editDialogOpen && (
        <TemplateDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          currentTemplate={currentTemplate}
          formData={templateFormData}
          onFormChange={setTemplateFormData}
          onSaveTemplate={handleSaveTemplate}
        />
      )}
      
      {/* Placeholder Editor Dialog */}
      {selectedTemplate && (
        <PlaceholderEditor
          open={placeholderEditorOpen}
          onOpenChange={(open) => {
            setPlaceholderEditorOpen(open);
            if (onPlaceholderEditorOpenChange) {
              onPlaceholderEditorOpenChange(open);
            }
            if (!open && onClose) {
              setTimeout(() => onClose(), 300);
            }
          }}
          templateContent={selectedTemplate.content}
          templateTitle={selectedTemplate.title}
          onComplete={(finalContent) => handleFinalizeTemplate(finalContent, onClose)}
        />
      )}

      {/* Browse More Modal */}
      <BrowseMoreModal
        open={browseMoreOpen}
        onOpenChange={setBrowseMoreOpen}
        officialFolders={officialFolders}
        organizationFolders={organizationFolders}
        pinnedOfficialFolderIds={pinnedOfficialFolderIds}
        pinnedOrganizationFolderIds={pinnedOrganizationFolderIds}
        onPinFolder={handleFolderPin}
        onUnpinFolder={handleFolderUnpin}
        expandedFolders={expandedFolders}
        onToggleFolder={toggleFolder}
        onUseTemplate={onTemplateClick}
        onEditTemplate={openEditDialog}
        onDeleteTemplate={handleDeleteTemplate}
      />
    </>
  );
};

export default TemplatesPanel;