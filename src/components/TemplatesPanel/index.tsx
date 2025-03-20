import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Plus, X, BookTemplate, Folder, Users, ChevronDown } from "lucide-react";
import { useTemplates } from './useTemplates';
import { TemplatesPanelProps, Template, TemplateFolder } from './types';
import TemplateDialog from './TemplateDialog';
import PlaceholderEditor from './PlaceholderEditor';
import { cn } from "@/core/utils/classNames";
import { promptApi } from '@/api/PromptApi';
import SubFolder from './SubFolder';
import { toast } from 'sonner';
import BrowseFoldersDialog from './BrowseFoldersDialog';

const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ 
  onClose, 
  maxHeight = '400px',
  onPlaceholderEditorOpenChange
}) => {
  const {
    templates,
    loading: templatesLoading,
    expandedFolders,
    editDialogOpen,
    setEditDialogOpen,
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
  } = useTemplates();

  // Browse folders dialog state
  const [browseDialogOpen, setBrowseDialogOpen] = useState(false);
  const [browseFolderType, setBrowseFolderType] = useState<'official' | 'organization'>('official');
  
  // Pinned folders state
  const [pinnedOfficialFolderIds, setPinnedOfficialFolderIds] = useState<number[]>([]);
  const [pinnedOrganizationFolderIds, setPinnedOrganizationFolderIds] = useState<number[]>([]);
  const [pinnedOfficialFolders, setPinnedOfficialFolders] = useState<TemplateFolder[]>([]);
  const [pinnedOrganizationFolders, setPinnedOrganizationFolders] = useState<TemplateFolder[]>([]);
  const [userFolders, setUserFolders] = useState<TemplateFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ step: 0, total: 3 });

  // Helper function to convert any array to a safe array of numbers
  const safeNumberArray = (ids: any): number[] => {
    if (!ids) return [];
    if (Array.isArray(ids)) {
      return ids.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
               .filter(id => !isNaN(id));
    }
    return [];
  };

  // Convert API response to TemplateFolder objects
  const mapToTemplateFolder = (folders: any[]): TemplateFolder[] => {
    if (!folders || !Array.isArray(folders)) return [];
    
    return folders.map(folder => ({
      id: folder.id,
      name: folder.name || `Folder ${folder.id}`,
      templates: Array.isArray(folder.templates) ? folder.templates : [],
      subfolders: Array.isArray(folder.subfolders) ? folder.subfolders : []
    }));
  };

  // Load user data from Chrome storage
  useEffect(() => {
    const loadUserData = async () => {
      setLoadingProgress({ step: 1, total: 3 });
      
      try {
        chrome.storage.local.get('user', (result) => {
          console.log('Retrieved user from storage:', result?.user);
          
          if (result?.user?.metadata) {
            // Safely extract and convert folder IDs
            const officialIds = safeNumberArray(result.user.metadata.pinned_official_folder_ids);
            const organizationIds = safeNumberArray(result.user.metadata.pinned_organization_folder_ids);
            
            console.log('Parsed official IDs:', officialIds);
            console.log('Parsed organization IDs:', organizationIds);
            
            setPinnedOfficialFolderIds(officialIds);
            setPinnedOrganizationFolderIds(organizationIds);
          } else {
            console.log('No user metadata found in storage');
            setPinnedOfficialFolderIds([]);
            setPinnedOrganizationFolderIds([]);
          }
          setLoadingProgress({ step: 2, total: 3 });
        });
      } catch (error) {
        console.error('Error loading user data from storage:', error);
        setPinnedOfficialFolderIds([]);
        setPinnedOrganizationFolderIds([]);
        toast.error('Failed to load user data');
        setLoadingProgress({ step: 2, total: 3 });
      }
    };

    loadUserData();
  }, []);

  // Load folders data after getting folder IDs
  useEffect(() => {
    if (loadingProgress.step < 2) return;
    
    const loadFolders = async () => {
      try {
        // Load all folder types in parallel
        const [officialResponse, organizationResponse, userResponse] = await Promise.allSettled([
          // Only load official folders if we have IDs
          pinnedOfficialFolderIds.length > 0 
            ? promptApi.getPromptTemplatesFolders('official', pinnedOfficialFolderIds) 
            : Promise.resolve({ success: true, folders: [] }),
            
          // Only load organization folders if we have IDs
          pinnedOrganizationFolderIds.length > 0
            ? promptApi.getPromptTemplatesFolders('organization', pinnedOrganizationFolderIds)
            : Promise.resolve({ success: true, folders: [] }),
            
          // Always try to load user folders
          promptApi.getPromptTemplatesFolders('user')
        ]);
        
        console.log('API responses:', { 
          official: officialResponse, 
          organization: organizationResponse, 
          user: userResponse 
        });
        
        // Process official folders
        if (officialResponse.status === 'fulfilled' && officialResponse.value.success) {
          setPinnedOfficialFolders(mapToTemplateFolder(officialResponse.value.folders || []));
        } else {
          console.warn('Failed to load official folders:', officialResponse);
          setPinnedOfficialFolders([]);
        }
        
        // Process organization folders
        if (organizationResponse.status === 'fulfilled' && organizationResponse.value.success) {
          setPinnedOrganizationFolders(mapToTemplateFolder(organizationResponse.value.folders || []));
        } else {
          console.warn('Failed to load organization folders:', organizationResponse);
          setPinnedOrganizationFolders([]);
        }
        
        // Process user folders
        if (userResponse.status === 'fulfilled' && userResponse.value.success) {
          setUserFolders(mapToTemplateFolder(userResponse.value.folders || []));
        } else {
          console.warn('Failed to load user folders:', userResponse);
          setUserFolders([]);
        }
      } catch (error) {
        console.error('Error loading folders:', error);
        toast.error('Failed to load template folders');
        
        // Set empty arrays as fallback
        setPinnedOfficialFolders([]);
        setPinnedOrganizationFolders([]);
        setUserFolders([]);
      } finally {
        setIsLoading(false);
        setLoadingProgress({ step: 3, total: 3 });
      }
    };
    
    setIsLoading(true);
    loadFolders();
  }, [loadingProgress.step, pinnedOfficialFolderIds, pinnedOrganizationFolderIds]);

  // Open browse dialog for different folder types
  const openBrowseDialog = (type: 'official' | 'organization') => {
    setBrowseFolderType(type);
    setBrowseDialogOpen(true);
  };
  
  // Handle pin/unpin of a folder
  const handleTogglePin = async (folderId: number, isPinned: boolean, type: 'official' | 'organization') => {
    // Get current pinned IDs based on folder type
    const currentPinnedIds = type === 'official' 
      ? pinnedOfficialFolderIds 
      : pinnedOrganizationFolderIds;
    
    // Create new array of IDs based on pin action
    const newPinnedIds = isPinned
      ? currentPinnedIds.filter(id => id !== folderId) // Remove ID if unpinning
      : [...currentPinnedIds, folderId]; // Add ID if pinning
    
    try {
      // Update backend
      const response = await promptApi.updatePinnedFolders(type, newPinnedIds);
      
      if (response.success) {
        // Update local state
        if (type === 'official') {
          setPinnedOfficialFolderIds(newPinnedIds);
        } else {
          setPinnedOrganizationFolderIds(newPinnedIds);
        }
        
        toast.success(isPinned ? 'Folder unpinned' : 'Folder pinned');
        
        // Re-fetch folders if needed
        if (!isPinned) {
          // We're pinning a new folder, so we need to fetch its data
          const folderResponse = await promptApi.getPromptTemplatesFolders(type, [folderId]);
          if (folderResponse.success && folderResponse.folders) {
            const newFolders = mapToTemplateFolder(folderResponse.folders);
            
            if (type === 'official') {
              setPinnedOfficialFolders(prev => [...prev, ...newFolders]);
            } else {
              setPinnedOrganizationFolders(prev => [...prev, ...newFolders]);
            }
          }
        } else {
          // We're unpinning a folder, so remove it from state
          if (type === 'official') {
            setPinnedOfficialFolders(prev => prev.filter(folder => folder.id !== folderId));
          } else {
            setPinnedOrganizationFolders(prev => prev.filter(folder => folder.id !== folderId));
          }
        }
      } else {
        toast.error(`Failed to ${isPinned ? 'unpin' : 'pin'} folder`);
      }
    } catch (error) {
      console.error('Error toggling pin status:', error);
      toast.error(`Error ${isPinned ? 'unpinning' : 'pinning'} folder`);
    }
  };
  
  // Handle pin change from the browse dialog
  const handleDialogPinChange = async (folderId: number, isPinned: boolean) => {
    await handleTogglePin(folderId, isPinned, browseFolderType);
  };

  const onTemplateClick = (template: Template) => {
    handleUseTemplate(template);
  };

  // Add a class when the placeholder editor is open to help with styles
  const templatesPanelClass = cn(
    "w-96 shadow-lg transition-all duration-300", 
    placeholderEditorOpen ? "editor-active opacity-30" : "opacity-100"
  );

  // Determine if we're still loading anything
  const loading = isLoading || templatesLoading || loadingProgress.step < 3;

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
                onClick={() => openEditDialog(null)}
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
                  <p className="text-sm text-muted-foreground mt-2">
                    {chrome.i18n.getMessage('loadingTemplates')} ({loadingProgress.step}/{loadingProgress.total})
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
                        onClick={() => openBrowseDialog('official')}
                      >
                        <ChevronDown className="h-3.5 w-3.5 mr-1" />
                        {chrome.i18n.getMessage('browseMore')}
                      </Button>
                    </div>
                    
                    {/* Pinned official folders */}
                    {pinnedOfficialFolders.length > 0 ? (
                      pinnedOfficialFolders.map(folder => (
                        <SubFolder
                          key={`official-folder-${folder.id}`}
                          folder={folder}
                          onUseTemplate={onTemplateClick}
                          onEditTemplate={openEditDialog}
                          onDeleteTemplate={handleDeleteTemplate}
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
                        onClick={() => openBrowseDialog('organization')}
                      >
                        <ChevronDown className="h-3.5 w-3.5 mr-1" />
                        {chrome.i18n.getMessage('browseMore')}
                      </Button>
                    </div>
                    
                    {/* Pinned organization folders */}
                    {pinnedOrganizationFolders.length > 0 ? (
                      pinnedOrganizationFolders.map(folder => (
                        <SubFolder
                          key={`org-folder-${folder.id}`}
                          folder={folder}
                          onUseTemplate={onTemplateClick}
                          onEditTemplate={openEditDialog}
                          onDeleteTemplate={handleDeleteTemplate}
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
                  {userFolders.length > 0 && (
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
                          onUseTemplate={onTemplateClick}
                          onEditTemplate={openEditDialog}
                          onDeleteTemplate={handleDeleteTemplate}
                          type="user"
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Empty state - show when no templates or folders of any kind are found */}
                  {pinnedOfficialFolders.length === 0 && 
                   pinnedOrganizationFolders.length === 0 && 
                   userFolders.length === 0 && (
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
      
      {/* Template Edit Dialog */}
      {editDialogOpen && (
        <TemplateDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          currentTemplate={selectedTemplate}
          formData={templateFormData}
          onFormChange={setTemplateFormData}
          onSaveTemplate={handleSaveTemplate}
        />
      )}
      
      {/* Browse Folders Dialog */}
      <BrowseFoldersDialog
        open={browseDialogOpen}
        onOpenChange={setBrowseDialogOpen}
        folderType={browseFolderType}
        pinnedFolderIds={browseFolderType === 'official' ? pinnedOfficialFolderIds : pinnedOrganizationFolderIds}
        onPinChange={handleDialogPinChange}
      />
      
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
    </>
  );
};

export default TemplatesPanel;