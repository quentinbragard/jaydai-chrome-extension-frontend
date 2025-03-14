// src/services/chat/ChatService.ts

import { networkRequestMonitor } from '@/core/network/NetworkRequestMonitor';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { emitEvent, AppEvent } from '@/core/events/events';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { Message, Conversation } from '@/types/chat';
import { debug } from '@/core/config';
import { messageApi } from '@/api/MessageApi';

// Type for message waiting for a conversation ID
interface PendingMessage {
  message: Message;
  timestamp: number;
}

/**
 * Service for chat functionality
 */
export class ChatService {
  private static instance: ChatService;
  private currentConversationId: string | null = null;
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private pendingMessages: PendingMessage[] = [];
  
  // Track conversation message counts for ranking
  private messageCounters: Map<string, number> = new Map();
  
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
      
      // Listen for URL changes that might indicate a new conversation
      window.addEventListener('popstate', this.checkUrlForConversationId);
      this.checkUrlForConversationId(); // Check current URL
      
      debug('Chat service initialized');
    } catch (error) {
      const appError = AppError.from(error, 'Failed to initialize chat service');
      errorReporter.captureError(appError);
      throw appError;
    }
  }
  
  /**
   * Check the current URL for a conversation ID
   */
  private checkUrlForConversationId = (): void => {
    try {
      const match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
      if (match && match[1]) {
        const conversationId = match[1];
        
        // Only proceed if this is a different conversation ID
        if (conversationId !== this.currentConversationId) {
          debug(`Detected conversation ID from URL: ${conversationId}`);
          this.setCurrentConversationId(conversationId);
          
          // Process any pending messages now that we have a conversation ID
          this.processPendingMessages(conversationId);
          
          // Emit event
          emitEvent(AppEvent.CHAT_CONVERSATION_CHANGED, {
            conversationId
          });
        }
      }
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error checking URL for conversation ID'));
    }
  };
  
  /**
   * Process messages waiting for a conversation ID
   */
  private processPendingMessages(conversationId: string): void {
    if (this.pendingMessages.length === 0) return;
    
    debug(`Processing ${this.pendingMessages.length} pending messages for conversation: ${conversationId}`);
    
    // Get the next rank to use
    let nextRank = this.getNextRank(conversationId);
    
    // Process each pending message
    this.pendingMessages.forEach(item => {
      const message = item.message;
      
      // Update the conversation ID
      message.conversationId = conversationId;
      
      // Assign rank
      if (message.rank === undefined) {
        message.rank = nextRank++;
      }
      
      // Add to messages for this conversation
      this.addMessage(message);
      
      // Save to backend
      this.saveMessage(message);
    });
    
    // Update message counter
    this.messageCounters.set(conversationId, nextRank);
    
    // Clear pending messages
    this.pendingMessages = [];
  }
  
  /**
   * Handle chat completion requests
   */
  private handleChatCompletion = (data: any): void => {
    try {
      if (!data?.requestBody?.messages?.length) return;
      
      const userMessage = this.extractUserMessage(data.requestBody);
      if (userMessage) {
        // Check if this is a message for an existing conversation
        if (userMessage.conversationId) {
          // Add to local cache with rank
          userMessage.rank = this.getNextRank(userMessage.conversationId);
          this.addMessage(userMessage);
          
          // Emit event
          emitEvent(AppEvent.CHAT_MESSAGE_SENT, {
            messageId: userMessage.messageId,
            content: userMessage.content,
            conversationId: userMessage.conversationId
          });
          
          // Save to backend
          this.saveMessage(userMessage);
          
          // Update current conversation
          this.currentConversationId = userMessage.conversationId;
        } else {
          // This is a message for a new conversation
          // Store as pending until we get a conversation ID
          this.pendingMessages.push({
            message: userMessage,
            timestamp: Date.now()
          });
          
          debug('Stored pending user message for new conversation');
          
          // Clean up old pending messages (older than 5 minutes)
          this.cleanupOldPendingMessages();
        }
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
      
      // If we have a conversation ID, process normally
      if (message.conversationId) {
        // Assign rank
        message.rank = this.getNextRank(message.conversationId);
        
        // Add to local cache
        this.addMessage(message);
        
        // Update current conversation ID
        this.currentConversationId = message.conversationId;
        
        // Save chat title if this is a new conversation
        if (!this.conversations.has(message.conversationId)) {
          // Extract title from first line of content
          const title = message.content.split('\n')[0].trim().substring(0, 50) || 'New conversation';
          
          this.conversations.set(message.conversationId, {
            id: message.conversationId,
            title,
            lastMessageTime: message.timestamp
          });
          
          // Save conversation to backend
          this.saveConversation(message.conversationId, title);
          
          // Process any pending messages for this conversation
          this.processPendingMessages(message.conversationId);
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
      } else {
        // Add to pending messages if no conversation ID
        this.pendingMessages.push({
          message,
          timestamp: Date.now()
        });
        
        debug('Stored pending assistant response for new conversation');
      }
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
      
      // Set as current conversation
      this.currentConversationId = conversationId;
      
      // Process any pending messages for this conversation
      this.processPendingMessages(conversationId);
      
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
   * Clean up old pending messages
   */
  private cleanupOldPendingMessages(): void {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    this.pendingMessages = this.pendingMessages.filter(item => {
      return now - item.timestamp < fiveMinutes;
    });
  }
  
  /**
   * Get the next rank for a conversation
   */
  private getNextRank(conversationId: string): number {
    const currentCount = this.messageCounters.get(conversationId) || 0;
    const nextRank = currentCount;
    
    // Update the counter
    this.messageCounters.set(conversationId, currentCount + 1);
    
    return nextRank;
  }
  
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
        
        // Get message creation order from metadata if available, otherwise use create_time
        const rank = message.metadata?.sequence_number !== undefined ? 
                        parseInt(message.metadata.sequence_number) : messages.length;
        
        const content = Array.isArray(message.content.parts) 
          ? message.content.parts.join('\n') 
          : message.content.parts || '';
          
        messages.push({
          messageId,
          conversationId: conversation.conversation_id,
          content,
          role,
          model: message.metadata?.model_slug || 'unknown',
          timestamp: message.create_time || Date.now(),
          rank
        });
      }
    });
    
    // Sort messages by rank if available, otherwise by timestamp
    messages.sort((a, b) => {
      if (a.rank !== undefined && b.rank !== undefined) {
        return a.rank - b.rank;
      }
      return a.timestamp - b.timestamp;
    });
    
    // Update message counter based on number of messages
    if (messages.length > 0 && conversation.conversation_id) {
      this.messageCounters.set(conversation.conversation_id, messages.length);
    }
    
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
      
      // Sort by rank if available
      conversationMessages.sort((a, b) => {
        if (a.rank !== undefined && b.rank !== undefined) {
          return a.rank - b.rank;
        }
        return a.timestamp - b.timestamp;
      });
    }
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
        rank: message.rank !== undefined ? message.rank : 0,
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
      const formattedMessages = messages.map((msg) => ({
        message_id: msg.messageId,
        provider_chat_id: msg.conversationId,
        content: msg.content,
        role: msg.role,
        rank: msg.rank !== undefined ? msg.rank : 0,
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
    
    // Process any pending messages for this conversation
    this.processPendingMessages(conversationId);
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
    window.removeEventListener('popstate', this.checkUrlForConversationId);
  }
}

export const chatService = ChatService.getInstance();