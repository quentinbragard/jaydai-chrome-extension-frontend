// src/services/MessageService.ts - Fixed with proper streaming delta support
import { networkRequestMonitor } from '@/utils/NetworkRequestMonitor';
import { messageHandler } from '@/services/handlers/MessageHandler';
import { StreamingHandler } from '@/services/handlers/StreamingHandler';
import { MessageEvent } from './chat/types';

/**
 * Service to intercept and process chat messages
 */
export class MessageService {
  private static instance: MessageService;
  private cleanupListeners: (() => void)[] = [];
  private processedMessageIds: Set<string> = new Set();
  private storageKey: string = 'archimind_recent_messages';
  
  // Track messages being built through delta updates
  private messageBuilders: Map<string, {
    id: string, 
    role: string,
    content: string,
    conversationId: string,
    model: string
  }> = new Map();
  
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
   * Handle chat completion captured by network monitor
   */
  private async handleChatCompletionCapture(data: any): Promise<void> {
    if (!data) return;
    
    try {
      const { requestBody, responseBody, isStreaming, url, response } = data;
      
      // Process user message from request body if present
      this.processUserMessage(requestBody);
      
      // Handle streaming responses - requires the original response object
      if (isStreaming && response) {
        console.log('💬 Processing streaming response for chat completion');
        this.handleStreamingResponse(response, requestBody);
        return;
      }
      
      // For streaming responses where we can't get the original response
      // We need to rely on the injectedInterceptor to send us deltas
      if (isStreaming) {
        console.log('💬 Streaming response detected, will process via deltas');
        return;
      }
      
      // Handle non-streaming responses
      if (!isStreaming && responseBody) {
        this.processAssistantMessage(responseBody);
      }
      
      // Save processed message IDs periodically
      this.saveProcessedMessageIds();
    } catch (error) {
      console.error('❌ Error processing chat completion:', error);
    }
  }
  
  /**
   * Process user message from request body
   */
  private processUserMessage(requestBody: any): void {
    if (!requestBody || !requestBody.messages || !requestBody.messages.length) return;
    
    try {
      const userMessage = StreamingHandler.extractUserMessage(requestBody);
      if (userMessage && !this.processedMessageIds.has(userMessage.id)) {
        console.log('💬 Processing user message from request:', userMessage.id);
        
        messageHandler.processMessage({
          type: 'user',
          messageId: userMessage.id,
          content: userMessage.content,
          timestamp: Date.now(),
          conversationId: requestBody.conversation_id || null,
          model: requestBody.model || userMessage.model
        });
        
        this.processedMessageIds.add(userMessage.id);
      }
    } catch (error) {
      console.error('❌ Error processing user message:', error);
    }
  }
  
  /**
   * Process assistant message from response body
   */
  private processAssistantMessage(responseBody: any): void {
    if (!responseBody || !responseBody.message) return;
    
    try {
      const message = responseBody.message;
      const messageId = message.id || `assistant-${Date.now()}`;
      
      if (this.processedMessageIds.has(messageId)) return;
      
      console.log('💬 Processing assistant message from response:', messageId);
      
      const messageContent = message.content?.parts?.join('\n') || 
                            message.content || '';
      
      // Extract model information
      const model = message.metadata?.model_slug || 
                   responseBody.model || 
                   'unknown';
      
      messageHandler.processMessage({
        type: message.author?.role || 'assistant',
        messageId: messageId,
        content: messageContent,
        timestamp: Date.now(),
        conversationId: responseBody.conversation_id || null,
        model: model
      });
      
      this.processedMessageIds.add(messageId);
    } catch (error) {
      console.error('❌ Error processing assistant message:', error);
    }
  }
  
