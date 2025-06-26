import { debug } from '@/core/config';
// src/services/index.ts
import { serviceManager } from '@/core/managers/ServiceManager';

// Chat services
import { ChatService } from './network/ChatService';
import { MessageService } from './network/MessageService';


// Auth services
import { AuthService } from './auth/AuthService';
import { TokenService } from './auth/TokenService';

// Other services
import { NotificationService } from './notifications/NotificationService';
import { StatsService } from './analytics/StatsService';
import { UserProfileService } from './user/UserProfileService';
import { SlashCommandService } from './ui/SlashCommandService';

/**
 * Register all services with the ServiceManager
 */
export function registerServices(): void {
  // Chat services (network interception)
  serviceManager.registerService('chat.network', ChatService.getInstance());
  serviceManager.registerService('message.network', MessageService.getInstance());
  // Auth services
  serviceManager.registerService('auth.token', TokenService.getInstance());
  serviceManager.registerService('auth.state', AuthService.getInstance(), [
    'auth.token'
  ]);
  
  // Other services
  serviceManager.registerService('notifications', NotificationService.getInstance());
  serviceManager.registerService('stats', StatsService.getInstance());
  serviceManager.registerService('ui.slash', SlashCommandService.getInstance());
  
  // Legacy registrations for backward compatibility
  serviceManager.registerService('auth', AuthService.getInstance());
  serviceManager.registerService('user', UserProfileService.getInstance());
  
  debug('All services registered with ServiceManager');
}

// Auth services exports
export {
  AuthService,
  TokenService,
};

// Chat services exports
export {
  ChatService,
  MessageService,
};

// User services exports
export {
  UserProfileService,
};

// Other services exports
export {
  StatsService,
  NotificationService,
  SlashCommandService,
};