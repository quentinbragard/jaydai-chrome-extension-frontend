import { PlatformConfig } from './base';

export const mistralConfig: PlatformConfig = {
  name: 'mistral',
  hostnames: ['chat.mistral.ai'],
  endpoints: {
    USER_INFO: '/api/trpc/user.session',
    CONVERSATIONS_LIST: '/api/trpc/chat.list',
    CHAT_COMPLETION: /\/api\/chat/,
    SPECIFIC_CONVERSATION:'/api/trpc/chat.list',
  },
  domSelectors: {
    PROMPT_TEXTAREA: 'textarea[name="message.text"]',
    SUBMIT_BUTTON: 'form button[type="submit"]'
  },
  conversationIdPatterns: [
    { urlPath: /\/chat\/([a-f0-9-]+)/ }
  ]
};
