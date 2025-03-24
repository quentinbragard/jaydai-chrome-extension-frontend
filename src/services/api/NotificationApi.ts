// src/services/api/NotificationApi.ts

import { apiClient } from './ApiClient';
import { 
  NotificationResponse, 
  NotificationCountsResponse, 
  NotificationReadResponse, 
  NotificationReadAllResponse, 
  NotificationDeleteResponse 
} from '@/types/notifications';

export class NotificationApi {
  /**
   * Fetch all notifications
   */
  async fetchNotifications(): Promise<NotificationResponse[]> {
    try {
      return await apiClient.request<NotificationResponse[]>('/notifications/');
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return []; // Return empty array on error
    }
  }
  
  /**
   * Fetch unread notifications
   */
  async fetchUnreadNotifications(): Promise<NotificationResponse[]> {
    try {
      return await apiClient.request<NotificationResponse[]>('/notifications/unread');
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return []; // Return empty array on error
    }
  }
  
  /**
   * Mark a notification as read
   */
  async markNotificationRead(notificationId: string): Promise<NotificationReadResponse> {
    return apiClient.request<NotificationReadResponse>(`/notifications/${notificationId}/read`, {
      method: 'POST'
    });
  }
  
  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<NotificationReadAllResponse> {
    return apiClient.request<NotificationReadAllResponse>('/notifications/read-all', {
      method: 'POST'
    });
  }
  
  /**
   * Get notification counts
   */
  async getNotificationCountsResponse(): Promise<NotificationCountsResponse> {
    return apiClient.request<NotificationCountsResponse>('/notifications/count');
  }
  
  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<NotificationDeleteResponse> {
    return apiClient.request<NotificationDeleteResponse>(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }
}

export const notificationApi = new NotificationApi();