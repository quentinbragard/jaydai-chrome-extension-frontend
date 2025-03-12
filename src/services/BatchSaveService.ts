import { apiService } from '@/services/ApiService';
import { MessageEvent } from './chat/types';

interface ChatToSave {
  chatId: string;
  chatTitle: string;
  providerName: string;
}

interface MessageToSave {
  messageId: string;
  message: string;
  role: string;
  rank: number;
  providerChatId: string;
  model: string;
  thinkingTime: number;
}

/**
 * Service to batch save messages and chats
 */
export class BatchSaveService {
  private static instance: BatchSaveService;
  private pendingMessages: Map<string, MessageToSave> = new Map();
  private pendingChats: Map<string, ChatToSave> = new Map();
  private saveTimeout: number | null = null;
  private processingBatchSave: boolean = false;
  private initialized: boolean = false;
  private readonly SAVE_DELAY = 5000; // 5 seconds
  private readonly MAX_BATCH_SIZE = 50; // Max messages per batch
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): BatchSaveService {
    if (!BatchSaveService.instance) {
      BatchSaveService.instance = new BatchSaveService();
    }
    return BatchSaveService.instance;
  }

  /**
   * Initialize the service
   */
  public initialize(): void {
    if (this.initialized) return;
    console.log('🔄 Initializing BatchSaveService');
    this.initialized = true;
  }
  
  /**
   * Add a message to pending batch
   */
  public queueMessage(message: MessageEvent): void {
    // Skip if already queued
    if (this.pendingMessages.has(message.messageId)) {
      return;
    }
    
    // Add to pending messages
    this.pendingMessages.set(message.messageId, {
      messageId: message.messageId,
      message: message.content,
      role: message.type,
      rank: 0, // Could be improved with proper rank tracking
      providerChatId: message.conversationId || '',
      model: message.model || '',
      thinkingTime: message.thinkingTime || 0
    });
    
    // Schedule save if not already scheduled
    this.scheduleSave();
  }
  
  /**
   * Add a chat to pending batch
   */
  public queueChat(chatId: string, chatTitle: string, providerName: string = 'ChatGPT'): void {
    // Skip if already queued with same title
    const existingChat = this.pendingChats.get(chatId);
    if (existingChat && existingChat.chatTitle === chatTitle) {
      return;
    }
    
    // Add to pending chats
    this.pendingChats.set(chatId, {
      chatId,
      chatTitle,
      providerName
    });
    
    // Schedule save if not already scheduled
    this.scheduleSave();
  }
  
  /**
   * Schedule a batch save
   */
  private scheduleSave(): void {
    // Skip if already processing a batch
    if (this.processingBatchSave) {
      return;
    }
    
    // Schedule save if it's not already scheduled
    if (this.saveTimeout === null) {
      this.saveTimeout = window.setTimeout(() => {
        this.processBatchSave();
      }, this.SAVE_DELAY);
    }
    
    // If we have a large batch, save immediately
    if (this.pendingMessages.size >= this.MAX_BATCH_SIZE) {
      if (this.saveTimeout !== null) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      this.processBatchSave();
    }
  }
  
  /**
   * Process batch save
   */
  private async processBatchSave(): Promise<void> {
    // Skip if already processing or nothing to save
    if (this.processingBatchSave || 
        (this.pendingMessages.size === 0 && this.pendingChats.size === 0)) {
      this.saveTimeout = null;
      return;
    }
    
    this.processingBatchSave = true;
    
    try {
      // Prepare batch data
      const chats = Array.from(this.pendingChats.values()).map(chat => ({
        provider_chat_id: chat.chatId,
        title: chat.chatTitle,
        provider_name: chat.providerName
      }));
      
      const messages = Array.from(this.pendingMessages.values());
      
      console.log(`🔄 Processing batch save: ${chats.length} chats, ${messages.length} messages`);
      
      // Send batch save request
      const response = await apiService.saveBatch({
        chats,
        messages
      });
      
      if (response && response.success) {
        console.log(`✅ Batch save successful: ${chats.length} chats, ${messages.length} messages`);
        
        // Clear processed items
        this.pendingChats.clear();
        this.pendingMessages.clear();
      } else {
        console.error('❌ Batch save failed:', response);
      }
    } catch (error) {
      console.error('❌ Error in batch save:', error);
    } finally {
      this.processingBatchSave = false;
      this.saveTimeout = null;
      
      // If more items were added during processing, schedule another save
      if (this.pendingMessages.size > 0 || this.pendingChats.size > 0) {
        this.scheduleSave();
      }
    }
  }
  
  /**
   * Force immediate batch save
   */
  public async forceSave(): Promise<boolean> {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    if (this.pendingMessages.size === 0 && this.pendingChats.size === 0) {
      return true; // Nothing to save
    }
    
    await this.processBatchSave();
    return true;
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    // Force save any pending items before cleanup
    this.forceSave();
    this.initialized = false;
  }
}

// Export a singleton instance
export const batchSaveService = BatchSaveService.getInstance();