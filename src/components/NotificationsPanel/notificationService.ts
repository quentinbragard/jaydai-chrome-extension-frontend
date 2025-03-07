import { apiService } from '@/services/ApiService';
import { Notification } from './types';
import { toast } from "sonner";

export const notificationService = {
  loadNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiService.fetchNotifications();
      console.log('🔹 Notifications:', response);
      return response || [];
    } catch (error) {
      console.error('Failed to load notifications:', error);
      return [];
    }
  },
  
  markAsRead: async (id: string): Promise<boolean> => {
    try {
      await apiService.markNotificationRead(id);
      return true;
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
      return false;
    }
  },
  
  markAllAsRead: async (): Promise<boolean> => {
    try {
      await apiService.markAllNotificationsRead();
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  },
  
  handleNotificationAction: async (id: string): Promise<void> => {
    try {
      const notification = await apiService.getNotification(id);
      
      if (notification) {
        // Handle different notification types
        switch (notification.type) {
          case 'welcome_first_conversation':
            // Open ChatGPT
            window.open('https://chat.openai.com/', '_blank');
            break;
          
          case 'insight_prompt_length':
          case 'insight_response_time':
          case 'insight_conversation_quality':
            // Show toast with more details
            toast.info(notification.title, {
              description: notification.body,
              action: {
                label: 'View Details',
                onClick: () => window.open('https://chatgpt.com/', '_blank')
              }
            });
            break;
          
          default:
            // Generic handling for other notification types
            if (notification.action_button) {
              if (notification.metadata?.url) {
                window.open(notification.metadata.url, '_blank');
              }
            }
            break;
        }
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  },
  
  onNotificationsUpdate: (callback: (notifications: Notification[]) => void): () => void => {
    // In a real implementation, this would register a callback
    // to be called when notifications change
    let timeoutId = setTimeout(() => {
      notificationService.loadNotifications().then(callback);
    }, 1000); // Simulate a notification update after 1s
    
    return () => {
      clearTimeout(timeoutId);
    };
  }
};

export default notificationService;