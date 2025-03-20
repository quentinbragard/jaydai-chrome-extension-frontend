import React, { useState } from 'react';
import MenuPanelHeader from './MenuPanelHeader';
import MenuPanelMenu from './MenuPanelMenu';
import TemplatesPanel from './TemplatesPanel';
import NotificationsPanel from './NotificationsPanel';

// Panel state types
export type MenuPanelType = 'menu';
export type TemplatesPanelType = 'templates' | 'browse-official' | 'browse-organization';
export type NotificationsPanelType = 'notifications';

// Union type for all panel types
export type PanelType = MenuPanelType | TemplatesPanelType | NotificationsPanelType;

// Panel state with type and metadata
export interface PanelState {
  type: PanelType;
  meta?: Record<string, any>; // Optional metadata for the panel
}

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
  // Navigation stack - the initial state is the main menu
  const [navStack, setNavStack] = useState<PanelState[]>([{ type: 'menu' }]);

  // Get the current panel from the top of the navigation stack
  const currentPanel = navStack[navStack.length - 1];

  // Push a new panel to the navigation stack
  const pushPanel = (panel: PanelState) => {
    setNavStack((prev) => [...prev, panel]);
  };

  // Go back to the previous panel
  const popPanel = () => {
    if (navStack.length > 1) {
      setNavStack((prev) => prev.slice(0, prev.length - 1));
    } else {
      // If we're at the root menu, close the entire panel
      onClosePanel();
    }
  };

  // Determine the header title based on the current panel
  const getTitle = () => {
    console.log('currentPanel', currentPanel);
    switch (currentPanel.type) {
      case 'menu':
        console.log(chrome.i18n.getMessage('templates'));
        return chrome.i18n.getMessage('menu');
      case 'templates':
        return chrome.i18n.getMessage('templates');
      case 'browse-official':
        return chrome.i18n.getMessage('browseOfficialTemplates');
      case 'browse-organization':
        return chrome.i18n.getMessage('browseOrganizationTemplates');
      case 'notifications':
        return chrome.i18n.getMessage('notifications');
      default:
        return chrome.i18n.getMessage('menu');
    }
  };

  // Render the appropriate content based on the current panel
  const renderContent = () => {
    switch (currentPanel.type) {
      case 'menu':
        return (
          <MenuPanelMenu
            onSelect={(panel) => {
              if (panel === 'templates') {
                pushPanel({ type: 'templates' });
              } else if (panel === 'notifications') {
                pushPanel({ type: 'notifications' });
              }
            }}
            notificationCount={notificationCount}
            onSaveClick={onSaveClick}
            onSettingsClick={onSettingsClick}
          />
        );
      case 'templates':
      case 'browse-official':
      case 'browse-organization':
        return (
          <TemplatesPanel
            view={currentPanel.type as TemplatesPanelType}
            onViewChange={(newView) => {
              pushPanel({ type: newView });
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
  console.log('getTitle()', getTitle());

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
      <div className="p-2 dark:bg-white dark:text-black bg-gray-800 rounded-b-md">{renderContent()}</div>
    </div>
  );
};

export default MenuPanel;