  /**
   * Handle streaming response using the StreamingHandler
   */
  private async handleStreamingResponse(response: Response, requestBody: any): Promise<void> {
    try {
      // Create a clone of the response to process
      const clonedResponse = response.clone();
      
      // Process the stream
      const messages = await StreamingHandler.processStream(clonedResponse, requestBody);
      
      if (!messages || messages.length === 0) {
        console.warn('⚠️ No messages extracted from stream');
        return;
      }
      
      // Process each message
      for (const message of messages) {
        if (this.processedMessageIds.has(message.id)) continue;
        
        console.log(`💬 Processing ${message.role} message from stream:`, message.id);
        
        messageHandler.processMessage({
          type: message.role as 'user' | 'assistant' | 'system' | 'tool',
          messageId: message.id,
          content: message.content,
          timestamp: Date.now(),
          conversationId: message.conversationId,
          model: message.model
        });
        
        this.processedMessageIds.add(message.id);
      }
    } catch (error) {
      console.error('❌ Error handling streaming response:', error);
    }
  }
  
  /**
   * Process a streaming delta event
   */
  public processStreamingDelta(delta: any, eventType: string, conversationId: string): void {
    try {
      // Handle different types of delta updates
      if (eventType === 'delta' || eventType === 'unknown') {
        if (delta.o === 'add' && delta.v && delta.v.message) {
          // New message being created
          const message = delta.v.message;
          const messageId = message.id;
          
          // Skip if we've already processed this message
          if (this.processedMessageIds.has(messageId)) return;
          
          // Extract role and model from the message metadata
          const role = message.author?.role || 'assistant';
          const model = message.metadata?.model_slug || 'unknown';
          
          // Initialize content for this message ID
          this.messageBuilders.set(messageId, {
            id: messageId,
            role,
            content: '',
            conversationId,
            model
          });
          
          console.log(`💬 New message initialized in stream: ${messageId} (${role})`);
        } 
        else if (delta.p?.includes('/message/content/parts/0') && delta.o === 'append' && delta.v) {
          // Content being appended to an existing message
          // Determine which message this applies to using the counter
          let messageId: string | null = null;
          
          // If we have a counter value, use it to find the message
          if (delta.c !== undefined) {
            const messages = Array.from(this.messageBuilders.values());
            if (messages.length > delta.c) {
              messageId = messages[delta.c].id;
            }
          } 
          // Otherwise, use the most recent message
          else if (this.messageBuilders.size > 0) {
            const messages = Array.from(this.messageBuilders.values());
            messageId = messages[messages.length - 1].id;
          }
          
          // Append content if we found a message
          if (messageId && this.messageBuilders.has(messageId)) {
            const builder = this.messageBuilders.get(messageId)!;
            builder.content += delta.v;
            this.messageBuilders.set(messageId, builder);
          }
        }
        else if (delta.o === 'patch' && Array.isArray(delta.v)) {
          // Complex patch operation
          for (const patch of delta.v) {
            if (patch.p?.includes('/message/content/parts/0') && patch.o === 'append' && patch.v) {
              // Similar to the append case above
              let messageId: string | null = null;
              
              if (delta.c !== undefined) {
                const messages = Array.from(this.messageBuilders.values());
                if (messages.length > delta.c) {
                  messageId = messages[delta.c].id;
                }
              } else if (this.messageBuilders.size > 0) {
                const messages = Array.from(this.messageBuilders.values());
                messageId = messages[messages.length - 1].id;
              }
              
              if (messageId && this.messageBuilders.has(messageId)) {
                const builder = this.messageBuilders.get(messageId)!;
                builder.content += patch.v;
                this.messageBuilders.set(messageId, builder);
              }
            }
            
            // Check for message completion
            if (patch.p?.includes('/message/status') && patch.o === 'replace' && patch.v === 'finished_successfully') {
              // Find which message was completed
              let messageId: string | null = null;
              
              if (delta.c !== undefined) {
                const messages = Array.from(this.messageBuilders.values());
                if (messages.length > delta.c) {
                  messageId = messages[delta.c].id;
                }
              } else if (this.messageBuilders.size > 0) {
                const messages = Array.from(this.messageBuilders.values());
                messageId = messages[messages.length - 1].id;
              }
              
              // Process the completed message
              if (messageId && this.messageBuilders.has(messageId)) {
                const builder = this.messageBuilders.get(messageId)!;
                
                // Only process if we have meaningful content and haven't processed this message yet
                if (builder.content && !this.processedMessageIds.has(builder.id)) {
                  console.log(`💬 Processing completed stream message: ${builder.id}`);
                  
                  messageHandler.processMessage({
                    type: builder.role as 'user' | 'assistant' | 'system' | 'tool',
                    messageId: builder.id,
                    content: builder.content,
                    timestamp: Date.now(),
                    conversationId: builder.conversationId,
                    model: builder.model
                  });
                  
                  this.processedMessageIds.add(builder.id);
                }
                
                // Remove from builders map to free up memory
                this.messageBuilders.delete(messageId);
              }
            }
          }
        }
      } 
      else if (eventType === 'message_stream_complete' || delta.type === 'message_stream_complete') {
        // Stream is complete - process any remaining messages
        for (const [messageId, builder] of this.messageBuilders.entries()) {
          if (builder.content && !this.processedMessageIds.has(builder.id)) {
            console.log(`💬 Processing final stream message: ${builder.id}`);
            
            messageHandler.processMessage({
              type: builder.role as 'user' | 'assistant' | 'system' | 'tool',
              messageId: builder.id,
              content: builder.content,
              timestamp: Date.now(),
              conversationId: builder.conversationId,
              model: builder.model
            });
            
            this.processedMessageIds.add(builder.id);
          }
        }
        
        // Clear the builders map
        this.messageBuilders.clear();
      }
    } catch (error) {
      console.error('❌ Error processing streaming delta:', error);
    }
  }
  
