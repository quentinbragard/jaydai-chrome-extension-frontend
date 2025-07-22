// src/platforms/config/chatgpt.config.ts
import { PlatformConfig } from './base';

export const chatGptConfig: PlatformConfig = {
  name: 'chatgpt',
  hostnames: ['chatgpt.com', 'chat.openai.com'],
  endpoints: {
    USER_INFO: '/backend-api/me',
    CONVERSATIONS_LIST: '/backend-api/conversations',
    CHAT_COMPLETION: '/backend-api/f/conversation',
    SPECIFIC_CONVERSATION: /\/backend-api\/f\/conversation\/([a-f0-9-]+)$/
  },
  domSelectors: {
    PROMPT_TEXTAREA: '#prompt-textarea',
    SUBMIT_BUTTON: 'form button[class*="submit"]'
  },
  // ChatGPT conversation ID detection patterns
  conversationIdPatterns: [
    { urlPath: /\/c\/([a-f0-9-]+)/ }
  ]
};