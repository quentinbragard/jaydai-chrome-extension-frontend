import { serviceManager } from '@/core/managers/ServiceManager';
import { StatsService } from './analytics/StatsService';
import { authService } from './auth/AuthService';
import { chatService } from './chat/ChatService';
import { notificationService } from './notifications/NotificationService';
import { messageService } from './MessageService';
import { userInfoService } from './user/UserInfoService';

// Register all services
export function registerServices(): void {
  // Register services with the manager
  serviceManager.registerService('auth', authService);
  serviceManager.registerService('chat', chatService);
  serviceManager.registerService('messages', messageService);
  serviceManager.registerService('user', userInfoService);
  serviceManager.registerService('notifications', notificationService);
  
  // Create and register StatsService
  serviceManager.registerService('stats', new StatsService());
  
  console.log('All services registered with ServiceManager');
}

// Export services for direct access if needed
export {
  authService,
  chatService,
  messageService,
  notificationService,
  userInfoService
};

// Export types
export type { StatsService };