// src/services/MessageService.ts

import { messageApi } from "../api/MessageApi";

export interface Message {
  messageId: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  model?: string;
  timestamp: number;
  thinkingTime?: number;
  rank?: number; // Added rank property
}

export type MessageListener = (message: Message) => void;

/**
 * Service for handling and processing chat messages
 */
export class MessageService {
  private static instance: MessageService;
  private messageListeners: Set<MessageListener> = new Set();
  private processedMessageIds: Set<string> = new Set();
  private messageQueue: Message[] = [];
  private processingQueue: boolean = false;
  private queueTimer: number | null = null;
  
  // Track conversation message counts for ranking
  private conversationMessageCounts: Map<string, number> = new Map();
  
  // Map for pending messages that don't have a conversation ID yet
  private pendingMessages: Map<string, Message> = new Map();
  
  private constructor() {}
  
  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }
  
  /**
   * Initialize the message service
   */
  public initialize(): void {
    // Set up event listeners for messages from injected script
    document.addEventListener('archimind-network-intercept', this.handleNetworkEvent);
    console.log('MessageService initialized');
  }
  
  /**
   * Add a listener for new messages
   */
  public addMessageListener(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    
    // Return cleanup function
    return () => {
      this.messageListeners.delete(listener);
    };
  }
  
  /**
   * Handle network events from the injected script
   */
  private handleNetworkEvent = (event: CustomEvent) => {
    const { type, data } = event.detail;
    
    if (!data) return;
    
    switch (type) {
      case 'chatCompletion':
        this.processUserMessage(data);
        break;
      case 'assistantResponse':
        this.processAssistantResponse(data);
        break;
      case 'specificConversation':
        // When we get a specific conversation, check if we have any pending messages
        // that need to be associated with this conversation
        if (data.conversationId) {
          this.checkAndLinkPendingMessages(data.conversationId);
        }
        break;
    }
  };
  
  /**
   * Extract and process user message from chat completion request
   */
  private processUserMessage(data: any): void {
    if (!data.requestBody?.messages?.length) return;
    
    const userMessage = this.extractUserMessage(data.requestBody);
    if (userMessage) {
      // If the conversation ID is missing, store as pending
      if (!userMessage.conversationId) {
        this.storePendingMessage(userMessage);
      } else {
        // Add rank if message doesn't have one
        if (userMessage.rank === undefined) {
          userMessage.rank = this.getNextRank(userMessage.conversationId);
        }
        
        this.processMessage(userMessage);
      }
    }
  }
  
  /**
   * Store a message without a conversation ID for later processing
   */
  private storePendingMessage(message: Message): void {
    const key = `pending-${message.messageId}`;
    this.pendingMessages.set(key, message);
    
    // Set a cleanup timeout (5 minutes)
    setTimeout(() => {
      this.pendingMessages.delete(key);
    }, 5 * 60 * 1000);
    
    console.log(`Stored pending message: ${message.messageId}`);
  }
  
  /**
   * Check for pending messages and link them to a conversation
   */
  private checkAndLinkPendingMessages(conversationId: string): void {
    if (this.pendingMessages.size === 0) return;
    
    const pendingKeys = Array.from(this.pendingMessages.keys());
    let linked = false;
    
    // Look for pending messages that should be associated with this conversation
    pendingKeys.forEach(key => {
      const message = this.pendingMessages.get(key);
      if (message) {
        // Update the message with the conversation ID and rank
        message.conversationId = conversationId;
        message.rank = this.getNextRank(conversationId);
        
        // Process the updated message
        this.processMessage(message);
        
        // Remove from pending
        this.pendingMessages.delete(key);
        linked = true;
      }
    });
    
    if (linked) {
      console.log(`Linked pending message(s) to conversation: ${conversationId}`);
    }
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
      timestamp: Date.now(),
      rank: requestBody.rank // This might be set by the interceptor
    };
  }
  
  /**
   * Process assistant response
   */
  private processAssistantResponse(data: any): void {
    if (!data.messageId || !data.content) return;
    
    const message: Message = {
      messageId: data.messageId,
      conversationId: data.conversationId || '',
      content: data.content,
      role: 'assistant',
      model: data.model || 'unknown',
      timestamp: data.createTime || Date.now(),
      thinkingTime: data.thinkingTime,
      rank: data.rank || (data.conversationId ? this.getNextRank(data.conversationId) : undefined)
    };
    
    // Only process messages with a conversation ID
    if (message.conversationId) {
      this.processMessage(message);
    } else {
      // Store as pending if no conversation ID
      this.storePendingMessage(message);
    }
  }
  
  /**
   * Get the next rank for a conversation
   */
  private getNextRank(conversationId: string): number {
    const currentCount = this.conversationMessageCounts.get(conversationId) || 0;
    const nextRank = currentCount;
    
    // Update the count for next time
    this.conversationMessageCounts.set(conversationId, currentCount + 1);
    
    return nextRank;
  }
  
  /**
   * Process a message (user or assistant)
   */
  public processMessage(message: Message): void {
    // Skip if already processed
    if (this.processedMessageIds.has(message.messageId)) return;
    
    // Mark as processed
    this.processedMessageIds.add(message.messageId);
    
    // Add to queue for saving
    this.addToQueue(message);
    
    // Notify listeners immediately
    this.notifyListeners(message);
  }
  
  /**
   * Add message to processing queue
   */
  private addToQueue(message: Message): void {
    this.messageQueue.push(message);
    
    // Start processing queue if not already in progress
    if (!this.processingQueue) {
      this.processQueue();
    }
  }
  
  /**
   * Process the message queue
   */
  private processQueue(): void {
    if (this.queueTimer) {
      clearTimeout(this.queueTimer);
      this.queueTimer = null;
    }
    
    // If queue is empty, mark as not processing
    if (this.messageQueue.length === 0) {
      this.processingQueue = false;
      return;
    }
    
    this.processingQueue = true;
    
    // Get next batch of messages (up to 5)
    const batch = this.messageQueue.splice(0, 5);
    
    // Process the batch
    this.saveBatch(batch)
      .finally(() => {
        // Schedule next batch processing
        this.queueTimer = window.setTimeout(() => this.processQueue(), 100);
      });
  }
  
  /**
   * Save a batch of messages
   */
  private async saveBatch(messages: Message[]): Promise<void> {
    if (messages.length === 0) return;
    
    try {
      // Format messages for API
      const formattedMessages = messages.map(msg => ({
        message_id: msg.messageId,
        provider_chat_id: msg.conversationId,
        content: msg.content,
        role: msg.role,
        rank: msg.rank !== undefined ? msg.rank : 0, // Use provided rank or default to 0
        model: msg.model || 'unknown',
        created_at: msg.timestamp
      }));
      
      // Save messages
      await messageApi.saveMessageBatch(formattedMessages);
      console.log(`✅ Saved ${messages.length} messages`, messages);
    } catch (error) {
      console.error('❌ Error saving messages:', error);
    }
  }
  
  /**
   * Notify all listeners of a new message
   */
  private notifyListeners(message: Message): void {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('❌ Error in message listener:', error);
      }
    });
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    document.removeEventListener('archimind-network-intercept', this.handleNetworkEvent);
    
    if (this.queueTimer) {
      clearTimeout(this.queueTimer);
      this.queueTimer = null;
    }
    
    this.messageListeners.clear();
    this.processedMessageIds.clear();
    this.messageQueue = [];
    this.processingQueue = false;
    this.pendingMessages.clear();
    this.conversationMessageCounts.clear();
  }
}

export const messageService = MessageService.getInstance();