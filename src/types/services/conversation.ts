// src/types/chat.ts



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