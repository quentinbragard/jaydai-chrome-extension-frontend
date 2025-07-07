// src/services/network/MessageService.ts
import { AbstractBaseService } from '../BaseService';

import { emitEvent, AppEvent } from '@/core/events/events';
import { Message } from '@/types';
import { messageApi } from '@/services/api/MessageApi';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { chatService } from './ChatService';
import { trackEvent, EVENTS } from '@/utils/amplitude';

export class MessageService extends AbstractBaseService {
  private static instance: MessageService;
  private queue: Message[] = [];
  private processing: boolean = false;
  private timer: number | null = null;
  private processed: Set<string> = new Set();
  private batchSize: number = 5;
  private flushInterval: number = 100; // ms

  private constructor() {
    super();
  }

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  protected async onInitialize(): Promise<void> {
    document.addEventListener('jaydai:message-extracted', this.handleExtractedMessage);
  }
    
  protected onCleanup(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    document.removeEventListener('jaydai:message-extracted', this.handleExtractedMessage);
  }

  /**
   * Handle extracted message event
   */
  private handleExtractedMessage = (event: CustomEvent): void => {
    const { message } = event.detail;
    if (!message.parent_message_provider_id) {
      message.parent_message_provider_id = message.parentMessageId;
    }

    if (message) {
      // Try to ensure the message has a conversation ID
      if (!message.conversationId || message.conversationId === '') {
        message.conversationId = chatService.getCurrentConversationId() || '';
      }
      
      // Queue message for processing
      this.queueMessage(message);

      
      
      // Emit appropriate event based on message role
      if (message.role === 'user') {
        emitEvent(AppEvent.CHAT_MESSAGE_SENT, {
          messageId: message.messageId,
          content: message.content,
          conversationId: message.conversationId
        });
      } else if (message.role === 'assistant') {
        emitEvent(AppEvent.CHAT_MESSAGE_RECEIVED, {
          messageId: message.messageId,
          content: message.content,
          role: message.role,
          conversationId: message.conversationId
        });
      }
    }
  };

  /**
   * Queue a message for saving
   */
  public queueMessage(message: Message): void {
    
    // Skip if already processed
    if (this.processed.has(message.messageId)) {
      return;
    }

    // Add to processed set only if we have a conversation ID
    // This is important - only mark as processed if we have a conversation ID
    if (message.conversationId && message.conversationId !== '') {
      this.processed.add(message.messageId);
    }
    
    // Add to queue regardless of conversation ID
    this.queue.push(message);
    
    // Start processing if not already
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process the message queue
   */
  private processQueue(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    
    // Filter messages into two groups:
    // 1. Messages with conversation IDs that can be processed now
    // 2. Messages without conversation IDs that need to be kept in the queue
    const messagesToProcess: Message[] = [];
    const remainingMessages: Message[] = [];
    
    this.queue.forEach(message => {
      // Try to get the conversation ID one more time if it's missing
      if (!message.conversationId || message.conversationId === '') {
        const currentConversationId = chatService.getCurrentConversationId();
        if (currentConversationId) {
          message.conversationId = currentConversationId;
        }
      }
      
      // Only process messages that have a conversation ID
      if (message.conversationId && message.conversationId !== '') {
        trackEvent(EVENTS.MESSAGE_CAPTURED, {
          messageId: message.messageId,
          contentLength: message.content.length,
          role: message.role,
          conversationId: message.conversationId
        });
        
        messagesToProcess.push(message);
        // Mark as processed now that we have a conversation ID
        if (!this.processed.has(message.messageId)) {
          this.processed.add(message.messageId);
        }
      } else {
        // Keep messages without conversation ID in the queue
        remainingMessages.push(message);
      }
    });
    
    // Update the queue to only contain messages without conversation IDs
    this.queue = remainingMessages;
    
    // Process messages that have conversation IDs
    if (messagesToProcess.length > 0) {
      this.saveBatch(messagesToProcess)
        .finally(() => {
          // Schedule next batch
          this.timer = window.setTimeout(() => this.processQueue(), this.flushInterval);
        });
    } else if (remainingMessages.length > 0) {
      // If we have messages waiting for conversation IDs, check again soon
      this.timer = window.setTimeout(() => this.processQueue(), this.flushInterval);
    } else {
      // No messages to process
      this.processing = false;
    }
  }

  /**
   * Save a batch of messages
   */
  private async saveBatch(messages: Message[]): Promise<void> {
    if (messages.length === 0) return;
    
    try {
      // Filter out messages with null or empty content
      const validMessages = messages.filter(msg => msg.content !== null && msg.content !== '');
      
      if (validMessages.length === 0) return;

      // Format messages for API
      const formattedMessages = validMessages.map(msg => ({
        message_provider_id: msg.messageId,
        chat_provider_id: msg.conversationId,
        content: msg.content,
        role: msg.role,
        parent_message_provider_id: msg.parent_message_provider_id,
        model: msg.model || 'unknown',
        created_at: msg.timestamp
      }));
      
      // Save batch
      await messageApi.saveMessageBatch(formattedMessages);
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error saving message batch', ErrorCode.API_ERROR, error)
      );
    }
  }
}

export const messageService = MessageService.getInstance();