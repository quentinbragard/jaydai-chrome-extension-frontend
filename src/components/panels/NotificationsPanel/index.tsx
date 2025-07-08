// src/components/NotificationsPanel/NotificationsPanel.tsx
import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/notifications/useNotifications';
import NotificationItem from './NotificationItem';
import { Button } from '@/components/ui/button';
import { Bell, RefreshCw, Loader2, CheckSquare } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import BasePanel from '../BasePanel';
import { getMessage } from '@/core/utils/i18n';
import { cn } from '@/core/utils/classNames';
import { trackEvent, EVENTS } from '@/utils/amplitude';

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
  maxHeight = '75vh' 
}) => {
  const {
    notifications,
    loading,
    unreadCount,
    handleMarkAllAsRead,
    handleActionClick,
    handleDismiss,
    handleDelete,
    isRefreshing,
    refresh,
  } = useNotifications();

  useEffect(() => {
    trackEvent(EVENTS.NOTIFICATIONS_PANEL_OPENED);
  }, []);

  // Listen for external open notification requests
  useEffect(() => {
    const handleOpenNotifications = () => {
      // If there's an external request to open notifications,
      // refresh the notifications
      refresh();
    };

    document.addEventListener(
      'jaydai:open-notifications',
      handleOpenNotifications
    );

    return () => {
      document.removeEventListener(
        'jaydai:open-notifications',
        handleOpenNotifications
      );
    };
  }, [refresh]);

  // Create header content
  const headerLeftExtra = unreadCount > 0 ? (
    <span className={cn(
      "jd-bg-red-500 jd-text-white jd-text-xs jd-px-2 jd-py-0.5 jd-rounded-full",
      "jd-ml-2"
    )}>
      {unreadCount}
    </span>
  ) : null;

  const headerRightContent = (
    <Button
      size="sm"
      variant="ghost"
      className="jd-rounded-full jd-flex jd-items-center jd-justify-center"
      onClick={refresh}
      disabled={isRefreshing || loading}
      title="Refresh notifications"
    >
      {isRefreshing ? (
        <Loader2 className="jd-animate-spin" />
      ) : (
        <RefreshCw className="jd-h-4 jd-w-4" />
      )}
    </Button>
  );

  return (
    <BasePanel
      title={getMessage('notifications', undefined, "Notifications")}
      icon={Bell}
      showBackButton={showBackButton}
      onBack={onBack}
      onClose={onClose}
      className="jd-w-80"
      maxHeight={maxHeight}
      headerClassName="jd-flex jd-items-center jd-justify-between"
      headerExtra={headerRightContent}
      headerLeftExtra={headerLeftExtra}
    >
      {/* Notification Controls */}
      {unreadCount > 1 && (
        <div className="jd-flex jd-items-center jd-justify-start jd-mb-4 jd-pb-2 jd-w-full jd-px-4 jd-border-b jd-border-gray-700">
          {/* Mark all read button */}
          <Button
            size="sm"
            variant="outline"
            className="jd-text-xs jd-flex jd-items-center jd-gap-1 jd-h-7"
            onClick={handleMarkAllAsRead}
            disabled={isRefreshing || loading}
            title={getMessage('mark_all_as_read', undefined, 'Mark all as read')}
          >
            <CheckSquare className="jd-h-4 jd-w-4" />
            {getMessage('mark_all_read', undefined, 'Mark all read')}
          </Button>
        </div>
      )}

      {/* Notification Content */}
      {loading ? (
        <div className="jd-flex jd-justify-center jd-items-center jd-py-20">
          <LoadingSpinner size="md" message={getMessage('loading_notifications', undefined, 'Loading notifications...')} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="jd-flex jd-flex-col jd-justify-center jd-items-center jd-py-10 jd-text-gray-400 jd-p-4 jd-text-center">
          <div className="jd-w-16 jd-h-16 jd-rounded-full jd-bg-gray-800 jd-flex jd-items-center jd-justify-center jd-mb-3">
            <Bell className="jd-h-8 jd-w-8 jd-text-gray-500" />
          </div>
          <p className="jd-font-medium">{getMessage('no_notifications', undefined, 'No notifications')}</p>
          <p className="jd-text-xs jd-mt-1 jd-max-w-xs">
            {getMessage('we_will_notify_you_when_there_are_new_updates_or_important_information', undefined, "We'll notify you when there are new updates or important information")}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="jd-mt-4"
            onClick={refresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="jd-h-4 jd-w-4 jd-mr-1.5 jd-animate-spin" />
                {getMessage('checking', undefined, 'Checking...')}
              </>
            ) : (
              <>
                <RefreshCw className="jd-h-4 jd-w-4 jd-mr-1.5" />
                {getMessage('check_for_notifications', undefined, 'Check for notifications')}
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          {/* Notification List */}
          <div className="jd-divide-y jd-divide-gray-700">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onDismiss={handleDismiss}
                onDelete={handleDelete}
                onActionClick={handleActionClick}
              />
            ))}
          </div>
          
          {/* Footer count */}
          <div className="jd-mt-4 jd-pt-2 jd-flex jd-justify-between jd-items-center jd-text-xs jd-text-gray-400">
            {getMessage('notification_count', undefined, 'notification')} {notifications.length}
          </div>
        </>
      )}
    </BasePanel>
  );
};

export default NotificationsPanel;