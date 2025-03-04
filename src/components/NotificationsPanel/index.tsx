// src/components/NotificationsPanel/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Check, Clock, Info, AlertTriangle, CheckCircle, X } from "lucide-react";
import { notificationService, Notification } from '@/services/NotificationService';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsPanelProps {
  onClose?: () => void;
  maxHeight?: string;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ 
  onClose, 
  maxHeight = '400px' 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Register for notification updates
    const cleanup = notificationService.onNotificationsUpdate((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setLoading(false);
    });
    
    // Load notifications
    notificationService.loadNotifications()
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
    
    return cleanup;
  }, []);
  
  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
  };
  
  const handleActionClick = async (notification: Notification) => {
    await notificationService.handleNotificationAction(notification.id);
  };
  
  const handleDismiss = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(notification.id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "some time ago";
    }
  };

  const hasUnread = notifications.some(n => !n.read_at);
  const unreadCount = notifications.filter(n => !n.read_at).length;
  
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
                <li 
                  key={notification.id}
                  onClick={() => handleActionClick(notification)}
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-accent 
                    ${notification.read_at ? 'opacity-70' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.body}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(notification.created_at)}
                        </span>
                        
                        {!notification.read_at && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => handleDismiss(notification, e)}
                            className="h-5 text-xs px-1.5"
                          >
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {notification.action_button && !notification.read_at && (
                    <div className="mt-2 flex justify-end">
                      <Button 
                        size="sm" 
                        className="h-7 text-xs"
                      >
                        {notification.action_button}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsPanel;