// src/services/notifications/NotificationService.ts
import { AbstractBaseService } from '../BaseService';
import { notificationApi } from "@/services/api/NotificationApi";
import { toast } from "sonner";
import { emitEvent, AppEvent } from '@/core/events/events';
import { debug } from '@/core/config';
import { NotificationActionMetadata } from '@/types/notifications';
export interface Notification {
  id: string | number;
  title: string;
  body: string;
  type: string;
  metadata?: string | null;
  created_at: string;
  read_at?: string | null;
  user_id?: string;
}

/**
 * Service to manage notifications
 */
export class NotificationService extends AbstractBaseService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private isLoading: boolean = false;
  private lastLoadTime: number = 0;
  private pollingInterval: number | null = null;
  private updateCallbacks: ((notifications: Notification[]) => void)[] = [];
  private unreadCount: number = 0;
  
  private constructor() {
    super();
  }
  
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
  protected async onInitialize(): Promise<void> {
    debug('🔔 Initializing notification service...');
    
    // Load notifications immediately
    await this.loadNotifications();
    
    // Start polling for new notifications
    this.startPolling();
    
    debug('✅ Notification service initialized');
  }
  
  /**
   * Clean up resources
   */
  protected onCleanup(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.updateCallbacks = [];
    debug('✅ Notification service cleaned up');
  }
  
  /**
   * Load notifications from backend
   */
  public async loadNotifications(forceRefresh = false): Promise<Notification[]> {
    // Skip if we've loaded recently (within 1 minute) and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && this.lastLoadTime > 0 && now - this.lastLoadTime < 600000) {
      return [...this.notifications];
    }
    
    // Skip if already loading
    if (this.isLoading) {
      return [...this.notifications];
    }
    
    this.isLoading = true;

  
    try {
      debug('🔔 Loading notifications...');
      
      // Get previous unread count for comparison
      const previousUnreadCount = this.getUnreadCount();
      
      // Call API to get notifications
      const notifications = await notificationApi.fetchNotifications();
      
      if (notifications) {
        this.notifications = notifications;
        this.lastLoadTime = now;
        
        // Calculate new unread count
        const newUnreadCount = this.getUnreadCount();
        
        debug(`✅ Loaded ${this.notifications.length} notifications (${newUnreadCount} unread)`);
        
        // If there are new unread notifications, show a toast
        if (newUnreadCount > previousUnreadCount) {
          const newCount = newUnreadCount - previousUnreadCount;
          this.showNewNotificationsToast(newCount);
        }
        
        // Update badge and notify listeners
        this.updateBadge();
        this.notifyUpdateListeners();
        
        // Emit event
        emitEvent(AppEvent.NOTIFICATION_COUNT_UPDATED, { count: newUnreadCount });
      }
    } catch (error) {
      debug('❌ Error loading notifications:', error);
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
  public getNotification(id: string | number): Notification | undefined {
    return this.notifications.find(n => n.id === id);
  }
  
  /**
   * Mark a notification as read
   */
  public async markAsRead(id: string | number): Promise<boolean> {
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
      
      // Emit event
      emitEvent(AppEvent.NOTIFICATION_READ, { notificationId: id });
      
      // Call API to mark as read
      await notificationApi.markNotificationRead(id);
      
      return true;
    } catch (error) {
      debug('❌ Error marking notification as read:', error);
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
      debug('❌ Error marking all notifications as read:', error);
      return false;
    }
  }
  
  /**
   * Delete a notification
   */
  public async deleteNotification(id: string | number): Promise<boolean> {
    try {
      const notification = this.notifications.find(n => n.id === id);
      if (!notification) {
        return false;
      }
      
      // Update locally first for responsive UI
      this.notifications = this.notifications.filter(n => n.id !== id);
      
      // Update badge and notify listeners
      this.updateBadge();
      this.notifyUpdateListeners();
      
      // Emit event
      emitEvent(AppEvent.NOTIFICATION_DELETED, { notificationId: id });
      
      // Call API to delete notification
      await notificationApi.deleteNotification(id);
      
      // Show success notification
      toast.success('Notification deleted');
      
      return true;
    } catch (error) {
      debug('❌ Error deleting notification:', error);
      return false;
    }
  }
  
 
  
  /**
   * Create and show a new notification (client-side only)
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
      this.pollingInterval = null;
    }
    
    // Poll every 10 minutes
    this.pollingInterval = window.setInterval(() => {
      this.loadNotifications();
    }, 600000);
    
    debug('Started polling for notifications');
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
 * Validate notification action metadata
 */
private validateMetadata(data: any): NotificationActionMetadata | null {
  // Check if it has required fields
  if (!data || typeof data !== 'object') {
    return null;
  }
  
  // Check for required fields
  if (typeof data.action_type !== 'string' || 
      typeof data.action_title_key !== 'string') {
    return null;
  }
  
  // Validate action_url for openUrl type
  if (data.action_type === 'openUrl' && 
      (!data.action_url || typeof data.action_url !== 'string')) {
    debug('⚠️ openUrl action missing valid URL');
    return null;
  }
  
  // Return valid metadata
  return {
    action_type: data.action_type,
    action_title_key: data.action_title_key,
    action_url: data.action_url || undefined
  };
}

/**
 * Parse metadata string into structured object with validation
 */
private parseMetadata(metadata: string | null): NotificationActionMetadata | null {
  console.log("metadata", metadata);
  console.log("typeof metadata", typeof metadata);
  if (!metadata) return null;

  try {
    // Validate the structure
    return this.validateMetadata(metadata);
  } catch (error) {
    debug('❌ Error parsing notification metadata:', error);
    return null;
  }
}

public parseMetadataSafe(metadata: string | null): NotificationActionMetadata | null {
    try {
      return this.parseMetadata(metadata);
    } catch (error) {
      return null;
    }
  }

/**
 * Get action button details for a notification
 */
public getActionButton(notification: Notification): { title: string; visible: boolean } | null {
  console.log("notification", notification);
  if (!notification.metadata) {
    return null;
  }
  
  const metadata = this.parseMetadata(notification.metadata);
  console.log("metadata", metadata);
  if (!metadata) {
    return null;
  }
  
  return {
    title: metadata.action_title_key,
    visible: true
  };
}

/**
 * Handle a notification action based on metadata
 */
public async handleNotificationAction(id: string | number): Promise<void> {
  try {
    // Find the notification
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) {
      return;
    }
    
    // Mark as read first
    await this.markAsRead(id);
    
    // Parse metadata if present
    const metadata = this.parseMetadata(notification.metadata);
    
    // If we have metadata with action type, handle it accordingly
    if (metadata && metadata.action_type) {
      switch (metadata.action_type) {
        case 'openUrl':
          if (metadata.action_url) {
            window.open(metadata.action_url, '_blank');
          } else {
            // If no URL provided, show an error
            toast.error('No URL provided for openUrl action');
          }
          break;
        
        case 'openChatGpt':
          // Open ChatGPT
          window.open('https://chat.openai.com/', '_blank');
          break;
          
        case 'openSettings':
          // Trigger settings panel open
          document.dispatchEvent(new CustomEvent('archimind:open-settings'));
          break;
          
        case 'showTemplates':
          // Trigger templates panel open
          document.dispatchEvent(new CustomEvent('archimind:open-templates'));
          break;
          
        default:
          // For unknown action types, log a warning
          debug(`⚠️ Unknown action type: ${metadata.action_type}`);
          toast.info(notification.title, {
            description: notification.body
          });
          break;
      }
      return;
    }
    
    // If no metadata or action type, fall back to type-based actions
    switch (notification.type) {
      case 'insight_prompt_length':
      case 'insight_response_time':
      case 'insight_conversation_quality':
        // Show insight details
        toast.info(notification.title, {
          description: notification.body,
          action: {
            label: 'View',
            onClick: () => window.open('https://chatgpt.com/', '_blank')
          }
        });
        break;
          
      default:
        // Generic toast with notification content
        toast.info(notification.title, {
          description: notification.body
        });
        break;
    }
  } catch (error) {
    debug('❌ Error handling notification action:', error);
    toast.error('Failed to process notification action');
  }
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
        debug('❌ Error in notification update callback:', error);
      }
    });
  }
}

export const notificationService = NotificationService.getInstance();