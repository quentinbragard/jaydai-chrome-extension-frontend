// src/types/chat.ts

export interface Message {
    messageId: string;
    conversationId: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    model?: string;
    timestamp: number;
    thinkingTime?: number;
  }
  
  export interface Conversation {
    id: string;
    title: string;
    lastMessageTime?: number;
    model?: string;
    messageCount?: number;
  }
  
  export interface UserMetadata {
    id: string;
    email: string;
    name?: string;
    picture?: string | null;
    phone_number?: string | null;
    org_name?: string | null;
  }