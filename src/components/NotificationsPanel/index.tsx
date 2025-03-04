import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Check, X } from "lucide-react";
import { useNotifications } from './useNotifications';
import { NotificationsPanelProps } from './types';
import NotificationItem from './NotificationItem';

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ 
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
    <Card className="w-80 shadow-lg">
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium flex items-center">
          <Bell className="mr-2 h-4 w-4" />
          Notifications 
          {unreadCount > 0 && (
            <span className="ml-2 text-xs bg-primary rounded-full h-5 w-5 flex items-center justify-center text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </CardTitle>
        <div className="flex gap-1">
          {hasUnread && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="h-7 px-2 text-xs"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="p-0">
        <div 
          className="overflow-y-auto py-1" 
          style={{ maxHeight }}
        >
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">You don't have any notifications yet</p>
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
      </CardContent>
    </Card>
  );
};

export default NotificationsPanel;