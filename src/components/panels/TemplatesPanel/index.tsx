// src/components/panels/TemplatesPanel/index.tsx

import React from 'react';
import { FolderOpen, BookTemplate, Users, Folder, PlusCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import BasePanel from '../BasePanel';
import { useTemplates } from '@/hooks/templates';
import { usePanelNavigation } from '@/core/contexts/PanelNavigationContext';
import TemplateFolderSection from './TemplateFolderSection';
// Removed useOpenDialog import

interface TemplatesPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
}

/**
 * Panel for browsing and managing templates
 */
const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  showBackButton,
  onBack,
  onClose
}) => {
  const { pushPanel } = usePanelNavigation();
  
  const {
    loading,
    selectedTemplate,
    pinnedOfficialFolders,
    pinnedOrganizationFolders,
    userFolders,
    handleUseTemplate,
    handleEditTemplate,
    handleDeleteTemplate,
    handleFinalizeTemplate,
    refreshFolders,
    handleCreateTemplate,
    error,
    toggleFolderPin
  } = useTemplates();

  // Handle folder pin toggling
  const handleToggleFolderPin = async (folderId: number, isPinned: boolean, type: 'official' | 'organization') => {
    try {
      await toggleFolderPin(folderId, isPinned, type);
      toast.success(isPinned ? 'Folder unpinned' : 'Folder pinned');
      refreshFolders();
    } catch (error) {
      toast.error(`Failed to ${isPinned ? 'unpin' : 'pin'} folder`);
      console.error('Error toggling pin:', error);
    }
  };

  // Custom use template handler that uses window.dialogManager directly
  const handleTemplateUse = (template) => {
    // First run the current handleUseTemplate to set selectedTemplate and track usage
    handleUseTemplate(template);
    
    // Then open the placeholder editor dialog using window.dialogManager
    if (template && template.content && window.dialogManager) {
      window.dialogManager.openDialog('placeholderEditor', {
        content: template.content,
        title: template.title,
        onComplete: (finalContent) => handleFinalizeTemplate(finalContent, () => {})
      });
    }
  };

  // Browse more official or organization templates
  const handleBrowseMore = (type: 'official' | 'organization') => {
    const folderIds = type === 'official' 
      ? pinnedOfficialFolders.map(f => f.id)
      : pinnedOrganizationFolders.map(f => f.id);
      
    pushPanel({ 
      type: 'templatesBrowse', 
      props: { 
        folderType: type, 
        pinnedFolderIds: folderIds,
        onPinChange: (id: number, isPinned: boolean) => handleToggleFolderPin(id, isPinned, type)
      } 
    });
  };

  if (error) {
    return (
      <BasePanel
        title="Templates"
        icon={FolderOpen}
        showBackButton={showBackButton}
        onBack={onBack}
        onClose={onClose}
      >
        <Alert variant="destructive">
          <AlertDescription>
            <div className="flex flex-col items-center justify-center py-4">
              <p className="mb-2">Failed to load templates: {error}</p>
              <Button 
                variant="outline"
                size="sm"
                onClick={refreshFolders}
                className="mt-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </BasePanel>
    );
  }

  return (
    <BasePanel
      title="Templates"
      icon={FolderOpen}
      showBackButton={showBackButton}
      onBack={onBack}
      onClose={onClose}
      className="w-80"
      maxHeight="500px"
    >
      {loading ? (
        <div className="py-8 text-center">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading templates...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Official Templates Section */}
          <div>
            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-2">
              <div className="flex items-center">
                <BookTemplate className="mr-2 h-4 w-4" />
                {chrome.i18n.getMessage('officialTemplates') || 'Official Templates'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleBrowseMore('official')}
              >
                Browse More
              </Button>
            </div>
            
            {pinnedOfficialFolders && pinnedOfficialFolders.length > 0 ? (
              <TemplateFolderSection 
                folders={pinnedOfficialFolders}
                onUseTemplate={handleTemplateUse}
                onEditTemplate={handleEditTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onTogglePin={(folderId, isPinned, e) => 
                  handleToggleFolderPin(folderId, isPinned, 'official')
                }
                showPinControls={true}
                type="official"
              />
            ) : (
              <div className="text-center py-2 text-xs text-muted-foreground">
                No pinned official templates. Click 'Browse More' to add some.
              </div>
            )}
          </div>

          <Separator />
          
          {/* Organization Templates Section */}
          <div>
            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-2">
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                {chrome.i18n.getMessage('organizationTemplates') || 'Organization Templates'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleBrowseMore('organization')}
              >
                Browse More
              </Button>
            </div>
            
            {pinnedOrganizationFolders && pinnedOrganizationFolders.length > 0 ? (
              <TemplateFolderSection 
                folders={pinnedOrganizationFolders}
                onUseTemplate={handleTemplateUse}
                onEditTemplate={handleEditTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onTogglePin={(folderId, isPinned, e) => 
                  handleToggleFolderPin(folderId, isPinned, 'organization')
                }
                showPinControls={true}
                type="organization"
              />
            ) : (
              <div className="text-center py-2 text-xs text-muted-foreground">
                No pinned organization templates. Click 'Browse More' to add some.
              </div>
            )}
          </div>

          <Separator />
          
          {/* User Templates Section */}
          <div>
            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-2">
              <div className="flex items-center">
                <Folder className="mr-2 h-4 w-4" />
                {chrome.i18n.getMessage('myTemplates') || 'My Templates'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleCreateTemplate}
                title={chrome.i18n.getMessage('newTemplate') || 'New Template'}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            
            {userFolders && userFolders.length > 0 ? (
              <TemplateFolderSection 
                folders={userFolders}
                onUseTemplate={handleTemplateUse}
                onEditTemplate={handleEditTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                type="user"
              />
            ) : (
              <div className="text-center py-2 text-xs text-muted-foreground">
                No user templates. Create a template to get started.
              </div>
            )}
          </div>
          
          {/* Empty state - when all sections are empty */}
          {pinnedOfficialFolders.length === 0 && 
           pinnedOrganizationFolders.length === 0 && 
           userFolders.length === 0 && (
            <div className="py-4 px-4 text-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCreateTemplate}
                className="flex items-center w-full"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                {chrome.i18n.getMessage('createFirstTemplate') || 'Create Your First Template'}
              </Button>
            </div>
          )}
        </div>
      )}
    </BasePanel>
  );
};

export default TemplatesPanel;