// src/components/NotificationsPanel/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@/services/notifications/NotificationService';
import { notificationService } from '@/services/notifications/NotificationService';

export interface UseNotificationsResult {
  notifications: Notification[];
  loading: boolean;
  hasUnread: boolean;
  unreadCount: number;
  handleMarkAllAsRead: () => Promise<void>;
  handleActionClick: (notification: Notification) => Promise<void>;
  handleDismiss: (notification: Notification, e: React.MouseEvent) => Promise<void>;
  handleDelete: (notification: Notification, e: React.MouseEvent) => Promise<void>;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Initial load
  useEffect(() => {
    let isMounted = true;
    
    const loadNotifications = async () => {
      setLoading(true);
      try {
        const data = await notificationService.loadNotifications();
        
        if (isMounted) {
          setNotifications(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        if (isMounted) setLoading(false);
      }
    };
    
    // Register for notification updates
    const cleanup = notificationService.onNotificationsUpdate((updatedNotifications) => {
      if (isMounted) {
        setNotifications(updatedNotifications);
        setLoading(false);
      }
    });
    
    loadNotifications();
    
    return () => {
      isMounted = false;
      cleanup();
    };
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
  }, []);

  const handleActionClick = useCallback(async (notification: Notification) => {
    await notificationService.handleNotificationAction(notification.id);
  }, []);

  const handleDismiss = useCallback(async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(notification.id);
  }, []);
  
  const handleDelete = useCallback(async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.deleteNotification(notification.id);
  }, []);
  
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await notificationService.loadNotifications(true);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const hasUnread = notifications.some(n => !n.read_at);
  const unreadCount = notifications.filter(n => !n.read_at).length;

  return {
    notifications,
    loading,
    hasUnread,
    unreadCount,
    handleMarkAllAsRead,
    handleActionClick,
    handleDismiss,
    handleDelete,
    isRefreshing,
    refresh
  };
}