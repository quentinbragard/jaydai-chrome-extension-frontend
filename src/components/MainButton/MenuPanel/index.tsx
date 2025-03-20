import React, { useState } from 'react';
import MenuPanelHeader from './MenuPanelHeader';
import MenuPanelMenu from './MenuPanelMenu';
import TemplatesPanel from './TemplatesPanel';
import NotificationsPanel from './NotificationsPanel';

export type PanelState =
  | { panel: 'menu' }
  | { panel: 'templates'; view: 'pinned' | 'browse-official' | 'browse-organization' }
  | { panel: 'notifications' };

export interface MenuPanelProps {
  isOpen: boolean;
  notificationCount: number;
  menuRef: React.RefObject<HTMLDivElement>;
  onClosePanel: () => void;
  onSaveClick: () => void;
  onSettingsClick: () => void;
  setIsPlaceholderEditorOpen: (isOpen: boolean) => void;
}

const MenuPanel: React.FC<MenuPanelProps> = ({
  isOpen,
  notificationCount,
  menuRef,
  onClosePanel,
  onSaveClick,
  onSettingsClick,
  setIsPlaceholderEditorOpen,
}) => {
  // Navigation stack – the initial state is the main menu.
  const [navStack, setNavStack] = useState<PanelState[]>([{ panel: 'menu' }]);

  const currentPanel = navStack[navStack.length - 1];

  const pushPanel = (panel: PanelState) => {
    setNavStack((prev) => [...prev, panel]);
  };

  const popPanel = () => {
    if (navStack.length > 1) {
      setNavStack((prev) => prev.slice(0, prev.length - 1));
    }
  };

  // Change panel without adding a new stack entry (if needed)
  const updateCurrentPanel = (panel: PanelState) => {
    setNavStack((prev) => [...prev.slice(0, prev.length - 1), panel]);
  };

  // Determine header title based on current panel
  const getTitle = () => {
    if (currentPanel.panel === 'templates') {
      switch (currentPanel.view) {
        case 'browse-official':
          return chrome.i18n.getMessage('browseOfficialTemplates');
        case 'browse-organization':
          return chrome.i18n.getMessage('browseOrganizationTemplates');
        default:
          return chrome.i18n.getMessage('templates');
      }
    }
    if (currentPanel.panel === 'notifications') {
      return chrome.i18n.getMessage('notifications');
    }
    return ''; // no title for main menu
  };

  const renderContent = () => {
    switch (currentPanel.panel) {
      case 'menu':
        return (
          <MenuPanelMenu
            onSelect={(panel) => {
              if (panel === 'templates') {
                // When entering Templates, start with the pinned folders view.
                pushPanel({ panel: 'templates', view: 'pinned' });
              } else if (panel === 'notifications') {
                pushPanel({ panel: 'notifications' });
              }
            }}
            notificationCount={notificationCount}
            onSaveClick={onSaveClick}
            onSettingsClick={onSettingsClick}
          />
        );
      case 'templates':
        return (
          <TemplatesPanel
            view={currentPanel.view}
            onViewChange={(newView) => {
              // Push a new Templates panel state when switching views.
              pushPanel({ panel: 'templates', view: newView });
            }}
            setIsPlaceholderEditorOpen={setIsPlaceholderEditorOpen}
          />
        );
      case 'notifications':
        return <NotificationsPanel />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute backdrop-blur-sm bottom-full mb-2 right-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150"
    >
      <MenuPanelHeader
        showBackButton={navStack.length > 1}
        onBack={popPanel}
        onClose={onClosePanel}
        title={getTitle()}
      />
      <div className="p-2">{renderContent()}</div>
    </div>
  );
};

export default MenuPanel;
