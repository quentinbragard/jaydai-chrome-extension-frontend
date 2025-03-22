import React from 'react';
import { Card } from "@/components/ui/card";
import { FileText, Bell, Settings, Save, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePanelNavigation } from '@/core/hooks/usePanelNavigation';
import { dialogManager } from '@/core/managers/DialogManager'; // Import dialogManager

interface MenuPanelMenuProps {
  notificationCount: number;
  onSettingsClick: () => void;
}

const MenuPanelMenu: React.FC<MenuPanelMenuProps> = ({ 
  notificationCount, 
  onSettingsClick 
}) => {
  const { pushPanel } = usePanelNavigation();

  // Handle browse templates click
  const handleBrowseTemplates = () => {
    pushPanel({ type: 'templatesBrowse' });
  };

  // Handle create template click
  const handleCreateTemplate = () => {
    dialogManager.openDialog('createTemplate');
  };

  return (
    <Card className="w-48 p-1 shadow-lg">
      <div className="flex flex-col space-y-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start" 
          onClick={() => pushPanel({ type: 'templates' })}
        >
          <FileText className="mr-2 h-4 w-4" /> {chrome.i18n.getMessage('templates') || 'Templates'}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start" 
          onClick={() => pushPanel({ type: 'stats' })}
        >
          <BarChart className="mr-2 h-4 w-4" /> {chrome.i18n.getMessage('aiStats') || 'AI Stats'}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start" 
          onClick={() => pushPanel({ type: 'notifications' })}
        >
          <Bell className="mr-2 h-4 w-4" /> {chrome.i18n.getMessage('notifications') || 'Notifications'}
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
          onClick={() => window.open('https://thetunnel.substack.com/?utm_source=archimind-extension', '_blank')}
        >
          <Save className="mr-2 h-4 w-4" /> {chrome.i18n.getMessage('aiNews') || 'AI News'}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start" 
          onClick={onSettingsClick}
        >
          <Settings className="mr-2 h-4 w-4" /> {chrome.i18n.getMessage('settings') || 'Settings'}
        </Button>
      </div>
    </Card>
  );
};

export default MenuPanelMenu;