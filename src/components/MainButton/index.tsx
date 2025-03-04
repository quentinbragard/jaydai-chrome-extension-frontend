import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toaster } from "sonner";
import NotificationsPanel from '../NotificationsPanel';
import TemplatesPanel from '../TemplatesPanel';
import { X, FileText, Bell, Settings, ShieldAlert } from "lucide-react";

// Use the Supabase public bucket URL for the logo
const SUPABASE_LOGO_URL = "https://gjszbwfzgnwblvdehzcq.supabase.co/storage/v1/object/public/chrome_extension_assets/archimind-logo.png";

interface MainButtonProps {
  onSettingsClick?: () => void;
  onSaveClick?: () => void;
}

type ActivePanel = 'none' | 'notifications' | 'templates' | 'menu';

const MainButton: React.FC<MainButtonProps> = ({ onSettingsClick, onSaveClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [notificationCount, setNotificationCount] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Mock notification service
  const notificationService = {
    getUnreadCount: () => 3,
    onNotificationsUpdate: (callback: () => void) => {
      setTimeout(callback, 1000);
      return () => {};
    }
  };

  useEffect(() => {
    const updateNotificationCount = () => {
      setNotificationCount(notificationService.getUnreadCount());
    };

    updateNotificationCount();
    const cleanupNotifications = notificationService.onNotificationsUpdate(updateNotificationCount);

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
      cleanupNotifications();
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

  const handleSaveClick = () => {
    onSaveClick && onSaveClick();
    handleClosePanel();
  };

  const handleSettingsClick = () => {
    onSettingsClick && onSettingsClick();
    handleClosePanel();
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    console.error("Failed to load logo image from Supabase");
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Wrap the button and panel in a relative container */}
      <div className="relative">
        {/* Panel that appears above the main button */}
        {isOpen && (
          <div 
            ref={menuRef}
            className="absolute bottom-full mb-2 right-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150"
          >
            {activePanel === 'notifications' && <NotificationsPanel onClose={handleClosePanel} />}
            {activePanel === 'templates' && <TemplatesPanel onClose={handleClosePanel} />}
            {activePanel === 'menu' && (
              <Card className="w-48 p-1 shadow-lg">
                <div className="flex flex-col space-y-1">
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => openPanel('templates')}>
                    <FileText className="mr-2 h-4 w-4" /> Templates
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => openPanel('notifications')}>
                    <Bell className="mr-2 h-4 w-4" /> Notifications
                    {notificationCount > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5">
                        {notificationCount}
                      </span>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start" onClick={handleSaveClick}>
                    <FileText className="mr-2 h-4 w-4" /> Save Conversation
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start" onClick={handleSettingsClick}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Main Button with logo loaded from Supabase */}
        <Button 
          ref={buttonRef}
          onClick={toggleMenu}
          className="h-16 w-16 rounded-full shadow-lg relative bg-white p-0 overflow-hidden flex items-center justify-center"
        >
          <img 
            src={SUPABASE_LOGO_URL} 
            alt="Archimind Logo" 
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Optional overlay icon when open */}
          {isOpen && (
            <div className="absolute top-1 right-1 bg-white rounded-full p-1 z-10">
              <X className="h-4 w-4 text-gray-800" />
            </div>
          )}
          
          {/* Notification badge when closed */}
          {notificationCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center z-10">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Button>
      </div>
      <Toaster />
    </div>
  );
};

export default MainButton;