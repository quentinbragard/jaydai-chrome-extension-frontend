// src/services/index.ts
import { serviceManager } from '@/core/managers/ServiceManager';

// Chat services
import { ChatNetworkService } from './network/ChatNetworkService';


// Auth services
import { AuthService } from './auth/AuthService';
import { TokenService } from './auth/TokenService';

// Other services
import { NotificationService } from './notifications/NotificationService';
import { StatsService } from './analytics/StatsService';
import { UserProfileService } from './user/UserProfileService';

/**
 * Register all services with the ServiceManager
 */
export function registerServices(): void {
  // Chat services (network interception)
  serviceManager.registerService('chat.network', ChatNetworkService.getInstance());
  
  // Auth services
  serviceManager.registerService('auth.token', TokenService.getInstance());
  serviceManager.registerService('auth.state', AuthService.getInstance(), [
    'auth.token'
  ]);
  
  // Other services
  serviceManager.registerService('notifications', NotificationService.getInstance());
  serviceManager.registerService('stats', StatsService.getInstance());
  
  // Legacy registrations for backward compatibility
  serviceManager.registerService('auth', AuthService.getInstance());
  serviceManager.registerService('user', UserProfileService.getInstance());
  
  console.log('All services registered with ServiceManager');
}

// Auth services exports
export {
  AuthService,
  TokenService,
};

// Chat services exports
export {
  ChatNetworkService,
};

// User services exports
export {
  UserProfileService,
};

// Other services exports
export {
  StatsService,
  NotificationService,
};