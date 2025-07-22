// src/platforms/config/base.ts

export interface EndpointConfig {
  USER_INFO: string | RegExp | Array<string | RegExp>;
  CONVERSATIONS_LIST: string | RegExp | Array<string | RegExp>;
  CHAT_COMPLETION: string | RegExp | Array<string | RegExp>;
  SPECIFIC_CONVERSATION: string | RegExp | Array<string | RegExp>;
}

export interface DomSelectors {
  PROMPT_TEXTAREA: string;
  SUBMIT_BUTTON: string;
}

export interface PlatformConfig {
  name: string;
  hostnames: string[];
  endpoints: EndpointConfig;
  domSelectors: DomSelectors;
  // Add URL patterns for conversation detection
  conversationIdPatterns: {
    urlPath: RegExp;
    queryParam?: string;
  }[];
}