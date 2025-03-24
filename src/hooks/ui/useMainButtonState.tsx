import { useState, useRef, useCallback, useEffect } from 'react';
import { useNotifications } from '@/hooks/notifications/useNotifications';

/**
 * Hook to manage the state of the main button and its panel
 */
export function useMainButtonState() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Get notification count directly from useNotifications hook
  const { unreadCount } = useNotifications();

  // Handle clicks outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // UI event handlers
  const toggleMenu = useCallback(() => {
    setIsOpen(prevIsOpen => !prevIsOpen);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoaded(false);
    console.error("Failed to load logo image");
  }, []);

  return {
    // State
    isOpen,
    notificationCount: unreadCount, // Use the count from useNotifications
    imageLoaded,
    
    // Refs
    buttonRef,
    menuRef,
    
    // Event handlers
    toggleMenu,
    handleClosePanel,
    handleImageLoad,
    handleImageError
  };
}

export default useMainButtonState;