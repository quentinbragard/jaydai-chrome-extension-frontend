import { Notification } from './types';

// Mock notification data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Welcome to Archimind',
    body: 'Start your AI analytics journey by sending your first message to ChatGPT.',
    type: 'info',
    action_button: 'Get Started',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read_at: null
  },
  {
    id: '2',
    title: 'New Template Available',
    body: 'Check out our new prompt template for better AI responses.',
    type: 'success',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read_at: null
  },
  {
    id: '3',
    title: 'Usage Limit Warning',
    body: 'You are approaching your monthly usage limit.',
    type: 'warning',
    action_button: 'Upgrade',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read_at: null
  }
];

export const notificationService = {
  loadNotifications: async (): Promise<Notification[]> => {
    return Promise.resolve(mockNotifications);
  },
  
  markAsRead: async (id: string): Promise<boolean> => {
    console.log(`Marking notification ${id} as read`);
    return Promise.resolve(true);
  },
  
  markAllAsRead: async (): Promise<boolean> => {
    console.log('Marking all notifications as read');
    return Promise.resolve(true);
  },
  
  handleNotificationAction: async (id: string): Promise<boolean> => {
    console.log(`Handling action for notification ${id}`);
    return Promise.resolve(true);
  },
  
  onNotificationsUpdate: (callback: (notifications: Notification[]) => void): () => void => {
    // In a real implementation, this would register a callback
    // to be called when notifications change
    const timeoutId = setTimeout(() => callback([]), 1000); // Simulate a notification update after 1s
    
    return () => {
      clearTimeout(timeoutId);
    };
  }
};

export default notificationService; 