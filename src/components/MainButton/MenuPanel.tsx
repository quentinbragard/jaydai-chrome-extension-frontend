import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Bell, Settings, ArrowLeft } from "lucide-react";
import NotificationsPanel from '../NotificationsPanel';
import TemplatesPanel from '../TemplatesPanel';
import { ActivePanel } from './types';

interface MenuPanelProps {
  isOpen: boolean;
  activePanel: ActivePanel;
  notificationCount: number;
  menuRef: React.RefObject<HTMLDivElement>;
  openPanel: (panel: ActivePanel) => void;
  handleClosePanel: () => void;
  handleSaveClick: () => void;
  handleSettingsClick: () => void;
}

const MenuPanel: React.FC<MenuPanelProps> = ({
  isOpen,
  activePanel,
  notificationCount,
  menuRef,
  openPanel,
  handleClosePanel,
  handleSaveClick,
  handleSettingsClick
}) => {
  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute backdrop-blur-sm bottom-full mb-2 right-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150"
    >
      {(activePanel === 'notifications' || activePanel === 'templates') && (
        <div className="flex flex-col w-full items-start justify-start">
          {/* Back to menu button using lucide-react ArrowLeft icon */}
          <Button 
            variant="ghost"
            size="sm"
            className="flex items-start px-2 py-1 bg-muted/30 rounded-t-lg hover:bg-muted/50 transition-colors"
            onClick={() => openPanel('menu')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-xs">Back</span>
          </Button>
          {activePanel === 'notifications' && <NotificationsPanel onClose={handleClosePanel} />}
          {activePanel === 'templates' && <TemplatesPanel onClose={handleClosePanel} />}
        </div>
      )}
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
  );
};

export default MenuPanel; 