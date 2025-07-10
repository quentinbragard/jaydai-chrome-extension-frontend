// src/platforms/config/claude.config.ts
import { PlatformConfig } from './base';

export const claudeConfig: PlatformConfig = {
  name: 'claude',
  hostnames: ['claude.ai'],
  endpoints: {
    USER_INFO: '/api/user',
    CONVERSATIONS_LIST: /\/api\/organizations\/[a-f0-9-]+\/chat_conversations/,
    CHAT_COMPLETION: /\/api\/organizations\/[a-f0-9-]+\/chat_conversations\/[a-f0-9-]+\/completion/,
    SPECIFIC_CONVERSATION: /\/api\/organizations\/[a-f0-9-]+\/chat_conversations\/([a-f0-9-]+)/
  },
  domSelectors: {
    PROMPT_TEXTAREA: 'div[role="textbox"]',
    SUBMIT_BUTTON: 'button[class*="send"]'
  },
   // ChatGPT conversation ID detection patterns
   conversationIdPatterns: [
    { urlPath: /\/chat\/([a-f0-9-]+)/ }
  ]
};