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
  
  // Configuration option for saving thinking steps
  private saveThinkinSteps: boolean = false;
  
  // Track messages being built through delta updates
  private messageBuilders: Map<string, {
    id: string, 
    role: string,
    content: string,
    conversationId: string,
    model: string,
    finished: boolean
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
      const { requestBody, responseBody, isStreaming } = data;
      
      console.log('💬 Chat completion captured:', { 
        isStreaming, 
        hasResponseBody: !!responseBody
      });
      
      // Process user message from request body if present
      this.processUserMessage(requestBody);
      
      // For streaming responses, we'll rely on delta events coming from the interceptor
      if (isStreaming) {
        console.log('💬 Streaming response detected, will process via deltas');
        return;
      }
      
      // Handle non-streaming responses
      if (!isStreaming && responseBody) {
        console.log('💬 Processing non-streaming response');
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
      // Look for the user message in the request body
      const userMessage = requestBody.messages.find((m: any) => 
        m.author?.role === 'user' || 
        m.role === 'user'
      );
      
      if (!userMessage) return;
      
      const messageId = userMessage.id || `user-${Date.now()}`;
      
      // Skip if already processed
      if (this.processedMessageIds.has(messageId)) return;
      
      console.log('💬 Processing user message from request:', messageId);
      
      // Extract content
      let content = '';
      if (userMessage.content?.parts && Array.isArray(userMessage.content.parts)) {
        content = userMessage.content.parts.join('\n');
      } else if (typeof userMessage.content === 'string') {
        content = userMessage.content;
      }
      
      if (!content) return;
      
      messageHandler.processMessage({
        type: 'user',
        messageId: messageId,
        content: content,
        timestamp: userMessage.create_time || Date.now(),
        conversationId: requestBody.conversation_id || null,
        model: requestBody.model || 'unknown'
      });
      
      this.processedMessageIds.add(messageId);
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
      
      // Extract content
      let messageContent = '';
      if (message.content?.parts && Array.isArray(message.content.parts)) {
        messageContent = message.content.parts.join('\n');
      } else if (typeof message.content === 'string') {
        messageContent = message.content;
      } else if (message.content?.text) {
        messageContent = message.content.text;
      }
      
      // Extract role
      const role = message.author?.role || 'assistant';
      
      // Extract model information
      const model = message.metadata?.model_slug || 
                   responseBody.model || 
                   'unknown';
      
      messageHandler.processMessage({
        type: role,
        messageId: messageId,
        content: messageContent,
        timestamp: message.create_time || Date.now(),
        conversationId: responseBody.conversation_id || null,
        model: model
      });
      
      this.processedMessageIds.add(messageId);
    } catch (error) {
      console.error('❌ Error processing assistant message:', error);
    }
  }
  
  /**
   * Process streaming deltas specifically for the ChatGPT pattern
   */
    /**
     * Process streaming deltas specifically for the ChatGPT pattern
     * Enhanced to handle the simplified delta format you're seeing
     */
    public processStreamingDelta(delta: any, eventType: string, conversationId: string): void {
        try {
        // Log the delta with a more readable preview
        const valuePreview = delta.v && typeof delta.v === 'string' 
            ? `"${delta.v.substring(0, 30)}${delta.v.length > 30 ? '...' : ''}"` 
            : (delta.v ? typeof delta.v : null);
            
        console.log(`🔄 Delta: ${delta.o || 'unknown'}`, { 
            path: delta.p,
            valuePreview,
            counter: delta.c
        });
    
        // CASE 1: Initial message creation (tool or assistant)
        if (delta.o === 'add' && delta.v?.message) {
            const message = delta.v.message;
            const messageId = message.id;
            const role = message.author?.role || 'assistant';
            const model = message.metadata?.model_slug || 'unknown';
    
            console.log(`💬 New message created: ${messageId} (${role})`);
            
            if (this.processedMessageIds.has(messageId)) {
            console.log(`⚠️ Already processed message: ${messageId}`);
            return;
            }
    
            this.messageBuilders.set(messageId, {
            id: messageId,
            role,
            content: '',
            conversationId,
            model,
            finished: false
            });
        }
    
        // CASE 2: Content appending - including simplified format without 'o' and 'p'
        else if ((delta.o === 'append' && delta.v) || 
                // Handle the simplified delta format with just "v" property
                (delta.v && typeof delta.v === 'string' && !delta.o)) {
            
            // Find the message to append to
            let messageId = this.findMessageId(delta);
            
            if (messageId && this.messageBuilders.has(messageId)) {
            const builder = this.messageBuilders.get(messageId);
            builder.content += delta.v;
            console.log(`📝 Appended: "${delta.v.substring(0, 30)}${delta.v.length > 30 ? '...' : ''}" to ${messageId}`);
            console.log(`📊 Current content length: ${builder.content.length} chars`);
            } else {
            console.log(`⚠️ No message found to append content to`);
            }
        }
    
        // CASE 3: Patch operation with completion signal
        else if (delta.o === 'patch' && Array.isArray(delta.v)) {
            // Find the message being updated
            let messageId = this.findMessageId(delta);
            
            if (!messageId || !this.messageBuilders.has(messageId)) {
            console.log(`⚠️ No message found for patch operation`);
            return;
            }
    
            let isFinished = false;
            let addedContent = '';
    
            // Process each patch operation
            for (const patch of delta.v) {
            // Log each patch operation
            console.log(`🔹 Patch: ${patch.o || 'unknown'}`, {
                path: patch.p,
                value: patch.v && typeof patch.v === 'string' 
                ? `"${patch.v.substring(0, 20)}${patch.v.length > 20 ? '...' : ''}"` 
                : (patch.v ? typeof patch.v : null)
            });
            
            // Handle content appends
            if ((patch.o === 'append' && patch.p?.includes('/message/content/parts/')) && patch.v) {
                addedContent += patch.v;
                const builder = this.messageBuilders.get(messageId);
                builder.content += patch.v;
            }
    
            // Check for completion status
            if (patch.p?.includes('/message/status') && patch.o === 'replace' && patch.v === 'finished_successfully') {
                isFinished = true;
            }
            }
    
            if (addedContent) {
            console.log(`📝 Patched with: "${addedContent}"`);
            }
    
            // If message is finished, mark it and process it
            if (isFinished) {
            console.log(`✅ Message ${messageId} marked as finished`);
            const builder = this.messageBuilders.get(messageId);
            builder.finished = true;
            
            this.finalizeMessage(messageId);
            }
        }
    
        // CASE 4: Message stream complete event
        if (eventType === 'message_stream_complete' || delta.type === 'message_stream_complete') {
            console.log(`🏁 Stream complete for conversation: ${conversationId}`);
            this.finalizeAllMessages(conversationId);
        }
        } catch (error) {
        console.error('❌ Error processing delta:', error);
        }
    }
    
    /**
     * Find the message ID that this delta applies to
     */
    private findMessageId(delta: any): string | null {
        // If we have a counter, use it to find the message
        if (delta.c !== undefined) {
        const messages = Array.from(this.messageBuilders.entries());
        if (messages.length > delta.c) {
            const messageId = messages[delta.c][0];
            console.log(`📌 Found message by counter: ${messageId} (${delta.c})`);
            return messageId;
        }
        }
        
        // Try to extract message ID from the path
        if (delta.p) {
        // Different path patterns to try
        const patterns = [
            /\/message\/([a-f0-9-]+)\/content/,
            /\/message\/([a-f0-9-]+)\//,
            /\/messages\/([a-f0-9-]+)\//
        ];
        
        for (const pattern of patterns) {
            const match = delta.p.match(pattern);
            if (match && match[1]) {
            console.log(`📌 Found message by path: ${match[1]}`);
            return match[1];
            }
        }
        }
        
        // If we can't find by counter or path, use the most recent message
        if (this.messageBuilders.size > 0) {
        const messageId = Array.from(this.messageBuilders.keys()).pop();
        console.log(`📌 Using most recent message: ${messageId}`);
        return messageId;
        }
        
        console.log(`⚠️ Could not find message ID for delta`);
        return null;
    }
    
    /**
     * Finalize a message - process it and mark as complete
     */
    private finalizeMessage(messageId: string): void {
        const builder = this.messageBuilders.get(messageId);
        if (!builder || this.processedMessageIds.has(messageId)) {
        console.log(`⚠️ Cannot finalize message: already processed or not found`);
        return;
        }
    
        // Skip empty messages or thinking steps if configured
        const isTool = builder.role === 'tool';
        const isEmpty = !builder.content.trim();
        
        if (isEmpty) {
        console.log(`⚠️ Skipping empty message: ${messageId}`);
        this.messageBuilders.delete(messageId);
        return;
        }
        
        if (isTool && !this.saveThinkinSteps) {
        console.log(`⚠️ Skipping thinking step: ${messageId}`);
        this.messageBuilders.delete(messageId);
        return;
        }
    
        console.log(`💾 FINALIZING MESSAGE ${messageId} (${builder.role})`);
        console.log(`📄 Content: "${builder.content.substring(0, 100)}${builder.content.length > 100 ? '...' : ''}"`);
        console.log(`📊 Length: ${builder.content.length} chars`);
        
        try {
        // Process the message - THIS IS WHERE THE MESSAGE GETS SAVED
        messageHandler.processMessage({
            type: builder.role as any,
            messageId: builder.id,
            content: builder.content,
            timestamp: Date.now(),
            conversationId: builder.conversationId,
            model: builder.model
        });
        
        console.log(`✅ Successfully processed message: ${messageId}`);
        
        // Mark as processed
        this.processedMessageIds.add(messageId);
        
        // Remove from builders map
        this.messageBuilders.delete(messageId);
        } catch (error) {
        console.error(`❌ Error finalizing message ${messageId}:`, error);
        }
    }
    
    /**
     * Finalize all pending messages for a conversation
     */
    private finalizeAllMessages(conversationId: string): void {
        console.log(`📋 Finalizing all messages for conversation: ${conversationId}`);
        
        try {
        // Find all messages for this conversation
        const pendingMessages = Array.from(this.messageBuilders.entries())
            .filter(([_, builder]) => builder.conversationId === conversationId);
        
        console.log(`📊 Found ${pendingMessages.length} pending messages`);
        
        // Process each pending message
        for (const [messageId, _] of pendingMessages) {
            this.finalizeMessage(messageId);
        }
        
        console.log(`✅ Finalized all pending messages for conversation: ${conversationId}`);
        } catch (error) {
        console.error(`❌ Error finalizing messages for conversation ${conversationId}:`, error);
        }
    }
  
  /**
   * Handle events from the network interceptor
   */
  private handleInterceptEvent(event: any): void {
    if (!event.detail) return;
    
    const detail = event.detail;
    
    // Handle chat completion events
    if (detail.type === 'chatCompletion' && detail.data) {
      this.handleChatCompletionCapture(detail.data);
    }
    
    // For streaming message completions, handle deltas if available
    if (detail.type === 'streamingDelta' && detail.delta) {
      const conversationId = detail.conversationId || 'unknown';
      const eventType = detail.eventType || 'unknown';
      
      this.processStreamingDelta(
        detail.delta, 
        eventType,
        conversationId
      );
    }
    
    // Handle streaming completion notification
    if (detail.type === 'streamingComplete' && detail.conversationId) {
      this.finalizeAllMessages(detail.conversationId);
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