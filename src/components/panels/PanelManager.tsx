// src/components/panels/PanelManager.tsx

import React, { useEffect } from 'react';
import { PanelNavigationProvider, usePanelNavigation, PanelType } from '@/core/contexts/PanelNavigationContext';
import MenuPanel from './MenuPanel';
import TemplatesPanel from './TemplatesPanel';
import NotificationsPanel from './NotificationsPanel';
import StatsPanel from './StatsPanel';
import BrowseTemplatesPanel from './BrowseTemplatesPanel';

interface PanelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPanel?: PanelType;
  notificationCount?: number;
}

/**
 * Internal component that displays the appropriate panel based on navigation state
 */
const PanelContainer: React.FC<{ onClose: () => void, notificationCount: number }> = ({
  onClose,
  notificationCount
}) => {
  const { currentPanel, popPanel, panelStack } = usePanelNavigation();
  
  // When a panel requests to close, either go back to previous panel or close entirely
  const handlePanelClose = () => {
    if (panelStack.length > 1) {
      popPanel();
    } else {
      onClose();
    }
  };

  // Render the appropriate panel based on currentPanel.type
  switch (currentPanel.type) {
    case 'menu':
      return (
        <MenuPanel 
          onClose={onClose}
          notificationCount={notificationCount} 
        />
      );
    case 'templates':
      return (
        <TemplatesPanel
          showBackButton={panelStack.length > 1}
          onBack={popPanel}
          onClose={handlePanelClose}
        />
      );
    case 'notifications':
      return (
        <NotificationsPanel
          showBackButton={panelStack.length > 1}
          onBack={popPanel}
          onClose={handlePanelClose}
        />
      );
    case 'stats':
      return (
        <StatsPanel
          showBackButton={panelStack.length > 1}
          onBack={popPanel}
          onClose={handlePanelClose}
          compact
        />
      );
    case 'templatesBrowse':
      return (
        <BrowseTemplatesPanel
          folderType={currentPanel.props?.folderType || 'official'}
          pinnedFolderIds={currentPanel.props?.pinnedFolderIds || []}
          onPinChange={currentPanel.props?.onPinChange}
          onBackToTemplates={popPanel}
        />
      );
    default:
      return <div>Unknown panel type</div>;
  }
};

/**
 * Main panel manager component that controls panel navigation
 */
const PanelManager: React.FC<PanelManagerProps> = ({
  isOpen,
  onClose,
  initialPanel = 'menu',
  notificationCount = 0
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150">
      <PanelNavigationProvider initialPanel={{ type: initialPanel }}>
        <PanelContainer onClose={onClose} notificationCount={notificationCount} />
      </PanelNavigationProvider>
    </div>
  );
};

export default PanelManager;