// src/services/chat/StreamProcessor.ts
// Handles processing of streaming responses from ChatGPT API
import { AssistantStreamMessage } from './types';

/**
 * Service to process streaming responses from ChatGPT API
 */
export class StreamProcessor {
  /**
   * Process a streaming response into a complete message
   * @param response The fetch Response object with streaming content
   * @param requestBody The original request body
   * @returns Promise that resolves to the assembled message when complete
   */
  public static async processStream(
    response: Response, 
    requestBody: any
  ): Promise<AssistantStreamMessage | null> {
    try {
      // Set up stream processing
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantMessage: any = null;
      let messageContent = '';
      let conversationId = requestBody?.conversation_id || null;
      let modelName = requestBody?.model || null;
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
            
            // Extract data from event
            const dataMatch = event.match(/data: (.*)/);
            if (!dataMatch) continue;
            
            // Skip [DONE] marker
            if (dataMatch[1].trim() === '[DONE]') {
              isDone = true;
              continue;
            }
            
            let data;
            try {
              data = JSON.parse(dataMatch[1]);
            } catch (e) {
              continue; // Skip non-JSON data
            }
            
            // Handle message start (usually the first delta)
            if (data.v && data.v.message && !assistantMessage) {
              assistantMessage = data.v.message;
              messageContent = data.v.message.content?.parts?.[0] || '';
              conversationId = data.v.conversation_id || conversationId;
              modelName = data.v.message.metadata?.model_slug || modelName;
            }
            
            // Handle content updates
            if (data.v && typeof data.v === 'string') {
              messageContent += data.v;
            }
            
            // Handle path-based updates
            if (data.p && data.p.includes('/message/content/parts/0') && data.o === 'append' && data.v) {
              messageContent += data.v;
            }
            
            // Check for completion markers
            if (data.type === 'message_stream_complete' || 
                (data.p && data.v && data.v.message?.end_turn === true)) {
              isDone = true;
            }
          }
        }
        
        // If we have a complete message, return it
        if (assistantMessage && conversationId && messageContent) {
          return {
            id: assistantMessage.id || `assistant-${Date.now()}`,
            content: messageContent,
            conversationId: conversationId,
            model: modelName || 'unknown'
          };
        }
        
        return null;
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
    
    const message = requestBody.messages[0];
    
    if (!message || !message.author || message.author.role !== 'user') {
      return null;
    }
    
    return {
      id: message.id || `user-${Date.now()}`,
      content: message.content?.parts?.join('\n') || message.content || '',
      model: requestBody.model
    };
  }
}