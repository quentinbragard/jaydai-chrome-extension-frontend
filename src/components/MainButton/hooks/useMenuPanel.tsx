// src/features/MainButton/components/MenuPanel/useMenuPanel.ts
import { useState } from 'react';

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
  const pushPanel = (panel: PanelState) => {
    setNavStack((prev) => [...prev, panel]);
  };

  // Go back to the previous panel
  const popPanel = () => {
    if (navStack.length > 1) {
      setNavStack((prev) => prev.slice(0, prev.length - 1));
    }
  };

  // Determine the header title based on the current panel
  const getTitle = () => {
    switch (currentPanel.type) {
      case 'menu':
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

  return {
    navStack,
    currentPanel,
    pushPanel,
    popPanel,
    getTitle,
  };
}