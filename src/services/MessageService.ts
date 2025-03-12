// src/services/chat/MessageService.ts

import { messageApi } from "../api/MessageApi";

export interface Message {
  messageId: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  model?: string;
  timestamp: number;
  thinkingTime?: number;
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
    }
  };
  
  /**
   * Extract and process user message from chat completion request
   */
  private processUserMessage(data: any): void {
    if (!data.requestBody?.messages?.length) return;
    
    const userMessage = this.extractUserMessage(data.requestBody);
    if (userMessage) {
      this.processMessage(userMessage);
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
      timestamp: Date.now()
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
      thinkingTime: data.thinkingTime
    };
    
    this.processMessage(message);
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
        rank: 0, // Could be improved
        model: msg.model || 'unknown',
        created_at: msg.timestamp
      }));
      
      // Save messages
      await messageApi.saveMessageBatch(formattedMessages);
      console.log(`✅ Saved ${messages.length} messages`);
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
  }
}

export const messageService = MessageService.getInstance();