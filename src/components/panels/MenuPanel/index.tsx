// src/components/panels/MenuPanel/index.tsx

import React from 'react';
import { FileText, Bell, BarChart, Blocks, PlayCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePanelNavigation } from '@/core/contexts/PanelNavigationContext';
import BasePanel from '../BasePanel';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';
import { useUserMetadata } from '@/hooks/prompts/queries/user';
import { userApi } from '@/services/api/UserApi';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useQueryClient } from 'react-query';
import { toast } from 'sonner';

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
  const { openInsertBlock, openTutorials, openConfirmation } = useDialogActions();
  const { data: userMetadata } = useUserMetadata();
  const queryClient = useQueryClient();

  // Navigate to a specific panel
  const navigateToPanel = (panelType: 'templates' | 'notifications' | 'stats' | 'settings') => {
    pushPanel({ type: panelType });
  };

  const enableDataCollection = async () => {
    try {
      const response = await userApi.updateDataCollection(true);
      if (response.success) {
        toast.success(getMessage('data_collection_enabled', undefined, 'Data collection enabled'));
        queryClient.setQueryData([QUERY_KEYS.USER_METADATA], (old: any) => ({
          ...(old || {}),
          data_collection: true,
        }));
        navigateToPanel('stats');
      } else {
        throw new Error(response.message || 'Failed to update preference');
      }
    } catch (error) {
      console.error('Error enabling data collection:', error);
      toast.error(getMessage('error_updating_preference', undefined, 'Failed to update preference'));
    }
  };

  const handleStatsClick = () => {
    if (userMetadata?.data_collection === false) {
      openConfirmation({
        title: getMessage('enable_data_collection', undefined, 'Enable Data Collection'),
        description: getMessage('enable_data_collection_desc', undefined, 'Data collection must be enabled to view your AI statistics. Do you want to enable it now?'),
        confirmText: getMessage('enable', undefined, 'Enable'),
        cancelText: getMessage('cancel', undefined, 'Cancel'),
        onConfirm: enableDataCollection,
      });
    } else {
      navigateToPanel('stats');
    }
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
      id: 'blockBuilder',
      icon: <Blocks className="jd-h-4 jd-w-4" />,
      label: getMessage('blockBuilder', undefined, 'Block Builder'),
      action: () => openInsertBlock()
    },
    {
      id: 'stats',
      icon: <BarChart className="jd-h-4 jd-w-4" />,
      label: getMessage('aiStats', undefined, 'AI Stats'),
      action: handleStatsClick
    },
    {
      id: 'notifications',
      icon: <Bell className="jd-h-4 jd-w-4" />,
      label: getMessage('notifications', undefined, 'Notifications'),
      action: () => navigateToPanel('notifications'),
      badge: notificationCount
    },
    {
      id: 'tutorials',
      icon: <PlayCircle className="jd-h-4 jd-w-4" />,
      label: getMessage('tutorials', undefined, 'Tutorials'),
      action: () => openTutorials()
    },
    {
      id: 'settings',
      icon: <Settings className="jd-h-4 jd-w-4" />,
      label: getMessage('settings', undefined, 'Settings'),
      action: () => navigateToPanel('settings')
    }
  ];

  return (
    <BasePanel
      onClose={onClose}
      className="jd-w-56 jd-relative"
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