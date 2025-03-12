// src/services/handlers/MessageHandler.ts
import { apiService } from '@/services/ApiService';
import { MessageEvent, MessageListener, SaveMessageParams } from '../chat/types';
import { conversationHandler } from './ConversationHandler';

/**
 * Service to handle messages from ChatGPT API
 */
export class MessageHandler {
  private messageListeners: MessageListener[] = [];
  private processedMessages: Set<string> = new Set(); 
  private pendingApiCalls: Map<string, Promise<any>> = new Map();
  private batchSaveTimeout: number | null = null;
  private batchSaveQueue: SaveMessageParams[] = [];
  private readonly BATCH_SAVE_DELAY = 2000; // 2 seconds
  private readonly MAX_BATCH_SIZE = 5;
  
  /**
   * Register a listener for new messages
   * @returns Function to remove the listener
   */
  public onMessage(listener: MessageListener): () => void {
    this.messageListeners.push(listener);
    
    // Return cleanup function
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Process a new message from any source - optimized
   */
  public processMessage(message: MessageEvent): void {
    if (this.processedMessages.has(message.messageId)) {
      return; // Skip already processed messages
    }
    
    // Skip if we don't have a valid conversation ID
    const conversationId = message.conversationId || conversationHandler.getCurrentChatId();
    if (!conversationId) {
      console.warn('⚠️ Skipping message - no conversation ID available');
      return;
    }
    
    this.processedMessages.add(message.messageId);
    
    // Prepare save parameters
    const saveParams: SaveMessageParams = {
      messageId: message.messageId,
      message: message.content,
      role: message.type,
      rank: 0, // Could be improved with proper rank tracking
      providerChatId: conversationId,
      model: message.model || '',
      thinkingTime: message.thinkingTime || 0
    };
    
    // Add to batch queue
    this.addToBatchSaveQueue(saveParams);
    
    // Notify listeners on next tick to avoid blocking
    setTimeout(() => {
      this.notifyListeners(message);
    }, 0);
  }
  
  /**
   * Add message to batch save queue
   */
  private addToBatchSaveQueue(saveParams: SaveMessageParams): void {
    this.batchSaveQueue.push(saveParams);
    
    // If queue has reached max size, process immediately
    if (this.batchSaveQueue.length >= this.MAX_BATCH_SIZE) {
      this.processBatchSaveQueue();
      return;
    }
    
    // Otherwise schedule a delayed save
    if (this.batchSaveTimeout === null) {
      this.batchSaveTimeout = window.setTimeout(() => {
        this.processBatchSaveQueue();
      }, this.BATCH_SAVE_DELAY);
    }
  }
  
  /**
   * Process the batch save queue
   */
  private processBatchSaveQueue(): void {
    // Clear timeout if it exists
    if (this.batchSaveTimeout !== null) {
      clearTimeout(this.batchSaveTimeout);
      this.batchSaveTimeout = null;
    }
    
    // Skip if queue is empty
    if (this.batchSaveQueue.length === 0) {
      return;
    }
    
    // Get messages to process
    const messagesToSave = [...this.batchSaveQueue];
    this.batchSaveQueue = [];
    
    // Process each message
    messagesToSave.forEach(saveParams => {
      this.saveMessageToBackend(saveParams);
    });
  }
  
  /**
   * Save message to backend with rate limiting
   */
  private saveMessageToBackend(saveParams: SaveMessageParams): void {
    // Create a unique key for this message
    const messageKey = saveParams.messageId;
    
    // Check if this message is already being saved
    if (this.pendingApiCalls.has(messageKey)) {
      return;
    }
    
    // Create and track API call
    const apiPromise = apiService.saveMessageToBackend(saveParams)
      .then(response => {
        console.log(`✅ Successfully saved message ${saveParams.messageId} to backend`);
        return response;
      })
      .catch(error => {
        console.error(`❌ Error saving message ${saveParams.messageId} to backend:`, error);
        return null;
      })
      .finally(() => {
        // Remove from pending calls
        this.pendingApiCalls.delete(messageKey);
      });
    
    // Store promise
    this.pendingApiCalls.set(messageKey, apiPromise);
  }
  
  /**
   * Clear the processed messages cache
   */
  public clearProcessedMessages(): void {
    this.processedMessages.clear();
  }
  
  /**
   * Notify all listeners of a new message
   */
  private notifyListeners(message: MessageEvent): void {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('❌ Error in message listener:', error);
      }
    });
  }
}

// Export a singleton instance
export const messageHandler = new MessageHandler();