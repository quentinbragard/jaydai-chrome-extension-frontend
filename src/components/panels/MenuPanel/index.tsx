// src/components/panels/MenuPanel/index.tsx

import React from 'react';
import { FileText, Bell, BarChart, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePanelNavigation } from '@/core/contexts/PanelNavigationContext';
import BasePanel from '../BasePanel';
import { getMessage } from '@/core/utils/i18n';
import { toast } from 'sonner';
import { trackEvent, EVENTS } from '@/utils/amplitude';

// Define a type for our menu items
type MenuItem = {
  id: string;
  icon: React.ReactNode;
  label: string;
  action: () => void;
  badge?: number;
};

// A reusable menu item component for better modularity
const MenuItemButton: React.FC<MenuItem> = ({ icon, label, action, badge }) => {
  const handleClick = () => {
    trackEvent(EVENTS.MENU_ITEM_CLICKED, {
      menu_item: label
    });
    action();
  };
  return (
    <div className="jd-w-full">
      <Button 
      variant="ghost" 
      size="sm" 
      className="jd-justify-start jd-items-center jd-w-full jd-text-left jd-px-2"
      onClick={handleClick}
    >
      <span className="jd-flex jd-items-center jd-w-full">
        <span className="jd-mr-2">{icon}</span>
        <span>{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="jd-ml-auto jd-bg-red-500 jd-text-white jd-rounded-full jd-text-xs jd-px-1.5 jd-py-0.5">
            {badge}
          </span>
        )}
      </span>
    </Button>
  </div>
)
};

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

  // Navigate to a specific panel
  const navigateToPanel = (panelType: 'templates' | 'notifications' | 'stats') => {
    pushPanel({ type: panelType });
  };



  // Open external link
  const openExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  // Define menu items for better maintainability
  const menuItems: MenuItem[] = [
    {
      id: 'templates',
      icon: <FileText className="jd-h-4 jd-w-4" />,
      label: getMessage('templates', undefined, 'Templates'),
      action: () => navigateToPanel('templates')
    },
    {
      id: 'stats',
      icon: <BarChart className="jd-h-4 jd-w-4" />,
      label: getMessage('aiStats', undefined, 'AI Stats'),
      action: () => navigateToPanel('stats')
    },
    {
      id: 'notifications',
      icon: <Bell className="jd-h-4 jd-w-4" />,
      label: getMessage('notifications', undefined, 'Notifications'),
      action: () => navigateToPanel('notifications'),
      badge: notificationCount
    },
    {
      id: 'news',
      icon: <Save className="jd-h-4 jd-w-4" />,
      label: getMessage('aiNews', undefined, 'AI News'),
      action: () => openExternalLink('https://thetunnel.substack.com/?utm_source=jaydai-extension')
    }
  ];

  return (
    <BasePanel
      onClose={onClose}
      className="jd-w-56"
    >
      <Card className="jd-p-1 jd-shadow-none jd-border-0 jd-bg-background jd-text-foreground jd-w-full">
        <div className="jd-flex jd-flex-col jd-space-y-1 jd-w-full">
          {menuItems.map((item) => (
            <MenuItemButton
              key={item.id}
              {...item}
            />
          ))}
        </div>
      </Card>
    </BasePanel>
  );
};

export default MenuPanel;