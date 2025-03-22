// src/services/chat/ConversationParser.ts
import { AbstractBaseService } from '../BaseService';
import { networkRequestMonitor } from '@/core/network/NetworkRequestMonitor';
import { debug } from '@/core/config';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { Conversation, Message } from '@/types';

/**
 * Service that parses conversation data from network requests
 */
export class ConversationParser extends AbstractBaseService {
  private static instance: ConversationParser;
  private cleanupListeners: (() => void)[] = [];
  
  private constructor() {
    super();
  }
  
  public static getInstance(): ConversationParser {
    if (!ConversationParser.instance) {
      ConversationParser.instance = new ConversationParser();
    }
    return ConversationParser.instance;
  }
  
  protected async onInitialize(): Promise<void> {
    debug('Initializing ConversationParser');
    
    // Ensure NetworkRequestMonitor is initialized
    networkRequestMonitor.initialize();
    
    // Add listeners for conversation-related network events
    this.cleanupListeners.push(
      networkRequestMonitor.addListener('specificConversation', this.handleSpecificConversation)
    );
    
    this.cleanupListeners.push(
      networkRequestMonitor.addListener('conversationList', this.handleConversationList)
    );
  }
  
  protected onCleanup(): void {
    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];
    debug('ConversationParser cleaned up');
  }
  
  /**
   * Handle specific conversation data
   */
  private handleSpecificConversation = (data: any): void => {
    try {
      if (!data?.responseBody?.conversation_id) return;
      
      const conversation = this.extractConversation(data.responseBody);
      const messages = this.extractMessagesFromConversation(data.responseBody);
      
      // Emit event with conversation and messages
      document.dispatchEvent(new CustomEvent('archimind:conversation-loaded', {
        detail: { conversation, messages }
      }));
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling specific conversation', ErrorCode.PARSING_ERROR, error)
      );
    }
  };
  
  /**
   * Handle conversation list data
   */
  private handleConversationList = (data: any): void => {
    try {
      if (!data?.responseBody?.items) return;
      
      const conversations = this.extractConversationsFromList(data.responseBody);
      
      // Emit event with conversations
      document.dispatchEvent(new CustomEvent('archimind:conversation-list', {
        detail: { conversations }
      }));
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling conversation list', ErrorCode.PARSING_ERROR, error)
      );
    }
  };
  
  /**
   * Extract a single conversation from data
   */
  public extractConversation(data: any): Conversation {
    return {
      id: data.conversation_id,
      title: data.title || 'Conversation',
      lastMessageTime: data.update_time ? data.update_time * 1000 : Date.now(),
      model: data.model || 'unknown',
      messageCount: data.message_count || 0
    };
  }
  
  /**
   * Extract conversations from list response
   */
  public extractConversationsFromList(responseBody: any): Conversation[] {
    try {
      if (responseBody.items && Array.isArray(responseBody.items)) {
        return responseBody.items.map((item: any) => ({
          id: item.id,
          title: item.title || 'Untitled',
          lastMessageTime: item.update_time ? item.update_time * 1000 : Date.now(),
          model: item.model || 'unknown'
        }));
      }
      return [];
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting conversations from list', ErrorCode.PARSING_ERROR, error)
      );
      return [];
    }
  }
  
  /**
   * Extract messages from conversation data
   * Simplified implementation - actual implementation would be more detailed
   */
  public extractMessagesFromConversation(conversation: any): Message[] {
    try {
      const messages: Message[] = [];
      
      if (conversation.mapping) {
        Object.entries(conversation.mapping).forEach(([messageId, node]: [string, any]) => {
          if (messageId === 'client-created-root') return;
          
          if (node.message?.author?.role) {
            const role = node.message.author.role;
            
            // Only extract user and assistant messages
            if (role === 'user' || role === 'assistant') {
              // Extract content
              let content = '';
              const contentType = node.message.content?.content_type;
              
              if (contentType === 'text') {
                content = Array.isArray(node.message.content.parts) 
                  ? node.message.content.parts.join('\n') 
                  : node.message.content.parts || '';
              }
              
              messages.push({
                messageId,
                conversationId: conversation.conversation_id,
                content,
                role,
                model: node.message.metadata?.model_slug || 'unknown',
                timestamp: node.message.create_time ? node.message.create_time * 1000 : Date.now(),
                parent_message_id: node.parent
              });
            }
          }
        });
      }
      
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting messages from conversation', ErrorCode.PARSING_ERROR, error)
      );
      return [];
    }
  }
}

export const conversationParser = ConversationParser.getInstance();