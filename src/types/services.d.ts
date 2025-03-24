/**
 * Type declarations for the 'services' module
 * This resolves the "Cannot find type definition file for 'services'" error
 */

// This tells TypeScript about the 'services' module
declare module 'services' {
    export * from '@/services';
  }
  
  // Also add declaration for direct imports from services
  declare module '@/services' {
    export * from '@/services/auth/AuthService';
    export * from '@/services/auth/TokenService';
    export * from '@/services/chat/ConversationManager';
    export * from '@/services/messages/MessageManager';
    export * from '@/services/messages/MessageQueue';
    export * from '@/services/notifications/NotificationService';
    export * from '@/services/analytics/StatsService';
    export * from '@/services/user/UserProfileService';
    
    export function registerServices(): void;
  }