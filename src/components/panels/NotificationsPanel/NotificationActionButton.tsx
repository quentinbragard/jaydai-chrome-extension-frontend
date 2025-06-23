// src/components/NotificationsPanel/NotificationActionButton.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { NotificationBase, notificationService } from '@/services/notifications/NotificationService';

interface NotificationActionButtonProps {
  notification: NotificationBase;
  onClick: (notification: NotificationBase) => Promise<void>;
  className?: string;
}

const NotificationActionButton: React.FC<NotificationActionButtonProps> = ({
  notification,
  onClick,
  className = ''
}) => {
  // Get action button details from service
  const actionButton = notificationService.getActionButton(notification);
  
  // If no action button details, don't render anything
  if (!actionButton) {
    return null;
  }
  
  // Get metadata to determine which icon to use
  const metadata = notificationService.parseMetadataSafe(notification.metadata);
  
  // Choose icon based on action type
  const renderIcon = () => {
    if (!metadata) return null;
    
    switch (metadata.action_type) {
      case 'openUrl':
        return <ExternalLink className="jd-h-4 jd-w-4 jd-mr-1" />;
      case 'showSettings':
        return <svg className="jd-h-4 jd-w-4 jd-mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>;
      default:
        console.log("metadata===========", metadata);
        return null;
    }
  };
  
  // Handle click
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onClick(notification);
  };
  
  return (
    <Button
      size="sm"
      variant="secondary"
      className={`jd-text-xs jd-px-3 jd-py-1 jd-h-7 jd-flex jd-items-center ${className}`}
      onClick={handleClick}
    >
      {renderIcon()}
      {actionButton.title}
    </Button>
  );
};

export default NotificationActionButton;