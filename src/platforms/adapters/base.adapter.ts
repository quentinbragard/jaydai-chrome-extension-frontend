// src/platforms/adapters/base.adapter.ts
import { PlatformConfig } from '../config/base';
import { Message, Conversation } from '@/types';

export interface PlatformAdapter {
  name: string;
  config: PlatformConfig;
  
  // Network handlers
  handleAssistantResponse(event: CustomEvent): void;
  handleChatCompletion(event: CustomEvent): void;
  handleConversationList(data: any): Promise<void>;
  handleSpecificConversation(data: any): Promise<void>;
  
  // DOM operations
  insertPrompt(content: string): boolean;
  
  // Utility methods
  extractUserMessage(data: any): Message | null;
  extractAssistantMessage(data: any): Message | null;
  extractConversation(data: any): Conversation | null;
  extractMessagesFromConversation(data: any): Message[];

  // streaming response
  processStreamingResponse(response: Response, requestBody: any): Promise<void>;
  supportsStreaming(): boolean;
}

export abstract class BasePlatformAdapter implements PlatformAdapter {
  name: string;
  config: PlatformConfig;
  
  constructor(config: PlatformConfig) {
    this.name = config.name;
    this.config = config;
  }
  
  abstract handleAssistantResponse(event: CustomEvent): void;
  abstract handleChatCompletion(event: CustomEvent): void;
  abstract handleConversationList(data: any): Promise<void>;
  abstract handleSpecificConversation(data: any): Promise<void>;
  abstract insertPrompt(content: string): boolean;
  abstract extractUserMessage(data: any): Message | null;
  abstract extractAssistantMessage(data: any): Message | null;
  abstract extractConversation(data: any): Conversation | null;
  abstract extractMessagesFromConversation(data: any): Message[];
  abstract processStreamingResponse(response: Response, requestBody: any): Promise<void>;
  abstract supportsStreaming(): boolean;
}