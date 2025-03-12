import { networkRequestMonitor } from '@/utils/NetworkRequestMonitor';
import { apiService } from '@/services/ApiService';
import { MessageEvent } from './types';

export class MessageService {
  private static _instance: MessageService | null = null;
  private processedMessageIds = new Set<string>();
  private currentConversation: {
    userMessage: MessageEvent | null;
    assistantMessage: {
      content: string;
      messageId: string;
      modelId: string;
      conversationId: string | null;
    } | null;
  } = {
    userMessage: null,
    assistantMessage: null
  };

  // Private constructor to enforce singleton pattern
  private constructor() {
    // Bind methods to ensure correct context
    this.handleNetworkEvent = this.handleNetworkEvent.bind(this);
    this.handleChatCompletion = this.handleChatCompletion.bind(this);
  }

  // Singleton instance getter with null check
  public static getInstance(): MessageService {
    if (!this._instance) {
      this._instance = new MessageService();
    }
    return this._instance;
  }

  public initialize(): void {
    try {
      console.log('💬 Initializing message service...');
      this.setupMessageCapture();
    } catch (error) {
      console.error('❌ Error in message service initialization:', error);
    }
  }

  private setupMessageCapture(): void {
    try {
      // Ensure network request monitor is available
      if (!networkRequestMonitor) {
        throw new Error('Network request monitor is not initialized');
      }

      // Capture chat completion requests
      networkRequestMonitor.addListener('/backend-api/conversation', this.handleChatCompletion);
      
      // Listen for streaming events
      document.addEventListener('archimind-network-intercept', this.handleNetworkEvent);
    } catch (error) {
      console.error('❌ Error setting up message capture:', error);
    }
  }

  private handleNetworkEvent(event: CustomEvent): void {
    try {
      // Validate event
      if (!event.detail || typeof event.detail !== 'object') {
        console.warn('Invalid network event received');
        return;
      }

      const { type, data } = event.detail;

      switch(type) {
        case 'chatCompletion':
          console.log("#################CHAT COMPLETION#################");
          this.handleChatCompletion(data);
          break;
        case 'streamedChatCompletion':
          console.log("#################STREAMING CHAT COMPLETION#################");
          this.processStreamingResponse(data);
          break;
        default:
          console.log(`Unhandled network event type: ${type}`);
      }
    } catch (error) {
      console.error('❌ Error in network event handler:', error);
    }
  }

  private handleChatCompletion(data: any): void {
    console.log("DATA", data);
    try {
      // Validate input
      if (!data || !data.requestBody) {
        console.warn('Invalid chat completion data');
        return;
      }

      const { requestBody } = data;

      // Capture and save user message
      const userMessage = this.extractUserMessage(requestBody);
      if (userMessage) {
        this.currentConversation.userMessage = userMessage;
        this.saveMessage(userMessage).catch(error => {
          console.error('Failed to save user message:', error);
        });
      }
    } catch (error) {
      console.error('❌ Error processing user message:', error);
    }
  }

  private processStreamingResponse(data: any): void {
    try {
      // Validate input
      if (!data || !data.buffer) {
        console.warn('Invalid streaming response data');
        return;
      }
  
      const { buffer, requestBody } = data;
      
      // Ensure stream is complete
      if (!buffer.includes('[DONE]')) return;
  
      const deltas = this.parseStreamDeltas(buffer);
      const thinkingSteps: string[] = [];
      let finalAssistantAnswer = '';
      let currentAssistantMessage: any = null;
  
      for (let i = 0; i < deltas.length; i++) {
        const delta = deltas[i];
  
        // Capture thinking steps
        if (delta.o === 'add' && delta.v?.message) {
          const message = delta.v.message;
          
          // Check if it's a thinking/tool step (not an assistant message)
          if (message.author.role !== 'assistant') {
            let thinkingStep = message.content.parts.join('\n');
            
            // Collect additional content for the thinking step
            while (
              i + 1 < deltas.length && 
              deltas[i + 1].o !== 'add' && 
              typeof deltas[i + 1].v === 'string'
            ) {
              i++;
              thinkingStep += deltas[i].v;
            }
            
            // Only add non-empty thinking steps
            if (thinkingStep.trim()) {
              thinkingSteps.push(thinkingStep.trim());
            }
          }
          
          // Track the assistant message
          if (message.author.role === 'assistant') {
            currentAssistantMessage = message;
          }
        }
  
        // Capture assistant message content
        if (
          (delta.p?.includes('/message/content/parts/') && delta.o === 'append') || 
          (typeof delta.v === 'string' && currentAssistantMessage)
        ) {
          finalAssistantAnswer += delta.v || '';
        }
  
        // Check for final answer completion
        if (delta.o === 'patch' && Array.isArray(delta.v)) {
          const isComplete = delta.v.some(
            patch => patch.p === '/message/metadata' && patch.v?.is_complete
          );
  
          if (isComplete) {
            break;
          }
        }
      }
  
      // Log the results
      console.log("#################THINKING STEPS#################", thinkingSteps);
      console.log("#################FINAL ASSISTANT ANSWER#################", finalAssistantAnswer.trim());
  
      // If you want to save the message
      if (currentAssistantMessage) {
        this.saveAssistantMessage({
          messageId: currentAssistantMessage.id,
          provider_chat_id: requestBody?.conversation_id || null,
          content: finalAssistantAnswer.trim(),
          modelId: currentAssistantMessage.metadata?.model_slug || 'unknown',
          conversationId: requestBody?.conversation_id || null
        });
      }
    } catch (error) {
      console.error('Error processing streaming response:', error);
    }
  }
  private parseStreamDeltas(buffer: string): any[] {
    const deltas: any[] = [];
    const eventRegex = /data: (.+)(?:\n\n|$)/g;
    let match;

    while ((match = eventRegex.exec(buffer)) !== null) {
      const deltaStr = match[1].trim();
      
      if (deltaStr === '[DONE]') break;

      try {
        const delta = JSON.parse(deltaStr);
        deltas.push(delta);
      } catch (error) {
        console.error('Error parsing delta:', error);
      }
    }

    return deltas;
  }

