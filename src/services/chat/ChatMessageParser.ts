// src/services/chat/ChatMessageParser.ts
import { AbstractBaseService } from '../BaseService';
import { networkRequestMonitor } from '@/core/network/NetworkRequestMonitor';
import { debug } from '@/core/config';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { Message } from '@/types';
import { emitEvent, AppEvent } from '@/core/events/events';

/**
 * Service that parses chat message data from network requests
 */
export class ChatMessageParser extends AbstractBaseService {
  private static instance: ChatMessageParser;
  private cleanupListeners: (() => void)[] = [];
  
  private constructor() {
    super();
  }
  
  public static getInstance(): ChatMessageParser {
    if (!ChatMessageParser.instance) {
      ChatMessageParser.instance = new ChatMessageParser();
    }
    return ChatMessageParser.instance;
  }
  
  protected async onInitialize(): Promise<void> {
    debug('Initializing ChatMessageParser');
    
    // Ensure NetworkRequestMonitor is initialized
    networkRequestMonitor.initialize();
    
    // Add listeners for relevant network events
    this.cleanupListeners.push(
      networkRequestMonitor.addListener('chatCompletion', this.handleChatCompletion)
    );
    
    this.cleanupListeners.push(
      networkRequestMonitor.addListener('assistantResponse', this.handleAssistantResponse)
    );
  }
  
  protected onCleanup(): void {
    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];
    debug('ChatMessageParser cleaned up');
  }
  
  /**
   * Handle chat completion requests
   */
  private handleChatCompletion = (data: any): void => {
    try {
      if (!data?.requestBody?.messages?.length) return;
      
      const message = this.extractUserMessage(data.requestBody);
      if (message) {
        // Emit event with extracted message
        document.dispatchEvent(new CustomEvent('jaydai:message-extracted', {
          detail: { message }
        }));
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling chat completion', ErrorCode.PARSING_ERROR, error)
      );
    }
  };
  
  /**
   * Handle assistant responses
   */
  private handleAssistantResponse = (data: any): void => {
    try {
      if (!data.messageId || !data.content) return;
      
      // Only process complete messages
      if (data.isComplete) {
        const message = this.extractAssistantMessage(data);
        if (message) {
          // Emit event with extracted message
          document.dispatchEvent(new CustomEvent('jaydai:message-extracted', {
            detail: { message }
          }));
        }
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling assistant response', ErrorCode.PARSING_ERROR, error)
      );
    }
  };
  
  /**
   * Extract user message from request body
   */
  public extractUserMessage(requestBody: any): Message | null {
    try {
      const message = requestBody.messages.find(
        (m: any) => m.author?.role === 'user' || m.role === 'user'
      );
      
      if (!message) return null;
      
      // Extract content
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
        timestamp: message.create_time ? message.create_time * 1000 : Date.now(),
        parent_message_provider_id: requestBody.parent_message_provider_id
      };
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting user message', ErrorCode.PARSING_ERROR, error)
      );
      return null;
    }
  }
  
  /**
   * Extract assistant message from response data
   */
  public extractAssistantMessage(data: any): Message | null {
    try {
      return {
        messageId: data.messageId,
        conversationId: data.conversationId || '',
        content: data.content,
        role: 'assistant',
        model: data.model || 'unknown',
        timestamp: data.createTime ? data.createTime * 1000 : Date.now(),
        thinkingTime: data.thinkingTime,
        parent_message_provider_id: data.parentMessageId
      };
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting assistant message', ErrorCode.PARSING_ERROR, error)
      );
      return null;
    }
  }
}