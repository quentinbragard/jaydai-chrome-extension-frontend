import React from 'react';
import { FolderOpen, Bell, Menu as MenuIcon, BarChart } from "lucide-react";
import { usePanelNavigation } from '@/core/hooks/usePanelNavigation';
import MenuPanelHeader from './MenuPanelHeader';
import MenuPanelMenu from './MenuPanelMenu';
import TemplatesPanel from '../TemplatesPanel';
import NotificationsPanel from '../NotificationsPanel';
import StatsPanel from '../StatsPanel';

interface MenuPanelProps {
  isOpen: boolean;
  notificationCount: number;
  menuRef: React.RefObject<HTMLDivElement>;
  onClosePanel: () => void;
  onSettingsClick: () => void;
  setIsPlaceholderEditorOpen: (isOpen: boolean) => void;
}

const MenuPanel: React.FC<MenuPanelProps> = ({
  isOpen,
  notificationCount,
  menuRef,
  onClosePanel,
  onSettingsClick,
  setIsPlaceholderEditorOpen,
}) => {
  const {
    currentPanel,
    panelStack,
    popPanel,
  } = usePanelNavigation();

  // Get title and icon for current panel
  const getPanelTitle = (): string => {
    switch (currentPanel.type) {
      case 'menu':
        return chrome.i18n.getMessage('menu') || 'Menu';
      case 'templates':
        return chrome.i18n.getMessage('templates') || 'Templates';
      case 'templatesBrowse':
        return chrome.i18n.getMessage('browseTemplates') || 'Browse Templates';
      case 'notifications':
        return chrome.i18n.getMessage('notifications') || 'Notifications';
      case 'stats':
        return chrome.i18n.getMessage('aiStats') || 'AI Stats';
      default:
        return chrome.i18n.getMessage('menu') || 'Menu';
    }
  };

  const getPanelIcon = (): React.ComponentType<{ className?: string }> => {
    switch (currentPanel.type) {
      case 'menu':
        return MenuIcon;
      case 'templates':
      case 'templatesBrowse':
        return FolderOpen;
      case 'notifications':
        return Bell;
      case 'stats':
        return BarChart;
      default:
        return MenuIcon;
    }
  };

  // Render the appropriate content based on the current panel
  const renderContent = () => {
    switch (currentPanel.type) {
      case 'menu':
        return (
          <MenuPanelMenu
            notificationCount={notificationCount}
            onSettingsClick={onSettingsClick}
          />
        );
      case 'templates':
      case 'templatesBrowse':
        return (
          <TemplatesPanel
            view={currentPanel.type === 'templates' ? 'templates' : 'browse'}
            setIsPlaceholderEditorOpen={setIsPlaceholderEditorOpen}
          />
        );
      case 'notifications':
        return <NotificationsPanel />;
      case 'stats':
        return <StatsPanel compact />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute backdrop-blur-sm bottom-full mb-2 right-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150 shadow-lg rounded-md overflow-hidden z-50"
    >
      <MenuPanelHeader
        showBackButton={panelStack.length > 1}
        onBack={popPanel}
        onClose={onClosePanel}
        title={getPanelTitle()}
        icon={getPanelIcon()}
      />
      <div className="p-2 dark:bg-white dark:text-black bg-gray-800 rounded-b-md">
        {renderContent()}
      </div>
    </div>
  );
};

export default MenuPanel;