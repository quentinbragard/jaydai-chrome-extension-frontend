// src/services/NotificationService.ts
import { toast } from "sonner";
import { notificationApi } from "../api/NotificationApi";

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'welcome_first_conversation' | 
         'insight_prompt_length' | 'insight_response_time' | 'insight_conversation_quality' | string;
  action_button?: string;
  created_at: string;
  read_at?: string | null;
  seen_at?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Service to manage notifications
 * Single instance to be used throughout the extension
 */
export class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private isLoading: boolean = false;
  private lastLoadTime: number = 0;
  private pollingInterval: number | null = null;
  private updateCallbacks: ((notifications: Notification[]) => void)[] = [];
  private unreadCount: number = 0;
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  /**
   * Initialize the notification service
   */
  public async initialize(): Promise<void> {
    console.log('🔔 Initializing notification service...');
    
    // Load notifications immediately
    await this.loadNotifications();
    
    // Start polling for new notifications
    this.startPolling();
    
    console.log('✅ Notification service initialized');
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.updateCallbacks = [];
    console.log('✅ Notification service cleaned up');
  }
  
  /**
   * Load notifications from backend
   * @param forceRefresh - Force refresh even if recently loaded
   */
  public async loadNotifications(forceRefresh = false): Promise<Notification[]> {
    // Skip if we've loaded recently (within 1 minute) and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && this.lastLoadTime > 0 && now - this.lastLoadTime < 60000) {
      return [...this.notifications];
    }
    
    // Skip if already loading
    if (this.isLoading) {
      return [...this.notifications];
    }
    
    this.isLoading = true;
    
    try {
      console.log('🔔 Loading notifications...');
      
      // Get previous unread count for comparison
      const previousUnreadCount = this.getUnreadCount();
      
      // Call API to get notifications
      const data = await notificationApi.fetchNotifications();
      
      if (data) {
        this.notifications = data || [];
        this.lastLoadTime = now;
        
        // Calculate new unread count
        const newUnreadCount = this.getUnreadCount();
        
        console.log(`✅ Loaded ${this.notifications.length} notifications (${newUnreadCount} unread)`);
        
        // If there are new unread notifications, show a toast
        if (newUnreadCount > previousUnreadCount) {
          const newCount = newUnreadCount - previousUnreadCount;
          this.showNewNotificationsToast(newCount);
        }
        
        // Update badge and notify listeners
        this.updateBadge();
        this.notifyUpdateListeners();
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    } finally {
      this.isLoading = false;
    }
    
    return [...this.notifications];
  }
  
  /**
   * Get all notifications
   */
  public getNotifications(): Notification[] {
    return [...this.notifications];
  }
  
  /**
   * Get unread notifications
   */
  public getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read_at);
  }
  
  /**
   * Get a notification by ID
   */
  public getNotification(id: string): Notification | undefined {
    return this.notifications.find(n => n.id === id);
  }
  
  /**
   * Mark a notification as read
   */
  public async markAsRead(id: string): Promise<boolean> {
    try {
      const notification = this.notifications.find(n => n.id === id);
      if (!notification) {
        return false;
      }
      
      // Update locally first for responsive UI
      notification.read_at = new Date().toISOString();
      
      // Update badge and notify listeners
      this.updateBadge();
      this.notifyUpdateListeners();
      
      // Call API to mark as read
      await notificationApi.markNotificationRead(id);
      
      return true;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return false;
    }
  }
  
  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(): Promise<boolean> {
    try {
      // Check if there are unread notifications
      const unreadCount = this.getUnreadCount();
      if (unreadCount === 0) {
        return true;
      }
      
      // Update locally first for responsive UI
      const now = new Date().toISOString();
      this.notifications.forEach(n => {
        if (!n.read_at) {
          n.read_at = now;
        }
      });
      
      // Update badge and notify listeners
      this.updateBadge();
      this.notifyUpdateListeners();
      
      // Call API to mark all as read
      await notificationApi.markAllNotificationsRead();
      
      // Show success notification
      toast.success(`Marked ${unreadCount} notifications as read`);
      
      return true;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return false;
    }
  }
  
  /**
   * Handle a notification action
   */
  public async handleNotificationAction(id: string): Promise<void> {
    try {
      // Find the notification
      const notification = this.notifications.find(n => n.id === id);
      if (!notification) {
        return;
      }
      
      // Mark as read first
      await this.markAsRead(id);
      
      // Handle different notification types
      switch (notification.type) {
        case 'welcome_first_conversation':
          // Navigate to ChatGPT
          window.open('https://chat.openai.com/', '_blank');
          break;
          
        case 'insight_prompt_length':
        case 'insight_response_time':
        case 'insight_conversation_quality':
          // Show insight details
          toast.info(notification.title, {
            description: notification.metadata?.details || 'View more details in your dashboard',
            action: {
              label: 'View',
              onClick: () => window.open('https://chatgpt.com/', '_blank')
            }
          });
          break;
          
        default:
          // Generic action handling
          if (notification.action_button) {
            if (notification.metadata?.url) {
              window.open(notification.metadata.url, '_blank');
            }
          }
          break;
      }
    } catch (error) {
      console.error('❌ Error handling notification action:', error);
    }
  }
  
  /**
   * Create and show a new notification (client-side only)
   * This is useful for transient notifications that don't need to be persisted
   */
  public showLocalNotification(notification: {
    title: string;
    body: string;
    type: 'info' | 'warning' | 'success' | 'error';
    action?: { label: string; onClick: () => void };
  }): void {
    // Use toast for local notifications
    switch(notification.type) {
      case 'info':
        toast.info(notification.title, {
          description: notification.body,
          action: notification.action
        });
        break;
      case 'warning':
        toast.warning(notification.title, {
          description: notification.body,
          action: notification.action
        });
        break;
      case 'success':
        toast.success(notification.title, {
          description: notification.body,
          action: notification.action
        });
        break;
      case 'error':
        toast.error(notification.title, {
          description: notification.body,
          action: notification.action
        });
        break;
    }
  }
  
  /**
   * Start polling for new notifications
   */
  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.pollingInterval = window.setInterval(() => {
      this.loadNotifications();
    }, 60000); // Poll every minute
  }
  
  /**
   * Register for notification updates
   * @returns Cleanup function
   */
  public onNotificationsUpdate(callback: (notifications: Notification[]) => void): () => void {
    this.updateCallbacks.push(callback);
    
    // Call immediately with current notifications
    callback([...this.notifications]);
    
    // Return cleanup function
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Get count of unread notifications
   */
  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read_at).length;
  }
  
  /**
   * Update notification badge on main button
   */
  private updateBadge(): void {
    const unreadCount = this.getUnreadCount();
    this.unreadCount = unreadCount;
    
    // Dispatch an event that UI components can listen for
    document.dispatchEvent(new CustomEvent('archimind:notification-count-changed', {
      detail: { unreadCount }
    }));
  }
  
  /**
   * Show toast for new notifications
   */
  private showNewNotificationsToast(count: number): void {
    toast.info(`${count} New Notification${count > 1 ? 's' : ''}`, {
      description: 'Click to view your notifications',
      action: {
        label: 'View',
        onClick: () => {
          // Dispatch event to open notifications panel
          document.dispatchEvent(new CustomEvent('archimind:open-notifications'));
        }
      }
    });
  }
  
  /**
   * Notify all update listeners
   */
  private notifyUpdateListeners(): void {
    const notificationsCopy = [...this.notifications];
    
    this.updateCallbacks.forEach(callback => {
      try {
        callback(notificationsCopy);
      } catch (error) {
        console.error('❌ Error in notification update callback:', error);
      }
    });
  }
}

// Export the singleton instance
export const notificationService = NotificationService.getInstance();