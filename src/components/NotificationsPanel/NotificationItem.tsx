import React from 'react';
import { Button } from "@/components/ui/button";
import { Info, AlertTriangle, CheckCircle, Bell, Clock } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Notification } from './types';

interface NotificationItemProps {
  notification: Notification;
  onActionClick: (notification: Notification) => void;
  onDismiss: (notification: Notification, e: React.MouseEvent) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onActionClick,
  onDismiss
}) => {
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

  return (
    <li 
      key={notification.id}
      onClick={() => onActionClick(notification)}
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
                onClick={(e) => onDismiss(notification, e)}
                className="h-5 text-xs px-1.5"
              >
                {chrome.i18n.getMessage('dismiss')}
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
  );
};

export default NotificationItem;