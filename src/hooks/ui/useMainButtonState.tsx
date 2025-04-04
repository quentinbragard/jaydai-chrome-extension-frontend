// src/hooks/ui/useMainButtonState.ts

import { useState, useRef, useEffect } from 'react';

export type PanelType = 'menu' | 'notifications' | 'templates' | 'stats';

export const useMainButtonState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [panelType, setPanelType] = useState<PanelType>('menu');
  const [notificationCount, setNotificationCount] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Listen for notification count changes
  useEffect(() => {
    const handleNotificationCountChanged = (event: CustomEvent) => {
      const { unreadCount } = event.detail;
      setNotificationCount(unreadCount);
    };

    document.addEventListener(
      'jaydai:notification-count-changed',
      handleNotificationCountChanged as EventListener
    );

    return () => {
      document.removeEventListener(
        'jaydai:notification-count-changed',
        handleNotificationCountChanged as EventListener
      );
    };
  }, []);

  // Listen for open notifications requests
  useEffect(() => {
    const handleOpenNotifications = () => {
      setIsOpen(true);
      setPanelType('notifications');
    };

    document.addEventListener(
      'jaydai:open-notifications',
      handleOpenNotifications
    );

    return () => {
      document.removeEventListener(
        'jaydai:open-notifications',
        handleOpenNotifications
      );
    };
  }, []);

  // Toggle menu open/closed
  const toggleMenu = () => {
    setIsOpen(prev => !prev);
    // Reset to menu panel when toggling
    if (!isOpen) {
      setPanelType('menu');
    }
  };

  // Close panel
  const handleClosePanel = () => {
    setIsOpen(false);
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