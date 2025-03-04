import { useState, useEffect } from 'react';
import { Notification } from './types';
import notificationService from './notificationService';

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
    setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })));
  };

  const handleActionClick = async (notification: Notification) => {
    await notificationService.handleNotificationAction(notification.id);
  };

  const handleDismiss = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(notification.id);
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
    ));
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