
// src/hooks/ui/useMainButtonState.ts

import { useState, useRef, useEffect } from 'react';

export type PanelType = 'menu' | 'notifications' | 'templates' | 'stats' | 'templatesBrowse';

export const useMainButtonState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [panelType, setPanelType] = useState<PanelType>('menu');
  const [notificationCount, setNotificationCount] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Combined event handling for improved coordination
  useEffect(() => {
    // Handle notification count changes
    const handleNotificationCountChanged = (event: CustomEvent) => {
      const { unreadCount } = event.detail;
      setNotificationCount(unreadCount);
    };

    // Handle specific request to open notifications panel
    const handleOpenNotifications = () => {
      // Important: Set panel type first, then open
      setIsOpen(true);
    };

    // Handle toggle panel event for any panel type
    const handleTogglePanel = (event: CustomEvent) => {
      const { panel } = event.detail;
      if (panel) {
        // Set the requested panel type
        setPanelType(panel as PanelType);
        // Only open if not already open
        if (!isOpen) {
          setIsOpen(true);
        }
      }
    };

    // Handle close all panels event - NEW!
    const handleCloseAllPanels = () => {  
      setIsOpen(false);
    };

    // Register all event listeners
    document.addEventListener('jaydai:notification-count-changed', handleNotificationCountChanged as EventListener);
    document.addEventListener('jaydai:open-notifications', handleOpenNotifications);
    document.addEventListener('jaydai:toggle-panel', handleTogglePanel as EventListener);
    document.addEventListener('jaydai:close-all-panels', handleCloseAllPanels);

    // Cleanup function
    return () => {
      document.removeEventListener('jaydai:notification-count-changed', handleNotificationCountChanged as EventListener);
      document.removeEventListener('jaydai:open-notifications', handleOpenNotifications);
      document.removeEventListener('jaydai:toggle-panel', handleTogglePanel as EventListener);
      document.removeEventListener('jaydai:close-all-panels', handleCloseAllPanels);
    };
  }, [isOpen]); // Include isOpen in dependencies for toggling logic

  // Toggle menu open/closed without resetting panel type
  const toggleMenu = () => {
    setIsOpen(prev => !prev);
    // Only reset to menu panel when opening and no specific panel is active
    if (!isOpen && panelType === 'menu') {
      setPanelType('menu');
    }
  };

  // Close panel
  const handleClosePanel = () => {
    setIsOpen(false);
    // Optionally reset panel type when closing
    // setPanelType('menu');
  };

  return {
    isOpen,
    panelType,
    setPanelType,
    notificationCount,
    buttonRef,
    toggleMenu,
    handleClosePanel,
  };
};