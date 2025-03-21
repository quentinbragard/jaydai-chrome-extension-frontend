// src/components/MainButton/hooks/useMainButtonState.ts
import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseMainButtonStateProps {
  onSettingsClick?: () => void;
  onSaveClick?: () => void;
}

export function useMainButtonState({ onSettingsClick, onSaveClick }: UseMainButtonStateProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPlaceholderEditorOpen, setIsPlaceholderEditorOpen] = useState(false);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle notification counts
  useEffect(() => {
    // Fetch initial counts
    const fetchNotificationCount = async () => {
      try {
        // You would typically call an API service here
        // For now we use a mock count
        setNotificationCount(3); // Example count - replace with actual API call
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };

    fetchNotificationCount();

    // Listen for count changes
    const handleCountChange = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.unreadCount === 'number') {
        setNotificationCount(event.detail.unreadCount);
      }
    };

    document.addEventListener(
      'archimind:notification-count-changed',
      handleCountChange as EventListener
    );
    
    // Listen for placeholder editor state
    const handlePlaceholderEditorOpen = () => {
      setIsPlaceholderEditorOpen(true);
    };
    
    const handlePlaceholderEditorClose = () => {
      setIsPlaceholderEditorOpen(false);
    };
    
    document.addEventListener('archimind:placeholder-editor-opened', handlePlaceholderEditorOpen);
    document.addEventListener('archimind:placeholder-editor-closed', handlePlaceholderEditorClose);

    return () => {
      document.removeEventListener(
        'archimind:notification-count-changed',
        handleCountChange as EventListener
      );
      document.removeEventListener('archimind:placeholder-editor-opened', handlePlaceholderEditorOpen);
      document.removeEventListener('archimind:placeholder-editor-closed', handlePlaceholderEditorClose);
    };
  }, []);

  // Handle clicks outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Skip this check if placeholder editor is open
      if (isPlaceholderEditorOpen) {
        return;
      }
      
      // Check if we're clicking on a dialog or inside a dialog
      const isDialogClick = (e.target as Element)?.closest('[role="dialog"]');
      if (isDialogClick) {
        return; // Don't close if clicking inside any dialog
      }
      
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
  }, [isOpen, isPlaceholderEditorOpen]);

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

  const handleSaveClick = useCallback(() => {
    if (onSaveClick) onSaveClick();
    handleClosePanel();
  }, [onSaveClick, handleClosePanel]);

  const handleSettingsClick = useCallback(() => {
    if (onSettingsClick) onSettingsClick();
    handleClosePanel();
  }, [onSettingsClick, handleClosePanel]);

  return {
    // State
    isOpen,
    notificationCount,
    imageLoaded,
    isPlaceholderEditorOpen,
    
    // Refs
    buttonRef,
    menuRef,
    
    // Event handlers
    toggleMenu,
    handleClosePanel,
    handleImageLoad,
    handleImageError,
    handleSaveClick,
    handleSettingsClick,
    setIsPlaceholderEditorOpen
  };
}