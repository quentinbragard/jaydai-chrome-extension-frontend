// src/services/chat/types.ts
// Shared types for the chat interception services

export interface MessageEvent {
    type: 'user' | 'assistant';
    messageId: string;
    content: string;
    timestamp: number;
    conversationId?: string;
    model?: string;
  }
  
  export interface ChatInfo {
    id: string;
    title: string;
    create_time: string;
    update_time: string;
  }
  
  export interface UserMetadata {
    id: string;
    email: string;
    name: string;
    picture?: string;
    phone_number?: string;
    org_name?: string;
  }
  
  export interface SaveMessageParams {
    messageId: string;
    message: string;
    role: string;
    rank: number;
    providerChatId: string;
    model?: string;
    thinkingTime?: number;
  }
  
  export interface SaveChatParams {
    chatId: string;
    chatTitle: string;
    providerName: string;
  }
  
  // Types for handling streaming responses
  export interface AssistantStreamMessage {
    id: string;
    content: string;
    conversationId: string;
    model: string;
  }
  
  // Type for messageListener callbacks
  export type MessageListener = (event: MessageEvent) => void;