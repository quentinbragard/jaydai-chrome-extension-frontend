// src/components/MainButton/hooks/useMenuPanel.tsx
import { useState, useCallback } from 'react';
import { FolderOpen, Bell, Menu as MenuIcon } from 'lucide-react';

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

export function useMenuPanel() {
  // Navigation stack - the initial state is the main menu
  const [navStack, setNavStack] = useState<PanelState[]>([{ type: 'menu' }]);

  // Get the current panel from the top of the navigation stack
  const currentPanel = navStack[navStack.length - 1];

  // Push a new panel to the navigation stack
  const pushPanel = useCallback((panel: PanelState) => {
    setNavStack((prev) => [...prev, panel]);
  }, []);

  // Go back to the previous panel
  const popPanel = useCallback(() => {
    if (navStack.length > 1) {
      setNavStack((prev) => prev.slice(0, prev.length - 1));
    }
  }, [navStack.length]);

  // Determine the header title based on the current panel
  const getTitle = useCallback(() => {
    switch (currentPanel.type) {
      case 'menu':
        return chrome.i18n.getMessage('menu') || 'Menu';
      case 'templates':
        return chrome.i18n.getMessage('templates') || 'Templates';
      case 'browse-official':
        return chrome.i18n.getMessage('browseOfficialTemplates') || 'Official Templates';
      case 'browse-organization':
        return chrome.i18n.getMessage('browseOrganizationTemplates') || 'Organization Templates';
      case 'notifications':
        return chrome.i18n.getMessage('notifications') || 'Notifications';
      default:
        return chrome.i18n.getMessage('menu') || 'Menu';
    }
  }, [currentPanel.type]);

  // Get an icon for the current panel
  const getIcon = useCallback(() => {
    switch (currentPanel.type) {
      case 'menu':
        return MenuIcon;
      case 'templates':
      case 'browse-official':
      case 'browse-organization':
        return FolderOpen;
      case 'notifications':
        return Bell;
      default:
        return MenuIcon;
    }
  }, [currentPanel.type]);

  // Reset navigation to root menu
  const resetNavigation = useCallback(() => {
    setNavStack([{ type: 'menu' }]);
  }, []);

  return {
    navStack,
    currentPanel,
    pushPanel,
    popPanel,
    resetNavigation,
    getTitle,
    getIcon,
  };
}