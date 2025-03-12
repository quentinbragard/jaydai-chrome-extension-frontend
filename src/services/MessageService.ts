import { networkRequestMonitor } from '@/utils/NetworkRequestMonitor';
import { apiService } from '@/services/ApiService';

// Define consistent message interface
export interface MessageEvent {
  message_id: string;
  provider_chat_id: string;
  content: string;
  role: string;
  rank: number;
  model: string;
  created_at: number;
  type?: string;
  conversationId?: string;
  thinkingTime?: number;
}

// Define assistant response data interface
interface AssistantResponseData {
  messageId: string;
  conversationId: string;
  createTime: number;
  model: string;
  content: string;
  isComplete: boolean;
}

export class MessageService {
  private static instance: MessageService | null = null;
  private processedMessageIds = new Set<string>();
  
  private constructor() {
    this.handleNetworkEvent = this.handleNetworkEvent.bind(this);
    this.handleChatCompletion = this.handleChatCompletion.bind(this);
    this.processStreamingResponse = this.processStreamingResponse.bind(this);
  }

  public static getInstance(): MessageService {
    if (!this.instance) {
      this.instance = new MessageService();
    }
    return this.instance;
  }

  public initialize(): void {
    try {
      // Set up event listeners
      document.addEventListener('archimind-network-intercept', this.handleNetworkEvent);
      
      // Add listener for chat completion endpoint
      if (networkRequestMonitor) {
        networkRequestMonitor.addListener('/backend-api/conversation', this.handleChatCompletion);
      }
      
      console.log('MessageService initialized');
    } catch (error) {
      console.error('MessageService initialization error:', error);
    }
  }

  private handleNetworkEvent(event: CustomEvent): void {
    try {
      const { type, data } = event.detail;

      switch(type) {
        case 'chatCompletion':
          this.handleChatCompletion(data);
          break;
        case 'streamedChatCompletion':
          this.processStreamingResponse(data);
          break;
        case 'assistantResponse':
          this.handleAssistantResponse(data);
          break;
      }
    } catch (error) {
      console.error('Network event handler error:', error);
    }
  }

  private handleChatCompletion(data: any): void {
    try {
      if (!data?.requestBody?.messages?.length) return;
      
      // Extract and save user message
      const userMessage = this.extractUserMessage(data.requestBody);
      if (userMessage) {
        this.saveMessage(userMessage);
      }
    } catch (error) {
      console.error('Chat completion processing error:', error);
    }
  }

  private processStreamingResponse(data: any): void {
    try {
      const { buffer, requestBody } = data;
      
      // Skip incomplete streams
      if (!buffer || !buffer.includes('[DONE]')) return;
      
      // Parse the stream events
      const events = this.parseStreamEvents(buffer);
      
      // Extract assistant message and content
      const { messageId, content, model } = this.extractAssistantContent(events, requestBody);
      
      if (messageId && content) {
        // Create assistant message
        const assistantMessage = {
          message_id: messageId,
          provider_chat_id: requestBody?.conversation_id || '',
          content: content,
          role: 'assistant',
          rank: 1,
          model: model || requestBody?.model || 'unknown',
          created_at: Date.now()
        };
        
        // Save the chat title if available
        if (requestBody?.conversation_id) {
          // Try to extract a title from the conversation or create a default one
          const title = content.split('\\n')[0].substring(0, 50) || 
                        `Chat ${new Date().toLocaleString()}`;
                        
          // Save chat directly
          this.saveChat(requestBody.conversation_id, title);
        }
        
        // Save message directly
        this.saveMessage(assistantMessage);
      }
    } catch (error) {
      console.error('Stream processing error:', error);
    }
  }

