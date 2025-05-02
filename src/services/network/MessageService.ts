import { AbstractBaseService } from '../BaseService';
import { debug } from '@/core/config';
import { emitEvent, AppEvent } from '@/core/events/events';
import { Message } from '@/types';
import { messageApi } from '@/services/api/MessageApi';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';

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
    debug('Initializing MessageService');
    document.addEventListener('jaydai:message-extracted', this.handleExtractedMessage);
  }
    
  protected onCleanup(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    document.removeEventListener('jaydai:message-extracted', this.handleExtractedMessage);
    debug('MessageService cleaned up');
  }

  /**
   * Handle extracted message event
   */
  private handleExtractedMessage = (event: CustomEvent): void => {
    const { message } = event.detail;

    if (message) {      
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
    console.log('MEEEEEEESSSSAAAAGE', message);
    if (this.processed.has(message.messageId)) {
      return;
    }
    
    // Add to processed set
    this.processed.add(message.messageId);
    
    // Add to queue
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
    
    // Take a batch of messages
    const batch = this.queue.splice(0, this.batchSize);
    console.log('BATCH', batch);
    // Process the batch
    this.saveBatch(batch)
      .finally(() => {
        // Schedule next batch
        this.timer = window.setTimeout(() => this.processQueue(), this.flushInterval);
      });
  }

  /**
   * Save a batch of messages
   */
  private async saveBatch(messages: Message[]): Promise<void> {
    console.log('SAVING BATCH', messages);
    if (messages.length === 0) return;
    
    try {
      // Format messages for API
      const formattedMessages = messages.map(msg => ({
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
      debug(`Saved batch of ${messages.length} messages`);
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error saving message batch', ErrorCode.API_ERROR, error)
      );
    }
  }
}

export const messageService = MessageService.getInstance();