  /**
   * Handle events from the network interceptor
   */
  private handleInterceptEvent(event: any): void {
    if (!event.detail) return;
    
    // Handle chat completion events
    if (event.detail.type === 'chatCompletion' && event.detail.data) {
      this.handleChatCompletionCapture(event.detail.data);
    }
    
    // For streaming message completions, handle deltas if available
    if (event.detail.type === 'streamingDelta' && event.detail.delta) {
      this.processStreamingDelta(
        event.detail.delta, 
        event.detail.eventType || 'unknown', 
        event.detail.conversationId || 'unknown'
      );
    }
    
    // Handle streaming completion notification
    if (event.detail.type === 'streamingComplete' && event.detail.conversationId) {
      // Process any pending messages that weren't marked as finished
      for (const [messageId, builder] of this.messageBuilders.entries()) {
        if (builder.content && !this.processedMessageIds.has(builder.id)) {
          console.log(`💬 Processing remaining message at stream completion: ${builder.id}`);
          
          messageHandler.processMessage({
            type: builder.role as 'user' | 'assistant' | 'system' | 'tool',
            messageId: builder.id,
            content: builder.content,
            timestamp: Date.now(),
            conversationId: builder.conversationId,
            model: builder.model
          });
          
          this.processedMessageIds.add(builder.id);
        }
      }
      
      // Clear the builders for this conversation
      this.messageBuilders.clear();
    }
  }
  
  /**
   * Save processed message IDs to storage
   */
  private saveProcessedMessageIds(): void {
    try {
      // Keep only the most recent 1000 message IDs to prevent storage from growing too large
      const recentIds = Array.from(this.processedMessageIds).slice(-1000);
      
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
          result[this.storageKey].forEach((id: string) => {
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
   * Process a message directly
   */
  public processMessage(message: MessageEvent): void {
    if (this.processedMessageIds.has(message.messageId)) {
      return; // Skip already processed messages
    }
    
    messageHandler.processMessage(message);
    this.processedMessageIds.add(message.messageId);
    
    // Save periodically
    if (this.processedMessageIds.size % 10 === 0) {
      this.saveProcessedMessageIds();
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