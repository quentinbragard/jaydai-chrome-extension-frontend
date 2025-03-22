// src/components/panels/TemplatesPanel/TemplatesPanel.tsx

import React, { useState } from 'react';
import { FolderOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import BasePanel from '../BasePanel';
import { useTemplates } from '@/hooks/templates';
import { usePanelNavigation } from '@/core/contexts/PanelNavigationContext';
import FolderSection from './components/FolderSection';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';

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
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    loading,
    pinnedOfficialFolders,
    pinnedOrganizationFolders,
    userFolders,
    handleUseTemplate,
    handleEditTemplate,
    handleDeleteTemplate,
    refreshFolders,
    handleCreateTemplate,
    error,
    toggleFolderPin,
    deleteFolder
  } = useTemplates();

  // Handle browse more templates 
  const handleBrowseMore = (type: 'official' | 'organization') => {
    const folderIds = type === 'official' 
      ? pinnedOfficialFolders.map(f => f.id)
      : pinnedOrganizationFolders.map(f => f.id);
      
    pushPanel({ 
      type: 'templatesBrowse', 
      props: { 
        folderType: type, 
        pinnedFolderIds: folderIds,
        onPinChange: (id: number, isPinned: boolean) => toggleFolderPin(id, isPinned, type)
      } 
    });
  };

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshFolders();
    } catch (error) {
      console.error('Failed to refresh templates:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Error handling display
  if (error) {
    return (
      <BasePanel
        title={chrome.i18n.getMessage('templates') || "Templates"}
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
                onClick={handleRefresh}
                className="mt-2"
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Retry'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </BasePanel>
    );
  }

  const isEmpty = 
    (!pinnedOfficialFolders || pinnedOfficialFolders.length === 0) && 
    (!pinnedOrganizationFolders || pinnedOrganizationFolders.length === 0) && 
    (!userFolders || userFolders.length === 0);

  return (
    <BasePanel
      title={chrome.i18n.getMessage('templates') || "Templates"}
      icon={FolderOpen}
      showBackButton={showBackButton}
      onBack={onBack}
      onClose={onClose}
      className="w-80"
      maxHeight="500px"
    >
      {loading ? (
        <LoadingState />
      ) : isEmpty ? (
        <EmptyState 
          onCreateTemplate={handleCreateTemplate} 
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      ) : (
        <div className="space-y-4">
          {/* Official Templates Section */}
          <FolderSection
            title={chrome.i18n.getMessage('officialTemplates') || 'Official Templates'}
            iconType="official"
            folders={pinnedOfficialFolders}
            type="official"
            onUseTemplate={handleUseTemplate}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onTogglePin={(folderId, isPinned) => toggleFolderPin(folderId, isPinned, 'official')}
            onBrowseMore={() => handleBrowseMore('official')}
            showBrowseMore={true}
            showPinControls={true}
          />

          <Separator />
          
          {/* Organization Templates Section */}
          <FolderSection
            title={chrome.i18n.getMessage('organizationTemplates') || 'Organization Templates'}
            iconType="organization"
            folders={pinnedOrganizationFolders}
            type="organization"
            onUseTemplate={handleUseTemplate}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onTogglePin={(folderId, isPinned) => toggleFolderPin(folderId, isPinned, 'organization')}
            onBrowseMore={() => handleBrowseMore('organization')}
            showBrowseMore={true}
            showPinControls={true}
          />

          <Separator />
          
          {/* User Templates Section */}
          <FolderSection
            title={chrome.i18n.getMessage('myTemplates') || 'My Templates'}
            iconType="user"
            folders={userFolders}
            type="user"
            onUseTemplate={handleUseTemplate}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onDeleteFolder={deleteFolder}
            onCreateTemplate={handleCreateTemplate}
            showCreateButton={true}
            showDeleteControls={true}
          />
        </div>
      )}
    </BasePanel>
  );
};

export default TemplatesPanel;