// src/core/events/events.ts

import { eventManager } from "./EventManager";

/**
 * Event names used throughout the application
 */
export enum AppEvent {
    // Auth events
    AUTH_LOGIN = 'auth:login',
    AUTH_LOGOUT = 'auth:logout',
    AUTH_ERROR = 'auth:error',
    
    // Chat events
    CHAT_MESSAGE_RECEIVED = 'chat:message:received',
    CHAT_MESSAGE_SENT = 'chat:message:sent',
    CHAT_CONVERSATION_LOADED = 'chat:conversation:loaded',
    CHAT_CONVERSATION_CHANGED = 'chat:conversation:changed',

    
    // Template events
    TEMPLATE_CREATED = 'template:created',
    TEMPLATE_UPDATED = 'template:updated',
    TEMPLATE_DELETED = 'template:deleted',
    TEMPLATE_USED = 'template:used',
    
    // Notification events
    NOTIFICATION_RECEIVED = 'notification:received',
    NOTIFICATION_DELETED = 'NOTIFICATION_DELETED',
    NOTIFICATION_READ = 'notification:read',
    NOTIFICATION_COUNT_UPDATED = 'notification:count:updated',
    
    // UI events
    UI_THEME_CHANGED = 'ui:theme:changed',
    UI_LANGUAGE_CHANGED = 'ui:language:changed',
    
    // Extension events
    EXTENSION_INITIALIZED = 'extension:initialized',
    EXTENSION_ERROR = 'extension:error',

    // User info events
    USER_INFO_UPDATED = 'user:info:updated',
  }
  
  /**
   * Event types for type safety
   */
  export interface EventPayloads {
    [AppEvent.AUTH_LOGIN]: { userId: string; email: string };
    [AppEvent.AUTH_LOGOUT]: void;
    [AppEvent.AUTH_ERROR]: { message: string; code?: string };
    
    [AppEvent.CHAT_MESSAGE_RECEIVED]: { messageId: string; content: string; role: string; conversationId: string };
    [AppEvent.CHAT_MESSAGE_SENT]: { messageId: string; content: string; conversationId: string };
    [AppEvent.CHAT_CONVERSATION_LOADED]: { conversationId: string; title: string; messages: any[] };
    [AppEvent.CHAT_CONVERSATION_CHANGED]: { conversationId: string };

    
    [AppEvent.TEMPLATE_CREATED]: { templateId: string; name: string };
    [AppEvent.TEMPLATE_UPDATED]: { templateId: string; name: string };
    [AppEvent.TEMPLATE_DELETED]: { templateId: string };
    [AppEvent.TEMPLATE_USED]: { templateId: string; name: string };
    
    [AppEvent.NOTIFICATION_RECEIVED]: { notificationId: string; title: string; body: string };
    [AppEvent.NOTIFICATION_READ]: { notificationId: string };
    [AppEvent.NOTIFICATION_COUNT_UPDATED]: { count: number };
    
    [AppEvent.UI_THEME_CHANGED]: { theme: 'light' | 'dark' | 'system' };
    [AppEvent.UI_LANGUAGE_CHANGED]: { language: string };
    
    [AppEvent.EXTENSION_INITIALIZED]: { version: string };
    [AppEvent.EXTENSION_ERROR]: { message: string; stack?: string };

    [AppEvent.USER_INFO_UPDATED]: { email: string; name?: string };
  }
  
  /**
   * Type-safe event emitter
   */
  export function emitEvent<T extends AppEvent>(event: T, payload: EventPayloads[T]): void {
    eventManager.emit(event, payload);
  }
  
  
  /**
   * Type-safe event listener
   */
  export function onEvent<T extends AppEvent>(event: T, callback: (payload: EventPayloads[T]) => void): () => void {
    return eventManager.on(event, callback);
  }