  private parseStreamEvents(buffer: string): any[] {
    const events: any[] = [];
    const chunks = buffer.split('\\n');
    
    for (const chunk of chunks) {
      if (chunk.startsWith('data: ') && chunk !== 'data: [DONE]') {
        try {
          const data = chunk.substring(6);
          const parsed = JSON.parse(data);
          events.push(parsed);
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
    
    return events;
  }

  private extractAssistantContent(events: any[], requestBody: any): { 
    messageId: string, 
    content: string,
    model: string
  } {
    let messageId = '';
    let content = '';
    let model = '';
    
    // Find the assistant message - simplest approach
    for (const event of events) {
      if (event.message?.id && event.message.author?.role === 'assistant') {
        messageId = event.message.id;
        model = event.message.metadata?.model_slug || '';
        
        if (event.message.content?.parts) {
          content = event.message.content.parts.join('\\n');
          break; // Found what we need
        }
      }
      
      if (event.delta?.content) {
        content += event.delta.content;
      }
      
      if (typeof event.v === 'string' && event.o === 'append') {
        content += event.v;
      }
    }
    
    // If we still don't have a message ID, generate one
    if (!messageId && content) {
      messageId = `assistant-${Date.now()}`;
    }
    
    return { messageId, content: content.trim(), model };
  }

  private extractUserMessage(requestBody: any): any {
    const message = requestBody.messages.find(
      (m: any) => m.author?.role === 'user' || m.role === 'user'
    );
    
    if (!message) return null;
    
    // Extract content from message
    let content = '';
    if (message.content?.parts) {
      content = message.content.parts.join('\\n');
    } else if (message.content) {
      content = message.content;
    }
    
    return {
      message_id: message.id || `user-${Date.now()}`,
      provider_chat_id: requestBody.conversation_id || '',
      content,
      role: 'user',
      rank: 0,
      model: requestBody.model || 'unknown',
      created_at: Date.now()
    };
  }

  // Save message directly without queueing
  private async saveMessage(message: any): Promise<void> {
    // Skip if already processed
    if (this.processedMessageIds.has(message.message_id)) return;
    
    // Mark as processed to prevent duplicates
    this.processedMessageIds.add(message.message_id);
    
    try {
      await apiService.saveMessage(message);
      console.log(`Saved ${message.role} message: ${message.message_id.substring(0, 8)}...`);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }
  
  // Save chat directly without queueing
  private async saveChat(chatId: string, title: string): Promise<void> {
    try {
      await apiService.saveChat({
        chatId,
        chatTitle: title,
        providerName: 'ChatGPT'
      });
      console.log(`Saved chat: ${chatId.substring(0, 8)}... with title: ${title}`);
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  }

  /**
   * Handle structured assistant response data from the injector
   */
  private handleAssistantResponse(data: {
    messageId: string;
    conversationId: string;
    createTime: number;
    model: string;
    content: string;
    isComplete: boolean;
  }): void {
    try {
      if (!data.messageId || !data.content || !data.isComplete) {
        console.warn('Incomplete assistant response data:', data);
        return;
      }

      console.log('Processing assistant response:', data);

      // Create assistant message object
      const assistantMessage: MessageEvent = {
        message_id: data.messageId,
        provider_chat_id: data.conversationId || '',
        content: data.content,
        role: 'assistant',
        rank: 1,
        model: data.model || 'unknown',
        created_at: data.createTime || Date.now()
      };

      // Save the chat title if available (using first line of content as title)
      if (data.conversationId) {
        // Extract a title from the first line of the content or create a default one
        const title = data.content.split('\n')[0].substring(0, 50) || 
                      `Chat ${new Date().toLocaleString()}`;
                      
        // Save chat directly
        this.saveChat(data.conversationId, title);
      }

      // Save message directly
      this.saveMessage(assistantMessage);
    } catch (error) {
      console.error('Assistant response processing error:', error);
    }
  }

  public cleanup(): void {
    document.removeEventListener('archimind-network-intercept', this.handleNetworkEvent);
    this.processedMessageIds.clear();
  }
}

// Export singleton instance
export const messageService = MessageService.getInstance();

