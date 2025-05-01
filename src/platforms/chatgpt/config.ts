// src/platforms/chatgpt/config.ts

export const CHATGPT_SELECTORS = {
  promptTextarea: "#prompt-textarea",
  // Add other relevant selectors here as needed
};

export const CHATGPT_ENDPOINTS = {
  USER_INFO: "/backend-api/accounts/check/v4-2023-04-24",
  CONVERSATIONS_LIST: "/backend-api/conversations",
  SPECIFIC_CONVERSATION_REGEX: /^\/backend-api\/conversation\/[^/]+$/,
  CHAT_COMPLETION: "/backend-api/conversation",
  // Add other relevant endpoints here
};

export const CHATGPT_EVENTS = {
  USER_INFO: "chatgpt:user-info",
  CONVERSATIONS_LIST: "chatgpt:conversations-list",
  SPECIFIC_CONVERSATION: "chatgpt:specific-conversation",
  CHAT_COMPLETION: "chatgpt:chat-completion",
  STREAMING_CHUNK: "chatgpt:streaming-chunk",
  STREAMING_COMPLETE: "chatgpt:streaming-complete",
};

