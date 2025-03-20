import React, { useState, useEffect, useRef } from 'react';
import { Toaster } from "sonner";
import ButtonIcon from './ButtonIcon';
import MenuPanel from './MenuPanel';

interface MainButtonProps {
  onSettingsClick?: () => void;
  onSaveClick?: () => void;
}

const MainButton: React.FC<MainButtonProps> = ({ onSettingsClick, onSaveClick }) => {
  // Simple state for whether the menu is open or not
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
        // For now, let's use a placeholder
        setNotificationCount(3); // Example count
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

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleClosePanel = () => {
    setIsOpen(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    console.error("Failed to load logo image");
  };

  const handleSaveClick = () => {
    onSaveClick && onSaveClick();
    handleClosePanel();
  };

  const handleSettingsClick = () => {
    onSettingsClick && onSettingsClick();
    handleClosePanel();
  };

  return (
    <div className="fixed bottom-6 right-2 z-[9999]">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Panel that appears above the main button */}
        <MenuPanel
          isOpen={isOpen}
          notificationCount={notificationCount}
          menuRef={menuRef}
          onClosePanel={handleClosePanel}
          onSaveClick={handleSaveClick}
          onSettingsClick={handleSettingsClick}
          setIsPlaceholderEditorOpen={setIsPlaceholderEditorOpen}
        />

        {/* Main Button with logo */}
        <ButtonIcon
          isOpen={isOpen}
          notificationCount={notificationCount}
          buttonRef={buttonRef}
          toggleMenu={toggleMenu}
          handleImageLoad={handleImageLoad}
          handleImageError={handleImageError}
        />
      </div>
      <Toaster />
    </div>
  );
};

export default MainButton;