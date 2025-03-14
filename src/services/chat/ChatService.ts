// src/services/chat/ChatService.ts

import { networkRequestMonitor } from '@/core/network/NetworkRequestMonitor';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { emitEvent, AppEvent } from '@/core/events/events';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { Message, Conversation } from '@/types/chat';
import { debug } from '@/core/config';
import { messageApi } from '@/api/MessageApi';

/**
 * Service for chat functionality
 */
export class ChatService {
  private static instance: ChatService;
  private currentConversationId: string | null = null;
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map();
  
  private constructor() {}
  
  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }
  
  /**
   * Initialize the chat service
   */
  public async initialize(): Promise<void> {
    try {
      // Initialize network monitoring
      networkRequestMonitor.initialize();
      
      // Listen for network events
      networkRequestMonitor.addListener('chatCompletion', this.handleChatCompletion);
      networkRequestMonitor.addListener('assistantResponse', this.handleAssistantResponse);
      networkRequestMonitor.addListener('specificConversation', this.handleSpecificConversation);
      
      debug('Chat service initialized');
    } catch (error) {
      const appError = AppError.from(error, 'Failed to initialize chat service');
      errorReporter.captureError(appError);
      throw appError;
    }
  }
  
  /**
   * Handle chat completion requests
   */
  private handleChatCompletion = (data: any): void => {
    try {
      if (!data?.requestBody?.messages?.length) return;
      
      const userMessage = this.extractUserMessage(data.requestBody);
      if (userMessage) {
        // Add to local cache
        this.addMessage(userMessage);
        
        // Emit event
        emitEvent(AppEvent.CHAT_MESSAGE_SENT, {
          messageId: userMessage.messageId,
          content: userMessage.content,
          conversationId: userMessage.conversationId
        });
        
        // Save to backend
        this.saveMessage(userMessage);
      }
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error handling chat completion'));
    }
  };
  
  /**
   * Handle assistant responses
   */
  private handleAssistantResponse = (data: any): void => {
    try {
      if (!data.messageId || !data.content) return;
      
      const message: Message = {
        messageId: data.messageId,
        conversationId: data.conversationId || '',
        content: data.content,
        role: 'assistant',
        model: data.model || 'unknown',
        timestamp: data.createTime || Date.now(),
        thinkingTime: data.thinkingTime
      };
      
      // Add to local cache
      this.addMessage(message);
      
      // Save chat title if this is a new conversation
      if (message.conversationId && !this.conversations.has(message.conversationId)) {
        // Extract title from first line of content
        const title = message.content.split('\n')[0].trim().substring(0, 50) || 'New conversation';
        
        this.conversations.set(message.conversationId, {
          id: message.conversationId,
          title,
          lastMessageTime: message.timestamp
        });
        
        // Save conversation to backend
        this.saveConversation(message.conversationId, title);
      }
      
      // Emit event
      emitEvent(AppEvent.CHAT_MESSAGE_RECEIVED, {
        messageId: message.messageId,
        content: message.content,
        role: message.role,
        conversationId: message.conversationId
      });
      
      // Save to backend
      this.saveMessage(message);
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error handling assistant response'));
    }
  };
  
  /**
   * Handle specific conversation data
   */
  private handleSpecificConversation = (data: any): void => {
    try {
      if (!data?.responseBody?.conversation_id) return;
      
      const conversationId = data.responseBody.conversation_id;
      const title = data.responseBody.title || 'Conversation';
      
      // Extract messages from the conversation data
      const extractedMessages = this.extractMessagesFromConversation(data.responseBody);
      
      // Update local cache
      this.conversations.set(conversationId, {
        id: conversationId,
        title,
        messageCount: extractedMessages.length,
        lastMessageTime: Date.now()
      });
      
      // Update messages cache
      this.messages.set(conversationId, extractedMessages);
      
      // Emit event
      emitEvent(AppEvent.CHAT_CONVERSATION_LOADED, {
        conversationId,
        title,
        messages: extractedMessages
      });
      
      // Save conversation and messages to backend
      this.saveConversationBatch(conversationId, title, extractedMessages);
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error handling specific conversation'));
    }
  };
  
  /**
   * Extract user message from request body
   */
  private extractUserMessage(requestBody: any): Message | null {
    const message = requestBody.messages.find(
      (m: any) => m.author?.role === 'user' || m.role === 'user'
    );
    
    if (!message) return null;
    
    // Extract content from message
    let content = '';
    if (message.content?.parts) {
      content = message.content.parts.join('\n');
    } else if (message.content) {
      content = message.content;
    }
    
    return {
      messageId: message.id || `user-${Date.now()}`,
      conversationId: requestBody.conversation_id || '',
      content,
      role: 'user',
      model: requestBody.model || 'unknown',
      timestamp: Date.now()
    };
  }
  
  /**
   * Extract messages from conversation data
   */
  private extractMessagesFromConversation(conversation: any): Message[] {
    const messages: Message[] = [];
    
    if (!conversation.mapping) return messages;
    
    // Track message order
    let rank = 0;
    
    // Process each message in the mapping
    Object.keys(conversation.mapping).forEach(messageId => {
      if (messageId === 'client-created-root') return;
      
      const messageNode = conversation.mapping[messageId];
      if (!messageNode?.message?.author?.role) return;
      
      const message = messageNode.message;
      const role = message.author.role;
      
      // Only process user and assistant text messages
      if ((role === 'user' || role === 'assistant') && 
          (!message.content.content_type || message.content.content_type === 'text')) {
        
        rank++;
        const content = Array.isArray(message.content.parts) 
          ? message.content.parts.join('\n') 
          : message.content.parts || '';
          
        messages.push({
          messageId,
          conversationId: conversation.conversation_id,
          content,
          role,
          model: message.metadata?.model_slug || 'unknown',
          timestamp: message.create_time || Date.now()
        });
      }
    });
    
    // Sort messages by timestamp if available
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    return messages;
  }
  
  /**
   * Add a message to local cache
   */
  private addMessage(message: Message): void {
    const { conversationId } = message;
    
    if (!conversationId) return;
    
    // Get or create conversation messages array
    if (!this.messages.has(conversationId)) {
      this.messages.set(conversationId, []);
    }
    
    const conversationMessages = this.messages.get(conversationId)!;
    
    // Check if message already exists
    const existingIndex = conversationMessages.findIndex(m => m.messageId === message.messageId);
    
    if (existingIndex >= 0) {
      // Update existing message
      conversationMessages[existingIndex] = message;
    } else {
      // Add new message
      conversationMessages.push(message);
    }
    
    // Set current conversation
    this.currentConversationId = conversationId;
  }
  
  /**
   * Save message to backend
   */
  private async saveMessage(message: Message): Promise<void> {
    try {
      await messageApi.saveMessage({
        message_id: message.messageId,
        provider_chat_id: message.conversationId,
        content: message.content,
        role: message.role,
        rank: 0, // Could be improved
        model: message.model || 'unknown',
        created_at: message.timestamp
      });
      
      debug(`Saved message ${message.messageId.substring(0, 8)}...`);
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error saving message'));
    }
  }
  
  /**
   * Save conversation to backend
   */
  private async saveConversation(conversationId: string, title: string): Promise<void> {
    try {
      await messageApi.saveChat({
        provider_chat_id: conversationId,
        title,
        provider_name: 'ChatGPT'
      });
      
      debug(`Saved conversation ${conversationId.substring(0, 8)}...`);
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error saving conversation'));
    }
  }
  
  /**
   * Save conversation and messages in batch
   */
  private async saveConversationBatch(conversationId: string, title: string, messages: Message[]): Promise<void> {
    try {
      // Format messages for API
      const formattedMessages = messages.map((msg, index) => ({
        message_id: msg.messageId,
        provider_chat_id: msg.conversationId,
        content: msg.content,
        role: msg.role,
        rank: index,
        model: msg.model || 'unknown',
        created_at: msg.timestamp
      }));
      
      // Save batch
      await messageApi.saveBatch({
        chats: [{
          provider_chat_id: conversationId,
          title,
          provider_name: 'ChatGPT'
        }],
        messages: formattedMessages
      });
      
      debug(`Saved conversation batch with ${messages.length} messages`);
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error saving conversation batch'));
    }
  }
  
  /**
   * Get current conversation ID
   */
  public getCurrentConversationId(): string | null {
    return this.currentConversationId;
  }
  
  /**
   * Set current conversation ID
   */
  public setCurrentConversationId(conversationId: string): void {
    this.currentConversationId = conversationId;
  }
  
  /**
   * Get messages for a conversation
   */
  public getConversationMessages(conversationId: string): Message[] {
    return this.messages.get(conversationId) || [];
  }
  
  /**
   * Get a conversation by ID
   */
  public getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }
  
  /**
   * Get all conversations
   */
  public getConversations(): Conversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    networkRequestMonitor.cleanup();
  }
}

export const chatService = ChatService.getInstance();