  private processStreamDeltas(deltas: any[], requestBody: any): void {
    let assistantMessage = {
      content: '',
      messageId: '',
      modelId: requestBody?.model || 'unknown',
      conversationId: requestBody?.conversation_id || null
    };

    deltas.forEach(delta => {
      // Message creation
      console.log("#################DELTA#################", delta);
      if (delta.o === 'add' && delta.v?.message) {
        const message = delta.v.message;
        assistantMessage.messageId = message.id;
        assistantMessage.modelId = message.metadata?.model_slug || assistantMessage.modelId;
        assistantMessage.conversationId = delta.v.conversation_id || assistantMessage.conversationId;
      }

      // Content appending
      if (delta.o === 'append') {
        if (delta.p?.includes('/message/content/parts/') && typeof delta.v === 'string') {
          assistantMessage.content += delta.v;
        }
      }

      // Check for final answer completion
      if (delta.o === 'patch' && Array.isArray(delta.v)) {
        const isComplete = delta.v.some(
          patch => patch.p === '/message/metadata' && patch.v?.is_complete
        );

        if (isComplete && assistantMessage.messageId && assistantMessage.content) {
          this.saveAssistantMessage(assistantMessage).catch(error => {
            console.error('Failed to save assistant message:', error);
          });
        }
      }
    });
  }

  private async saveAssistantMessage(assistantData: {
    messageId: string;
    content: string;
    modelId: string;
    conversationId: string | null;
  }): Promise<void> {
    const { userMessage } = this.currentConversation;
    
    if (userMessage) {
      try {
        const messageToSave: MessageEvent = {
          message_id: assistantData.messageId,
          provider_chat_id: assistantData.conversationId || userMessage.conversationId,
          content: assistantData.content,
          role: 'assistant',
          rank: 0,
          model: assistantData.modelId,
          created_at: Date.now()
        };

        await this.saveMessage(messageToSave);

        // Reset for next conversation
        this.currentConversation = {
          userMessage: null,
          assistantMessage: null
        };
      } catch (error) {
        console.error('❌ Error saving assistant message:', error);
      }
    }
  }

  private async saveMessage(message: MessageEvent): Promise<void> {
    try {
      // Prevent duplicate saves
      if (this.processedMessageIds.has(message.message_id)) return;

      // Ensure apiService is available
      if (!apiService || typeof apiService.saveMessage !== 'function') {
        throw new Error('API service is not properly initialized');
      }
      console.log("#################SAVE MESSAGE#################", message);
      await apiService.saveMessage(message);
      this.processedMessageIds.add(message.message_id);
    } catch (error) {
      console.error('❌ Error saving message:', error);
    }
  }

  private extractUserMessage(requestBody: any): MessageEvent | null {
    if (!requestBody?.messages?.length) return null;

    const message = requestBody.messages.find(
      (m: any) => m.author?.role === 'user' || m.role === 'user'
    );

    if (!message) return null;

    return {
      message_id: message.id || `user-${Date.now()}`,
      provider_chat_id: requestBody.conversation_id,
      content: this.extractMessageContent(message),
      role: 'user',
      rank: 0,
      model: requestBody.model,
      created_at: Date.now()
    };
  }

  private extractMessageContent(message: any): string {
    if (message.content?.parts) {
      return message.content.parts.join('\n');
    }
    return message.content || '';
  }

  public cleanup(): void {
    try {
      // Remove event listener
      document.removeEventListener('archimind-network-intercept', this.handleNetworkEvent);

      // Clear processed messages
      this.processedMessageIds.clear();
      
      // Reset current conversation
      this.currentConversation = {
        userMessage: null,
        assistantMessage: null
      };
    } catch (error) {
      console.error('❌ Error during message service cleanup:', error);
    }
  }
}

// Export singleton instance
export const messageService = MessageService.getInstance();