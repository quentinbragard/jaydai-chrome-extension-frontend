// src/services/MessageService.ts
import { networkRequestMonitor } from '@/utils/NetworkRequestMonitor';
import { messageHandler } from '@/services/handlers/MessageHandler';
import { MessageEvent } from './chat/types';

/**
 * Service to intercept and process chat messages from ChatGPT
 */
export class MessageService {
  private static instance: MessageService;
  private cleanupListeners: (() => void)[] = [];
  private processedMessageIds: Set<string> = new Set();
  private storageKey: string = 'archimind_recent_messages';
  private inProcessMessages: Map<string, boolean> = new Map(); // Track in-process messages
  private processingDelay: number = 50; // ms between processing messages
  
  // Configuration option for saving thinking steps
  private saveThinkinSteps: boolean = false;
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }
  
  /**
   * Initialize the service - intercept messages
   */
  public initialize(): void {
    console.log('💬 Initializing message service...');
    
    // Initialize network request monitoring
    networkRequestMonitor.initialize();
    
    // Listen for chat completion endpoints
    const removeChatCompletionListener = networkRequestMonitor.addListener(
      '/backend-api/conversation',
      this.handleChatCompletionCapture.bind(this)
    );
    this.cleanupListeners.push(removeChatCompletionListener);
    
    // Add event listener for message data from injected script
    document.addEventListener('archimind-network-intercept', this.handleInterceptEvent.bind(this));
    
    // Load processed message IDs from storage to avoid duplicates
    this.loadProcessedMessageIds();
    
    console.log('✅ Message service initialized');
  }
  
  /**
   * Handle chat completion captured by network monitor - optimized
   */
  private handleChatCompletionCapture(data: any): void {
    if (!data) return;
    
    // Use debounce to prevent excessive processing
    setTimeout(() => {
      try {
        const { requestBody, responseBody, isStreaming } = data;
        
        // Process user message from request body if present - but don't block
        if (requestBody && requestBody.messages && requestBody.messages.length > 0) {
          setTimeout(() => this.processUserMessage(requestBody), this.processingDelay);
        }
        
        // For non-streaming responses only
        if (!isStreaming && responseBody) {
          setTimeout(() => this.processAssistantMessage(responseBody), this.processingDelay);
        }
      } catch (error) {
        console.error('❌ Error processing chat completion:', error);
      }
    }, 0);
  }
  
  /**
   * Process user message from request body - optimized
   */
  private processUserMessage(requestBody: any): void {
    if (!requestBody || !requestBody.messages || !requestBody.messages.length) return;
    
    try {
      // Look for the user message in the request body
      const userMessage = requestBody.messages.find((m: any) => 
        m.author?.role === 'user' || 
        m.role === 'user'
      );
      
      if (!userMessage) return;
      
      const messageId = userMessage.id || `user-${Date.now()}`;
      
      // Skip if already processed or in process
      if (this.processedMessageIds.has(messageId) || this.inProcessMessages.has(messageId)) return;
      this.inProcessMessages.set(messageId, true);
      
      // Extract content
      let content = '';
      if (userMessage.content?.parts && Array.isArray(userMessage.content.parts)) {
        content = userMessage.content.parts.join('\n');
      } else if (typeof userMessage.content === 'string') {
        content = userMessage.content;
      }
      
      if (!content) {
        this.inProcessMessages.delete(messageId);
        return;
      }
      
      messageHandler.processMessage({
        type: 'user',
        messageId: messageId,
        content: content,
        timestamp: userMessage.create_time || Date.now(),
        conversationId: requestBody.conversation_id || null,
        model: requestBody.model || 'unknown'
      });
      
      this.processedMessageIds.add(messageId);
      this.inProcessMessages.delete(messageId);
    } catch (error) {
      console.error('❌ Error processing user message:', error);
    }
  }
  
  /**
   * Process assistant message from response body - optimized
   */
  private processAssistantMessage(responseBody: any): void {
    if (!responseBody || !responseBody.message) return;
    
    try {
      const message = responseBody.message;
      const messageId = message.id || `assistant-${Date.now()}`;
      
      // Skip if already processed or in process
      if (this.processedMessageIds.has(messageId) || this.inProcessMessages.has(messageId)) return;
      this.inProcessMessages.set(messageId, true);
      
      // Extract content
      let messageContent = '';
      if (message.content?.parts && Array.isArray(message.content.parts)) {
        messageContent = message.content.parts.join('\n');
      } else if (typeof message.content === 'string') {
        messageContent = message.content;
      } else if (message.content?.text) {
        messageContent = message.content.text;
      }
      
      if (!messageContent) {
        this.inProcessMessages.delete(messageId);
        return;
      }
      
      // Extract role
      const role = message.author?.role || 'assistant';
      
      // Extract model information
      const model = message.metadata?.model_slug || 
                   responseBody.model || 
                   'unknown';
      
      // Process with a slight delay to not block UI
      messageHandler.processMessage({
        type: role,
        messageId: messageId,
        content: messageContent,
        timestamp: message.create_time || Date.now(),
        conversationId: responseBody.conversation_id || null,
        model: model
      });
      
      this.processedMessageIds.add(messageId);
      this.inProcessMessages.delete(messageId);
    } catch (error) {
      console.error('❌ Error processing assistant message:', error);
    }
  }
  
  /**
   * Handle events from the network interceptor - optimized
   */
  private handleInterceptEvent(event: any): void {
    if (!event.detail) return;
    
    const detail = event.detail;
    
    // Process in next tick to prevent UI blocking
    setTimeout(() => {
      try {
        // Handle chat completion events
        if (detail.type === 'chatCompletion' && detail.data) {
          this.handleChatCompletionCapture(detail.data);
        }
        
        // Handle direct streaming completion event - this is the more efficient path
        else if (detail.type === 'streamingComplete' && detail.data) {
          const { messageId, content, model, conversationId } = detail.data;
          
          // Skip if already processed
          if (!messageId || !content || this.processedMessageIds.has(messageId) || 
              this.inProcessMessages.has(messageId)) {
            return;
          }
          
          this.inProcessMessages.set(messageId, true);
          
          // Process the complete message directly
          messageHandler.processMessage({
            type: 'assistant',
            messageId,
            content,
            timestamp: Date.now(),
            conversationId,
            model: model || 'unknown'
          });
          
          // Mark as processed
          this.processedMessageIds.add(messageId);
          this.inProcessMessages.delete(messageId);
          
          // Save periodically
          if (this.processedMessageIds.size % 20 === 0) {
            this.saveProcessedMessageIds();
          }
        }
      } catch (error) {
        console.error('❌ Error in handleInterceptEvent:', error);
      }
    }, 0);
  }
  
  /**
   * Save processed message IDs to storage - with throttling
   */
  private saveProcessedMessageIds(): void {
    // Limit to prevent storage bloat
    try {
      // Keep only the most recent 500 message IDs 
      const recentIds = Array.from(this.processedMessageIds).slice(-500);
      
      chrome.storage.local.set({ [this.storageKey]: recentIds });
    } catch (error) {
      console.error('❌ Error saving processed message IDs to storage:', error);
    }
  }
  
  /**
   * Load processed message IDs from storage
   */
  private loadProcessedMessageIds(): void {
    try {
      chrome.storage.local.get([this.storageKey], (result) => {
        if (result && result[this.storageKey] && Array.isArray(result[this.storageKey])) {
          // Only load up to 500 IDs to prevent memory bloat
          const ids = result[this.storageKey].slice(-500);
          ids.forEach((id: string) => {
            this.processedMessageIds.add(id);
          });
          console.log(`💬 Loaded ${this.processedMessageIds.size} processed message IDs from storage`);
        }
      });
    } catch (error) {
      console.error('❌ Error loading processed message IDs from storage:', error);
    }
  }
  
  /**
   * Process a message directly - with optimization
   */
  public processMessage(message: MessageEvent): void {
    // Skip if already processed or in process
    if (this.processedMessageIds.has(message.messageId) || 
        this.inProcessMessages.has(message.messageId)) {
      return;
    }
    
    this.inProcessMessages.set(message.messageId, true);
    
    // Process with a slight delay
    setTimeout(() => {
      messageHandler.processMessage(message);
      this.processedMessageIds.add(message.messageId);
      this.inProcessMessages.delete(message.messageId);
      
      // Save periodically
      if (this.processedMessageIds.size % 20 === 0) {
        this.saveProcessedMessageIds();
      }
    }, this.processingDelay);
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Save processed message IDs before cleanup
    this.saveProcessedMessageIds();
    
    // Remove all listeners
    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];
    
    // Remove event listener
    document.removeEventListener('archimind-network-intercept', this.handleInterceptEvent.bind(this));
    
    console.log('✅ Message service cleaned up');
  }
}

// Export a singleton instance
export const messageService = MessageService.getInstance();