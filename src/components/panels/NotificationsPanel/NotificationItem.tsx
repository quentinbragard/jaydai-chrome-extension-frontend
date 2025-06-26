import { debug } from '@/core/config';
// src/components/NotificationsPanel/NotificationItem.tsx
import React from 'react';
import { notificationService } from '@/services/notifications/NotificationService';
import { NotificationBase } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2, Check, ExternalLink } from 'lucide-react';

interface NotificationItemProps {
  notification: NotificationBase;
  onDismiss: (notification: NotificationBase, e: React.MouseEvent) => Promise<void>;
  onDelete: (notification: NotificationBase, e: React.MouseEvent) => Promise<void>;
  onActionClick: (notification: NotificationBase) => Promise<void>;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  onDelete,
  onActionClick
}) => {
  // Parse notification time
  const timeAgo = notification.created_at 
    ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
    : '';
    
  // Check if notification is read
  const isRead = !!notification.read_at;
  
  // Get action button details from metadata
  const actionButton = notificationService.getActionButton(notification);
  debug("actionbutton", actionButton);
  
  // Handle notification click
  const handleClick = async () => {
    if (!isRead) {
      await onDismiss(notification, {} as React.MouseEvent);
    }
    await onActionClick(notification);
  };
  
  return (
    <div 
      className={`
        jd-group jd-relative jd-flex jd-flex-col jd-p-3 jd-border-b jd-border-[var(--border)] 
        ${isRead ? 'jd-bg-background' : 'jd-bg-background/50'} 
        hover:jd-bg-[var(--secondary)] 
        jd-transition-colors jd-duration-200 jd-cursor-pointer
      `}
    >
      {/* Main notification content */}
      <div className="jd-flex jd-items-start jd-gap-2" onClick={handleClick}>
        {/* Notification status indicator */}
        {!isRead && (
          <div className="jd-mt-1.5 jd-w-2 jd-h-2 jd-rounded-full jd-bg-blue-500 jd-flex-shrink-0" />
        )}
        
        {/* Notification content */}
        <div className="jd-flex-1">
          {/* Title row with timestamp */}
          <div className="jd-flex jd-justify-between jd-items-start jd-mb-1">
            <h4 className={`jd-text-sm jd-font-medium jd-pr-12 ${isRead ? 'jd-text-gray-500' : 'jd-text-foreground'}`}>
              {notification.title}
            </h4>
            <span className="jd-text-xs jd-text-gray-500 jd-whitespace-nowrap jd-flex-shrink-0">
              {timeAgo}
            </span>
          </div>
          
          {/* Message body */}
          <p className={`jd-text-sm jd-mt-1 ${isRead ? 'jd-text-gray-500' : 'jd-text-gray-700'}`}>
            {notification.body}
          </p>
          
          {/* Bottom row with action buttons */}
          <div className="jd-mt-2 jd-flex jd-justify-between jd-items-center">
            {/* Action button (if available) from metadata */}
            <div className="jd-flex-1">
              {actionButton && actionButton.type === 'openUrl' && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="jd-text-xs jd-px-3 jd-py-1 jd-h-7 jd-flex jd-items-center jd-gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onActionClick(notification);
                  }}
                >
                  <ExternalLink className="jd-h-3 jd-w-3" />
                  {actionButton.title}
                </Button>
              )}
            </div>
            
            {/* Action icons (mark as read/delete) */}
            <div className="jd-flex jd-gap-1 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity jd-duration-200">
              {!isRead && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="jd-rounded-full jd-bg-green-900/20 hover:jd-bg-green-800/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(notification, e);
                  }}
                  title="Mark as read"
                >
                  <Check className="jd-h-4 jd-w-4 jd-text-green-500" />
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                className="jd-rounded-full jd-bg-red-900/20 hover:jd-bg-red-800/30"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification, e);
                }}
                title="Delete notification"
              >
                <Trash2 className="jd-h-4 jd-w-4 jd-text-[var(--destructive)]" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;