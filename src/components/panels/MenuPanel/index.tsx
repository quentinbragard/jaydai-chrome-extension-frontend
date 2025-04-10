// src/components/panels/MenuPanel/index.tsx

import React from 'react';
import { MenuIcon, FileText, Bell, BarChart, Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePanelNavigation } from '@/core/contexts/PanelNavigationContext';
import BasePanel from '../BasePanel';
import { getMessage } from '@/core/utils/i18n';
import { toast } from 'sonner';

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
      toast.error('Could basnot open settings. Please try again.');
    }
  };

  // Handle AI news click - open external link
  const handleAiNewsClick = () => {
    window.open('https://thetunnel.substack.com/?utm_source=jaydai-extension', '_blank');
  };

  return (
    <BasePanel
      icon={MenuIcon}
      onClose={onClose}
      className="jd-w-56"
    >
      <Card className="jd-p-1 jd-shadow-none jd-border-0 jd-bg-background jd-text-foreground jd-w-full">
        <div className="jd-flex jd-flex-col jd-space-y-1 jd-items-start jd-justify-start jd-w-full">
          <div className="jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-rounded-sm jd-cursor-pointer jd-group jd-w-full">
          <Button 
            variant="ghost" 
            size="sm" 
            className="jd-justify-start" 
            onClick={() => handleNavigate('templates')}
          >
              <FileText className="jd-mr-2 jd-h-4 jd-w-4" /> 
              {getMessage('templates', undefined, 'Templates')}
            </Button>
          </div>
          
          <div className="jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-rounded-sm jd-cursor-pointer jd-group jd-w-full">
          <Button 
            variant="ghost" 
            size="sm" 
            className="jd-justify-start" 
            onClick={() => handleNavigate('stats')}
          >
            <BarChart className="jd-mr-2 jd-h-4 jd-w-4" /> 
              {getMessage('aiStats', undefined, 'AI Stats')}
            </Button>
          </div>

          <div className="jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-rounded-sm jd-cursor-pointer jd-group jd-w-full">
          <Button 
            variant="ghost" 
            size="sm" 
            className="jd-justify-start" 
            onClick={() => handleNavigate('notifications')}
          >
            <Bell className="jd-mr-2 jd-h-4 jd-w-4" /> 
            {getMessage('notifications', undefined, 'Notifications')}
            {notificationCount > 0 && (
              <span className="jd-ml-auto jd-bg-red-500 jd-text-white jd-rounded-full jd-text-xs jd-px-1.5 jd-py-0.5">
                {notificationCount}
              </span>
            )}
          </Button>
          </div>

          <div className="jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-rounded-sm jd-cursor-pointer jd-group jd-w-full"> 
          <Button 
            variant="ghost" 
            size="sm" 
            className="jd-justify-start" 
            onClick={handleAiNewsClick}
          >
            <Save className="jd-mr-2 jd-h-4 jd-w-4" /> 
            {getMessage('aiNews', undefined, 'AI News')}
          </Button>
          </div>
         {/*}
          <div className="jd-flex jd-items-center jd-p-2 hover:jd-bg-accent/60 jd-rounded-sm jd-cursor-pointer jd-group jd-w-full">
          <Button 
            variant="ghost" 
            size="sm" 
            className="jd-justify-start" 
            onClick={handleSettingsClick}
          >
            <Settings className="jd-mr-2 jd-h-4 jd-w-4" /> 
            {getMessage('settings', undefined, 'Settings')}
          </Button>
          </div>
          */}
        </div>
      </Card>
    </BasePanel>
  );
};

export default MenuPanel;