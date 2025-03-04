// src/components/MainButton/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import NotificationsPanel from '@/components/NotificationsPanel';
import TemplatesPanel from '@/components/TemplatesPanel';
import { PlusCircle, FileText, Bell, ChevronDown, Settings, X } from "lucide-react";
import { notificationService } from '@/services/NotificationService';

interface MainButtonProps {
  onSettingsClick?: () => void;
  onSaveClick?: () => void;
}

type ActivePanel = 'none' | 'notifications' | 'templates' | 'menu';

export const MainButton: React.FC<MainButtonProps> = ({
  onSettingsClick,
  onSaveClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [notificationCount, setNotificationCount] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Get initial notification count
    const unreadCount = notificationService.getUnreadCount();
    setNotificationCount(unreadCount);
    
    // Register for notification updates
    const cleanup = notificationService.onNotificationsUpdate(() => {
      setNotificationCount(notificationService.getUnreadCount());
    });
    
    // Listen for custom events
    document.addEventListener('archimind:open-notifications', handleOpenNotifications);
    document.addEventListener('archimind:update-badge', handleUpdateBadge as EventListener);
    document.addEventListener('archimind:show-toast', handleShowToast as EventListener);
    
    // Close panels when clicking outside
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
      cleanup();
      document.removeEventListener('archimind:open-notifications', handleOpenNotifications);
      document.removeEventListener('archimind:update-badge', handleUpdateBadge as EventListener);
      document.removeEventListener('archimind:show-toast', handleShowToast as EventListener);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
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
      const { title, description, type } = event.detail;
      if (type === 'success') {
        toast.success(title, { description });
      } else if (type === 'error') {
        toast.error(title, { description });
      } else if (type === 'warning') {
        toast.warning(title, { description });
      } else {
        toast.info(title, { description });
      }
    }
  };
  
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
    if (onSaveClick) onSaveClick();
    handleClosePanel();
  };
  
  const handleSettingsClick = () => {
    if (onSettingsClick) onSettingsClick();
    handleClosePanel();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Active Panel */}
      {isOpen && (
        <div 
          ref={menuRef}
          className="mb-4 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150"
        >
          {activePanel === 'notifications' && (
            <NotificationsPanel onClose={handleClosePanel} />
          )}
          
          {activePanel === 'templates' && (
            <TemplatesPanel onClose={handleClosePanel} />
          )}
          
          {activePanel === 'menu' && (
            <Card className="w-48 p-1 shadow-lg">
              <div className="flex flex-col space-y-0.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start"
                  onClick={() => openPanel('templates')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Templates
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start"
                  onClick={() => openPanel('notifications')}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                  {notificationCount > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5">
                      {notificationCount}
                    </span>
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start"
                  onClick={handleSaveClick}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Save Conversation
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start"
                  onClick={handleSettingsClick}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
      
      {/* Main Button */}
      <Button 
        ref={buttonRef}
        className="h-12 w-12 rounded-full shadow-lg relative"
        variant="primary"
        onClick={toggleMenu}
      >
        {activePanel === 'menu' ? (
          <X className="h-6 w-6" />
        ) : (
          <PlusCircle className="h-6 w-6" />
        )}
        
        {notificationCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </Button>
      
      <Toaster richColors />
    </div>
  );
};

export default MainButton;