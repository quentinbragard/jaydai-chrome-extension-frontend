// src/services/chat/ConversationStorage.ts
import { AbstractBaseService } from '../BaseService';
import { debug } from '@/core/config';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { messageApi } from '@/services/api/MessageApi';

/**
 * Handles saving conversations to the backend
 */
export class ConversationStorage extends AbstractBaseService {
  private static instance: ConversationStorage;
  private savingConversations: Set<string> = new Set();
  
  private constructor() {
    super();
  }
  
  public static getInstance(): ConversationStorage {
    if (!ConversationStorage.instance) {
      ConversationStorage.instance = new ConversationStorage();
    }
    return ConversationStorage.instance;
  }
  
  protected async onInitialize(): Promise<void> {
    debug('Initializing ConversationStorage');
    
    // Listen for events that should trigger conversation saving
    document.addEventListener('archimind:conversation-loaded', this.handleConversationLoaded);
  }
  
  protected onCleanup(): void {
    document.removeEventListener('archimind:conversation-loaded', this.handleConversationLoaded);
    debug('ConversationStorage cleaned up');
  }
  
  /**
   * Handle loaded conversation data
   */
  private handleConversationLoaded = (event: CustomEvent): void => {
    const { conversation } = event.detail;
    if (conversation) {
      this.saveConversation(conversation.id, conversation.title);
    }
  };
  
  /**
   * Save a conversation to the backend
   */
  public async saveConversation(conversationId: string, title: string): Promise<boolean> {
    // Skip if already saving this conversation
    if (this.savingConversations.has(conversationId)) {
      return false;
    }
    
    this.savingConversations.add(conversationId);
    
    try {
      await messageApi.saveChat({
        provider_chat_id: conversationId,
        title,
        provider_name: 'ChatGPT'
      });
      
      debug(`Saved conversation ${conversationId.substring(0, 8)}...`);
      return true;
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error saving conversation', ErrorCode.API_ERROR, error)
      );
      return false;
    } finally {
      this.savingConversations.delete(conversationId);
    }
  }
}

export const conversationStorage = ConversationStorage.getInstance();