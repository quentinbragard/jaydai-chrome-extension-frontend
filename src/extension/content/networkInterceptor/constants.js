// src/extension/content/networkInterceptor/constants.js
// Define all constants used across the interceptor system

/**
 * API Endpoints of interest for interception
 * These are the endpoints we want to monitor and capture data from
 */
export const ENDPOINTS = {
  'chatgpt': {
    USER_INFO: '/backend-api/me',
    CONVERSATIONS_LIST: '/backend-api/conversations',
    CHAT_COMPLETION: '/backend-api/f/conversation',
    SPECIFIC_CONVERSATION: /\/backend-api\/f\/conversation\/([a-f0-9-]+)$/
  },
  'claude': {
    USER_INFO: '/api/user',
    CONVERSATIONS_LIST: /\/api\/organizations\/[a-f0-9-]+\/chat_conversations/,
    CHAT_COMPLETION: /\/api\/organizations\/[a-f0-9-]+\/chat_conversations\/[a-f0-9-]+\/completion/,
    SPECIFIC_CONVERSATION: /\/api\/organizations\/[a-f0-9-]+\/chat_conversations\/([a-f0-9-]+)/
  },
  'mistral': {
    USER_INFO: '/api/trpc/user.session',
    CONVERSATIONS_LIST: '/api/trpc/chat.list',
    // Mistral uses different endpoints depending on whether the conversation
    // already exists or not. The first user message is sent to
    // `/api/trpc/message.newChat` while subsequent messages are sent to `/chat`.
    // Use a regex so both endpoints are detected as chat completions.
    CHAT_COMPLETION: /\/chat/,
  },
  'copilot': {
    USER_INFO: '/c/api/user',
    CONVERSATIONS_LIST: '/c/api/conversations',
    CHAT_COMPLETION: '/c/api/conversations',
    SPECIFIC_CONVERSATION: /\/c\/api\/conversations\/([a-zA-Z0-9-]+)\/history/
  }
};
  
  /**
   * Event names used for communication - using specific events for each data type
   */
  export const EVENTS = {
    USER_INFO: 'jaydai:user-info',
    CONVERSATIONS_LIST: 'jaydai:conversation-list',
    SPECIFIC_CONVERSATION: 'jaydai:specific-conversation',
    CHAT_COMPLETION: 'jaydai:chat-completion',
    ASSISTANT_RESPONSE: 'jaydai:assistant-response',
    MESSAGE_EXTRACTED: 'jaydai:message-extracted',
    CONVERSATION_LOADED: 'jaydai:conversation-loaded',
    CONVERSATION_CHANGED: 'jaydai:conversation-changed',
    QUEUE_MESSAGE: 'jaydai:queue-message',
    NOTIFICATION_COUNT_CHANGED: 'jaydai:notification-count-changed',
    OPEN_NOTIFICATIONS: 'jaydai:open-notifications',
    TOGGLE_PANEL: 'jaydai:toggle-panel',
    SHOW_AUTH_MODAL: 'jaydai:show-auth-modal',
    AUTH_ERROR: 'jaydai:auth-error',
    OPEN_SETTINGS: 'jaydai:open-settings',
    OPEN_TEMPLATES: 'jaydai:open-templates',
    INJECTION_COMPLETE: 'jaydai:injection-complete'
  };