import { useState, useEffect, useRef } from 'react';
import { ActivePanel, NotificationService } from './types';
import { apiService } from '@/services/ApiService';

export function useMainButtonLogic() {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [notificationCount, setNotificationCount] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch initial notification count on component mount
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const counts = await apiService.getNotificationCounts();
        setNotificationCount(counts.unread || 0);
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
        setNotificationCount(0);
      }
    };

    fetchNotificationCount();

    // Set up listener for notification count updates
    const handleNotificationCountChange = (event: CustomEvent) => {
      const { unreadCount } = event.detail;
      setNotificationCount(unreadCount);
    };

    // Add event listener for notification count changes
    document.addEventListener('archimind:notification-count-changed', 
      handleNotificationCountChange as EventListener
    );

    return () => {
      document.removeEventListener('archimind:notification-count-changed', 
        handleNotificationCountChange as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const handleOpenNotifications = () => {
      setIsOpen(true);
      setActivePanel('notifications');
    };

    const handleUpdateBadge = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.count === 'number') {
        setNotificationCount(event.detail.count);
      }
    };

    const handleShowToast = (event: CustomEvent) => {
      if (event.detail) {
        // Implement toast functionality if needed
      }
    };

    document.addEventListener('archimind:open-notifications', handleOpenNotifications);
    document.addEventListener('archimind:update-badge', handleUpdateBadge as EventListener);
    document.addEventListener('archimind:show-toast', handleShowToast as EventListener);

    // Close panels when clicking outside the button/menu area
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActivePanel('none');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('archimind:open-notifications', handleOpenNotifications);
      document.removeEventListener('archimind:update-badge', handleUpdateBadge as EventListener);
      document.removeEventListener('archimind:show-toast', handleShowToast as EventListener);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    if (activePanel === 'menu') {
      setActivePanel('none');
      setIsOpen(false);
    } else {
      setActivePanel('menu');
      setIsOpen(true);
    }
  };

  const openPanel = (panel: ActivePanel) => {
    setActivePanel(panel);
  };

  const handleClosePanel = () => {
    setActivePanel('none');
    setIsOpen(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    console.error("Failed to load logo image from Supabase");
  };

  return {
    isOpen,
    activePanel,
    notificationCount,
    imageLoaded,
    buttonRef,
    menuRef,
    toggleMenu,
    openPanel,
    handleClosePanel,
    handleImageLoad,
    handleImageError,
  };
}