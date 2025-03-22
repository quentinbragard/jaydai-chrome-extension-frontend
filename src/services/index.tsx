// src/services/index.ts
import { serviceManager } from '@/core/managers/ServiceManager';

// Chat services
import { ChatMessageParser } from './chat/ChatMessageParser';
import { ConversationParser } from './chat/ConversationParser';
import { ConversationManager } from './chat/ConversationManager';
import { ConversationStorage } from './chat/ConversationStorage';

// Message services
import { MessageManager } from './messages/MessageManager';
import { MessageQueue } from './messages/MessageQueue';
import { PendingMessageTracker } from './messages/PendingMessageTracker';

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
  serviceManager.registerService('chat.message-parser', ChatMessageParser.getInstance());
  serviceManager.registerService('chat.conversation-parser', ConversationParser.getInstance());
  
  // Core chat services
  serviceManager.registerService('chat.conversation-manager', ConversationManager.getInstance(), [
    'chat.conversation-parser'
  ]);
  serviceManager.registerService('chat.conversation-storage', ConversationStorage.getInstance(), [
    'chat.conversation-manager'
  ]);
  
  // Message services
  serviceManager.registerService('messages.manager', MessageManager.getInstance(), [
    'chat.message-parser'
  ]);
  serviceManager.registerService('messages.queue', MessageQueue.getInstance(), [
    'messages.manager'
  ]);
  serviceManager.registerService('messages.pending', PendingMessageTracker.getInstance(), [
    'chat.message-parser',
    'chat.conversation-manager'
  ]);
  
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
  serviceManager.registerService('chat', ConversationManager.getInstance());
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
  ConversationParser,
  ConversationManager,
  ConversationStorage,
};

// Message services exports
export {
  MessageQueue,
  PendingMessageTracker,
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