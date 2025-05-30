import { PlatformConfig } from './base';

export const copilotConfig: PlatformConfig = {
  name: 'copilot',
  hostnames: ['copilot.microsoft.com'],
  endpoints: {
    USER_INFO: '/c/api/user',
    CONVERSATIONS_LIST: '/c/api/conversations',
    CHAT_COMPLETION: '/c/api/conversations',
    SPECIFIC_CONVERSATION: /\/c\/api\/conversations\/([a-zA-Z0-9-]+)\/history/
  },
  domSelectors: {
    PROMPT_TEXTAREA: '#userInput',
    SUBMIT_BUTTON: 'form button[type="submit"]'
  },
  conversationIdPatterns: [
    { urlPath: /\/c\/api\/conversations\/([a-zA-Z0-9-]+)/ }
  ]
};
