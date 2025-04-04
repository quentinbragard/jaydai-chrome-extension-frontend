// src/extension/content/injectedInterceptor/constants.js
// Define all constants used across the interceptor system

/**
 * API Endpoints of interest for interception
 * These are the endpoints we want to monitor and capture data from
 */
export const ENDPOINTS = {
    USER_INFO: '/backend-api/me',
    CONVERSATIONS_LIST: '/backend-api/conversations',
    CHAT_COMPLETION: '/backend-api/conversation',
    SPECIFIC_CONVERSATION: /\/backend-api\/conversation\/([a-f0-9-]+)$/
  };
  
  /**
   * Event names used for communication
   */
  export const EVENTS = {
    NETWORK_INTERCEPT: 'archimind-network-intercept',
    CONVERSATION_LIST: 'archimind:conversation-list'
  };
  
  /**
   * Data types that can be intercepted
   */
  export const DATA_TYPES = {
    USER_INFO: 'userInfo',
    CONVERSATIONS_LIST: 'conversationList',
    SPECIFIC_CONVERSATION: 'specificConversation',
    CHAT_COMPLETION: 'chatCompletion',
    ASSISTANT_RESPONSE: 'assistantResponse',
    INJECTION_COMPLETE: 'injectionComplete'
  };