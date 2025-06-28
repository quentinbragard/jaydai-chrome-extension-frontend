import { PlatformConfig } from './base';

export const mistralConfig: PlatformConfig = {
  name: 'mistral',
  // Include both main chat and admin hostnames used for requests
  hostnames: ['chat.mistral.ai', 'admin.mistral.ai'],
  endpoints: {
    USER_INFO: '/api/trpc/user.session',
    CONVERSATIONS_LIST: '/api/trpc/chat.list',
    // Match both the initial message.newChat call and subsequent /chat requests
    CHAT_COMPLETION: /\/api\/trpc\/message\.newChat|\/chat(?:\?|$)/,
    SPECIFIC_CONVERSATION: /\/api\/chat/,
  },
  domSelectors: {
    PROMPT_TEXTAREA: 'textarea[name="message.text"]',
    SUBMIT_BUTTON: 'form button[type="submit"]'
  },
  conversationIdPatterns: [
    { urlPath: /\/chat\/([a-f0-9-]+)/ }
  ]
};
