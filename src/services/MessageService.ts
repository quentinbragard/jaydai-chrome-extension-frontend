// src/services/MessageService.ts
import { networkRequestMonitor } from '@/utils/NetworkRequestMonitor';
import { messageHandler } from '@/services/handlers/MessageHandler';
import { MessageEvent } from './chat/types';

/**
 * Service to intercept and process chat messages from ChatGPT
 * Focused on network request interception with no DOM dependencies
 */
export class MessageService {
  private static instance: MessageService;
  private cleanupListeners: (() => void)[] = [];
  private processedMessageIds: Set<string> = new Set();
  private storageKey: string = 'archimind_recent_messages';
  private inProcessMessages: Map<string, boolean> = new Map();
  
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
   * Initialize the service - intercept messages via network requests
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
   * Handle chat completion captured by network monitor
   */
  private handleChatCompletionCapture(data: any): void {
    console.log("====CHAT COMPLETION CAPTURED=====", data);
    if (!data) return;
    
    setTimeout(() => {
      try {
        const { requestBody, responseBody, isStreaming } = data;
        
        // Process user message from request body if present
        if (requestBody && requestBody.messages && requestBody.messages.length > 0) {
          const userMessage = this.extractUserMessage(requestBody);
          if (userMessage) {
            this.processMessage({
              type: 'user',
              messageId: userMessage.id,
              content: userMessage.content,
              timestamp: Date.now(),
              conversationId: requestBody.conversation_id || null,
              model: requestBody.model || userMessage.model
            });
          }
        }
        
        // For non-streaming responses
        if (!isStreaming && responseBody && responseBody.message) {
          this.processAssistantMessage(responseBody);
        }
      } catch (error) {
        console.error('❌ Error processing chat completion:', error);
      }
    }, 0);
  }
  
  /**
   * Extract user message from request body
   */
  private extractUserMessage(requestBody: any): { id: string, content: string, model?: string } | null {
    try {
      // Find the user message
      const message = requestBody.messages.find((m: any) => 
        m.author?.role === 'user' || 
        m.role === 'user'
      );
      
      if (!message) return null;
      
      // Extract content
      let content = '';
      if (message.content?.parts && Array.isArray(message.content.parts)) {
        content = message.content.parts.join('\n');
      } else if (typeof message.content === 'string') {
        content = message.content;
      }
      
      if (!content) return null;
      
      return {
        id: message.id || `user-${Date.now()}`,
        content: content,
        model: requestBody.model
      };
    } catch (error) {
      console.error('❌ Error extracting user message:', error);
      return null;
    }
  }
  
  /**
   * Process assistant message from response body
   */
  private processAssistantMessage(responseBody: any): void {
    try {
      const message = responseBody.message;
      const messageId = message.id || `assistant-${Date.now()}`;
      
      // Skip if already processed
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
      
      // Extract role and model
      const role = message.author?.role || 'assistant';
      const model = message.metadata?.model_slug || responseBody.model || 'unknown';
      
      // Process message
      this.processMessage({
        type: role,
        messageId: messageId,
        content: messageContent,
        timestamp: message.create_time || Date.now(),
        conversationId: responseBody.conversation_id || null,
        model: model
      });
      
      this.inProcessMessages.delete(messageId);
    } catch (error) {
      console.error('❌ Error processing assistant message:', error);
    }
  }
  
  /**
   * Handle events from the network interceptor
   */
  private handleInterceptEvent(event: any): void {
    if (!event.detail) return;
    
    const detail = event.detail;
    
    setTimeout(() => {
      try {
        // Handle chat completion events
        if (detail.type === 'chatCompletion' && detail.data) {
          this.handleChatCompletionCapture(detail.data);
        }
        
        // Handle direct streaming completion event
        else if (detail.type === 'streamingComplete' && detail.data) {
          const { messageId, content, model, conversationId } = detail.data;
          
          // Skip if already processed
          if (!messageId || !content || this.processedMessageIds.has(messageId) || 
              this.inProcessMessages.has(messageId)) {
            return;
          }
          
          this.inProcessMessages.set(messageId, true);
          
          // Process the complete message directly
          this.processMessage({
            type: 'assistant',
            messageId,
            content,
            timestamp: Date.now(),
            conversationId,
            model: model || 'unknown'
          });
          
          this.inProcessMessages.delete(messageId);
        }
      } catch (error) {
        console.error('❌ Error in handleInterceptEvent:', error);
      }
    }, 0);
  }
  
  /**
   * Process a message and save it
   */
  private processMessage(message: MessageEvent): void {
    // Skip if already processed
    if (this.processedMessageIds.has(message.messageId)) return;
    
    // Also use the message handler for any additional processing
    messageHandler.processMessage(message);
    
    // Mark as processed
    this.processedMessageIds.add(message.messageId);
    
    // Save periodically
    if (this.processedMessageIds.size % 20 === 0) {
      this.saveProcessedMessageIds();
    }
  }
  
  /**
   * Save processed message IDs to storage
   */
  private saveProcessedMessageIds(): void {
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