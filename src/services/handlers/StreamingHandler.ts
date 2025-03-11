// src/services/chat/StreamingHandler.ts
// Updated to handle the delta-based streaming format
import { AssistantStreamMessage } from './types';

/**
 * Service to process streaming responses from ChatGPT API
 */
export class StreamingHandler {
  /**
   * Process a streaming response into a complete message
   * @param response The fetch Response object with streaming content
   * @param requestBody The original request body
   * @returns Promise that resolves to the assembled message when complete
   */
  public static async processStream(
    response: Response, 
    requestBody: any
  ): Promise<AssistantStreamMessage[] | null> {
    try {
      // Set up stream processing
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let messageContents: Map<string, string> = new Map();
      let messages: Map<string, any> = new Map();
      let conversationId = requestBody?.conversation_id || null;
      let isDone = false;
      
      try {
        while (!isDone) {
          const { done, value } = await reader.read();
          if (done) {
            isDone = true;
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete events in the buffer
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // Keep the last incomplete chunk in the buffer
          
          for (const event of events) {
            if (!event.trim()) continue;
            
            // Extract event type and data
            const eventMatch = event.match(/^event: ([^\n]+)/);
            const dataMatch = event.match(/data: (.+)$/m);
            
            if (!dataMatch) continue;
            
            const eventType = eventMatch ? eventMatch[1] : 'unknown';
            let data: any;
            
            try {
              // Skip [DONE] marker
              if (dataMatch[1].trim() === '[DONE]') {
                isDone = true;
                continue;
              }
              
              data = JSON.parse(dataMatch[1]);
            } catch (e) {
              console.error('Error parsing event data:', e);
              continue;
            }
            
            // Handle different event types
            if (eventType === 'delta') {
              this.processDeltas(data, messages, messageContents, conversationId);
            } else if (dataMatch[1].includes('message_stream_complete')) {
              isDone = true;
            }
          }
        }
        
        // Convert the collected messages to the expected format
        const result: AssistantStreamMessage[] = [];
        
        messages.forEach((message, messageId) => {
          // Only include messages with content
          if (messageContents.has(messageId) && messageContents.get(messageId)?.trim()) {
            result.push({
              id: messageId,
              content: messageContents.get(messageId) || '',
              conversationId: conversationId,
              model: message.metadata?.model_slug || 'unknown',
              role: message.author?.role || 'assistant'
            });
          }
        });
        
        return result.length > 0 ? result : null;
      } catch (error) {
        console.error('❌ Error processing streaming response:', error);
        return null;
      }
    } catch (error) {
      console.error('❌ Error setting up stream processing:', error);
      return null;
    }
  }
  
  /**
   * Process delta updates from the stream
   */
  private static processDeltas(
    data: any, 
    messages: Map<string, any>,
    messageContents: Map<string, string>,
    conversationId: string
  ): void {
    try {
      // Handle message creation
      if (data.o === 'add' && data.v && data.v.message) {
        const message = data.v.message;
        const messageId = message.id;
        
        // Initialize this message
        messages.set(messageId, message);
        messageContents.set(messageId, '');
        
        // Debug log for new message
        console.log(`💬 New message in stream: ${messageId} (${message.author?.role || 'unknown'})`);
      }
      
      // Handle content appending
      if (data.o === 'append' && data.v) {
        let messageId = this.findMessageId(data, messages);
        
        if (messageId && messageContents.has(messageId)) {
          messageContents.set(messageId, messageContents.get(messageId) + data.v);
        }
      }
      
      // Handle truncate operations
      if (data.o === 'truncate' && typeof data.v === 'number') {
        let messageId = this.findMessageId(data, messages);
        
        if (messageId && messageContents.has(messageId) && data.v === 0) {
          messageContents.set(messageId, ''); // Reset content
        }
      }
      
      // Handle patch operations
      if (data.o === 'patch' && Array.isArray(data.v)) {
        let messageId = this.findMessageId(data, messages);
        
        if (messageId && messageContents.has(messageId)) {
          for (const patch of data.v) {
            if (patch.o === 'append' && patch.v) {
              messageContents.set(messageId, messageContents.get(messageId) + patch.v);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error processing delta:', error);
    }
  }
  
  /**
   * Find which message a delta applies to
   */
  private static findMessageId(data: any, messages: Map<string, any>): string | null {
    // Try to use counter value if present
    if (data.c !== undefined) {
      const entries = Array.from(messages.entries());
      if (entries.length > data.c) {
        return entries[data.c][0];
      }
    }
    
    // Try to extract message ID from path
    if (data.p) {
      const match = data.p.match(/\/message\/id\/([a-f0-9-]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Default to most recent message
    if (messages.size > 0) {
      return Array.from(messages.keys()).pop() || null;
    }
    
    return null;
  }
  
  /**
   * Check if response is a streaming response
   */
  public static isStreamingResponse(response: Response): boolean {
    return response.headers.get('content-type')?.includes('text/event-stream') || false;
  }
  
  /**
   * Extract the user message from a request body, if present
   */
  public static extractUserMessage(requestBody: any): { id: string, content: string, model?: string } | null {
    if (!requestBody || !requestBody.messages || !requestBody.messages.length) {
      return null;
    }
    
    // Find the user message
    const message = requestBody.messages.find((m: any) => 
      m.author?.role === 'user' || 
      m.role === 'user'
    );
    
    if (!message) {
      return null;
    }
    
    // Extract content
    let content = '';
    if (message.content?.parts && Array.isArray(message.content.parts)) {
      content = message.content.parts.join('\n');
    } else if (typeof message.content === 'string') {
      content = message.content;
    }
    
    return {
      id: message.id || `user-${Date.now()}`,
      content: content,
      model: requestBody.model
    };
  }
}