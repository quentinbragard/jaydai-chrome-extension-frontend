// src/components/panels/PanelManager.tsx

import React from 'react';
import { PanelNavigationProvider, usePanelNavigation } from '@/core/contexts/PanelNavigationContext';
import { QueryProvider } from '@/providers/QueryProvider';
import MenuPanel from './MenuPanel';
import TemplatesPanel from './TemplatesPanel';
import NotificationsPanel from './NotificationsPanel';
import StatsPanel from './StatsPanel';
import SettingsPanel from './SettingsPanel';
import BrowseTemplatesPanel from './BrowseTemplatesPanel';
import type { PanelType } from '@/hooks/ui/useMainButtonState';

interface PanelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPanel?: PanelType;
  notificationCount?: number;
  activePanelType?: PanelType;
}

/**
 * Internal component that displays the appropriate panel based on navigation state
 */
const PanelContainer: React.FC<{ 
  onClose: () => void,
  notificationCount: number,
  activePanelType?: PanelType
}> = ({
  onClose,
  notificationCount,
  activePanelType
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
        />
      );
    case 'settings':
      return (
        <SettingsPanel
          showBackButton={panelStack.length > 1}
          onBack={popPanel}
          onClose={handlePanelClose}
        />
      );
    case 'templatesBrowse':
      return (
        <BrowseTemplatesPanel
          folderType={currentPanel.props?.folderType || 'organization'}
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
  notificationCount = 0,
  activePanelType
}) => {
  if (!isOpen) return null;

  // Use activePanelType if provided, otherwise use initialPanel
  const panelToShow = activePanelType || initialPanel;

  return (
    <div
      className="jd-absolute jd-right-0 jd-z-50 jd-animate-in jd-fade-in jd-zoom-in-95 jd-slide-in-from-bottom-2 jd-duration-150"
      style={{ bottom: 'calc(100% + 0.5rem)' }}
    >
      <QueryProvider>
        <PanelNavigationProvider initialPanel={{ type: panelToShow }}>
          <PanelContainer
            onClose={onClose}
            notificationCount={notificationCount}
            activePanelType={activePanelType}
          />
        </PanelNavigationProvider>
      </QueryProvider>
    </div>
  );
};

export default PanelManager;