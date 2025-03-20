import React from 'react';
import { Card } from "@/components/ui/card";
import { FileText, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
interface MenuPanelMenuProps {
  onSelect: (panel: 'templates' | 'notifications') => void;
  notificationCount: number;
  onSaveClick: () => void;
  onSettingsClick: () => void;
}

const MenuPanelMenu: React.FC<MenuPanelMenuProps> = ({ onSelect, notificationCount, onSaveClick, onSettingsClick }) => {
  return (
    <Card className="w-48 p-1 shadow-lg">
      <div className="flex flex-col space-y-1">
        <Button variant="ghost" size="sm" className="justify-start" onClick={() => onSelect('templates')}>
          <FileText className="mr-2 h-4 w-4" /> {chrome.i18n.getMessage('templates')}
        </Button>
        <Button variant="ghost" size="sm" className="justify-start" onClick={() => onSelect('notifications')}>
          <Bell className="mr-2 h-4 w-4" /> {chrome.i18n.getMessage('notifications')}
          {notificationCount > 0 && (
            <span className="ml-auto bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5">
              {notificationCount}
            </span>
          )}
        </Button>
        <Button variant="ghost" size="sm" className="justify-start" onClick={onSaveClick}>
          <FileText className="mr-2 h-4 w-4" /> {chrome.i18n.getMessage('saveConversation')}
        </Button>
        <Button variant="ghost" size="sm" className="justify-start" onClick={onSettingsClick}>
          <Settings className="mr-2 h-4 w-4" /> {chrome.i18n.getMessage('settings')}
        </Button>
      </div>
    </Card>
  );
};

export default MenuPanelMenu;
