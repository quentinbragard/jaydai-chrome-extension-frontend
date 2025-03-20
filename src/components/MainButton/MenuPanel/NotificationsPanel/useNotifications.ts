// src/components/NotificationsPanel/useNotifications.ts
import { useState, useEffect } from 'react';
import { Notification } from './types';
// Import the consolidated notification service
import { notificationService } from '@/services/notifications/NotificationService';

export function useNotifications() {
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
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    
    return cleanup;
  }, []);

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    // The UI will update automatically through the onNotificationsUpdate listener
  };

  const handleActionClick = async (notification: Notification) => {
    await notificationService.handleNotificationAction(notification.id);
  };

  const handleDismiss = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(notification.id);
    // The UI will update automatically through the onNotificationsUpdate listener
  };

  const hasUnread = notifications.some(n => !n.read_at);
  const unreadCount = notifications.filter(n => !n.read_at).length;

  return {
    notifications,
    loading,
    hasUnread,
    unreadCount,
    handleMarkAllAsRead,
    handleActionClick,
    handleDismiss
  };
}