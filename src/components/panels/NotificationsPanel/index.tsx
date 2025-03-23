// src/components/panels/NotificationsPanel/index.tsx

import React from 'react';
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import BasePanel from '../BasePanel';
import { useNotifications } from './useNotifications';
import NotificationItem from './NotificationItem';
import { getMessage } from '@/core/utils/i18n';

interface NotificationsPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  maxHeight?: string;
}

/**
 * Panel that displays user notifications with read/unread status
 */
const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ 
  showBackButton,
  onBack,
  onClose, 
  maxHeight = '400px' 
}) => {
  const {
    notifications,
    loading,
    hasUnread,
    unreadCount,
    handleMarkAllAsRead,
    handleActionClick,
    handleDismiss
  } = useNotifications();

  return (
    <BasePanel
      title={getMessage('notifications', undefined, "Notifications")}
      icon={Bell}
      showBackButton={showBackButton}
      onBack={onBack}
      onClose={onClose}
      className="w-80"
      maxHeight={maxHeight}
      headerClassName="flex flex-row items-center justify-between"
    >
      <div className="flex items-center justify-between mb-2">
        {unreadCount > 0 && (
          <span className="text-xs bg-primary rounded-full h-5 w-5 flex items-center justify-center text-primary-foreground">
            {unreadCount}
          </span>
        )}
        
        {hasUnread && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            className="h-7 px-2 text-xs ml-auto"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            {getMessage('markAllRead', undefined, 'Mark all as read')}
          </Button>
        )}
      </div>
      
      <Separator className="mb-2" />
      
      <div>
        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">{getMessage('loadingNotifications', undefined, 'Loading notifications...')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">{getMessage('noNotifications', undefined, 'No notifications')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onActionClick={handleActionClick}
                onDismiss={handleDismiss}
              />
            ))}
          </ul>
        )}
      </div>
    </BasePanel>
  );
};

export default NotificationsPanel;