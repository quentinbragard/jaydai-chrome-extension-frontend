// src/components/panels/MenuPanel/index.tsx

import React from 'react';
import { MenuIcon, FileText, Bell, BarChart, Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePanelNavigation } from '@/core/contexts/PanelNavigationContext';
import BasePanel from '../BasePanel';

interface MenuPanelProps {
  onClose: () => void;
  notificationCount: number;
}

/**
 * Root menu panel that allows navigation to other panels
 */
const MenuPanel: React.FC<MenuPanelProps> = ({
  onClose,
  notificationCount,
}) => {
  const { pushPanel } = usePanelNavigation();

  // Handle navigation to other panels
  const handleNavigate = (panelType: 'templates' | 'notifications' | 'stats') => {
    pushPanel({ type: panelType });
  };

  // Handle settings click - open settings dialog
const handleSettingsClick = () => {
  if (window.dialogManager) {
    window.dialogManager.openDialog('settings');
  } else {
    console.error('Dialog manager not available');
    toast.error('Could not open settings. Please try again.');
  }
};

  // Handle AI news click - open external link
  const handleAiNewsClick = () => {
    window.open('https://thetunnel.substack.com/?utm_source=archimind-extension', '_blank');
  };

  return (
    <BasePanel
      title={chrome.i18n.getMessage('menu') || "Menu"}
      icon={MenuIcon}
      onClose={onClose}
      className="w-56"
    >
      <Card className="p-1 shadow-none border-0 bg-background text-foreground">
        <div className="flex flex-col space-y-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start" 
            onClick={() => handleNavigate('templates')}
          >
            <FileText className="mr-2 h-4 w-4" /> {chrome.i18n.getMessage('templates') || 'Templates'}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start" 
            onClick={() => handleNavigate('stats')}
          >
            <BarChart className="mr-2 h-4 w-4" /> {chrome.i18n.getMessage('aiStats') || 'AI Stats'}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start" 
            onClick={() => handleNavigate('notifications')}
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
            onClick={handleAiNewsClick}
          >
            <Save className="mr-2 h-4 w-4" /> {chrome.i18n.getMessage('aiNews') || 'AI News'}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start" 
            onClick={handleSettingsClick}
          >
            <Settings className="mr-2 h-4 w-4" /> {chrome.i18n.getMessage('settings') || 'Settings'}
          </Button>
        </div>
      </Card>
    </BasePanel>
  );
};

export default MenuPanel;