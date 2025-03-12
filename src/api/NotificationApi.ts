// src/services/api/NotificationApi.ts

import { apiClient } from './ApiClient';

export class NotificationApi {
  /**
   * Fetch all notifications
   */
  async fetchNotifications(): Promise<any> {
    return apiClient.request('/notifications/');
  }
  
  /**
   * Mark a notification as read
   */
  async markNotificationRead(notificationId: string): Promise<any> {
    return apiClient.request(`/notifications/${notificationId}/read`, {
      method: 'POST'
    });
  }
  
  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<any> {
    return apiClient.request('/notifications/read-all', {
      method: 'POST'
    });
  }
  
  /**
   * Get notification counts
   */
  async getNotificationCounts(): Promise<any> {
    return apiClient.request('/notifications/count');
  }
}

export const notificationApi = new NotificationApi();