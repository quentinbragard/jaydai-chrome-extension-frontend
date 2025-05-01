// src/services/orchestration/ChatOrchestrator.ts
import { AbstractBaseService } from '../BaseService';
import { debug } from '@/core/config';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { Message } from '@/types';

// Import dependencies directly
import { conversationManager as defaultConversationManager } from '../chat/ConversationManager';
import { messageManager as defaultMessageManager } from '../messages/MessageManager';
import { messageQueue as defaultMessageQueue } from '../messages/MessageQueue';
import { pendingMessageTracker as defaultPendingMessageTracker } from '../messages/PendingMessageTracker';

// Service interfaces (keep for clarity and potential external use)
interface IConversationManager {
  getCurrentConversationId(): string | null;
  setCurrentConversationId(conversationId: string): void;
}

interface IMessageManager {
  addMessage(message: Message): void;
  getConversationMessages(conversationId: string): Message[];
}

interface IMessageQueue {
  queueMessage(message: Message): void;
}

interface IPendingMessageTracker {
  processPendingMessages(conversationId: string): void;
  addPendingMessage(message: Message): void;
}

/**
 * Orchestrates actions between chat-related services
 */
export class ChatOrchestrator extends AbstractBaseService {
  private static instance: ChatOrchestrator | null = null;

  private conversationManager: IConversationManager;
  private messageManager: IMessageManager;
  private messageQueue: IMessageQueue;
  private pendingTracker: IPendingMessageTracker;

  /**
   * Private constructor with explicit dependencies
   */
  private constructor(
    conversationManager: IConversationManager,
    messageManager: IMessageManager,
    messageQueue: IMessageQueue,
    pendingTracker: IPendingMessageTracker
  ) {
    super();
    this.conversationManager = conversationManager;
    this.messageManager = messageManager;
    this.messageQueue = messageQueue;
    this.pendingTracker = pendingTracker;
  }

  /**
   * Get the singleton instance.
   * Dependencies are now resolved using direct imports.
   */
  public static getInstance(): ChatOrchestrator {
    if (!ChatOrchestrator.instance) {
      ChatOrchestrator.instance = new ChatOrchestrator(
        defaultConversationManager,
        defaultMessageManager,
        defaultMessageQueue,
        defaultPendingMessageTracker
      );
    }
    return ChatOrchestrator.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    ChatOrchestrator.instance = null;
  }

  protected async onInitialize(): Promise<void> {
    debug('Initializing ChatOrchestrator');

    // Listen for custom DOM events dispatched by the injected script
    document.addEventListener('jaydai:message-extracted', this.handleMessageExtracted as EventListener);
    document.addEventListener('jaydai:conversation-changed', this.handleConversationChanged as EventListener);
  }

  protected onCleanup(): void {
    document.removeEventListener('jaydai:message-extracted', this.handleMessageExtracted as EventListener);
    document.removeEventListener('jaydai:conversation-changed', this.handleConversationChanged as EventListener);
    debug('ChatOrchestrator cleaned up');
  }

  /**
   * Handle extracted message events
   */
  private handleMessageExtracted = (event: CustomEvent): void => {
    try {
      const { message } = event.detail;
      if (!message) return;

      this.processMessage(message);
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling message extraction', ErrorCode.ORCHESTRATION_ERROR, error)
      );
    }
  };

  /**
   * Handle conversation change events
   */
  private handleConversationChanged = (event: CustomEvent): void => {
    try {
      const { conversationId } = event.detail;
      if (!conversationId) return;

      // When conversation changes, process any pending messages for the new conversation
      this.pendingTracker.processPendingMessages(conversationId);
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling conversation change', ErrorCode.ORCHESTRATION_ERROR, error)
      );
    }
  };

  /**
   * Process a message: Assign to conversation, store, and queue for saving.
   */
  public processMessage(message: Message): void {
    // If a message arrives before the conversation ID is known, hold it
    if (!message.conversationId) {
      debug('Message received without conversation ID, adding to pending tracker:', message.id);
      this.pendingTracker.addPendingMessage(message);
      return;
    }

    // Update current conversation ID if this message belongs to a different one
    const currentConversationId = this.conversationManager.getCurrentConversationId();
    if (currentConversationId !== message.conversationId) {
      debug(`Conversation changed to ${message.conversationId}`);
      this.conversationManager.setCurrentConversationId(message.conversationId);
      // Process pending messages for this *new* conversation ID immediately
      this.pendingTracker.processPendingMessages(message.conversationId);
    }

    // Add message to the in-memory manager
    this.messageManager.addMessage(message);

    // Queue the message to be saved to the backend
    this.messageQueue.queueMessage(message);
  }
}

// Export the singleton instance directly
export const chatOrchestrator = ChatOrchestrator.getInstance();

// Remove the createChatOrchestrator function as it's no longer necessary
// with the simplified getInstance method.