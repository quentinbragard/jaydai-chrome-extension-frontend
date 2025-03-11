// src/services/chat/handlers/MessageHandler.ts
// Handles message processing for user and assistant messages
import { apiService } from '@/services/ApiService';
import { MessageEvent, MessageListener, SaveMessageParams } from '../chat/types';
import { conversationHandler } from './ConversationHandler';

/**
 * Service to handle messages from ChatGPT API
 */
export class MessageHandler {
  private messageListeners: MessageListener[] = [];
  private processedMessages: Set<string> = new Set(); // Track processed message IDs
  
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
   * Process a new message from any source
   */
  public processMessage(message: MessageEvent): void {
    // Skip if we don't have a valid conversation ID
    const conversationId = message.conversationId || conversationHandler.getCurrentChatId();
    
    // Skip if we don't have a valid conversation ID
    if (!conversationId) {
      console.warn('⚠️ Skipping message - no conversation ID available');
      return;
    }
    
    // Skip if already processed this message
    if (this.processedMessages.has(message.messageId)) {
      console.warn(`⚠️ Skipping message ${message.messageId} - already processed`);
      return;
    }
    
    this.processedMessages.add(message.messageId);
    
    console.log(`🔍 PROCESSING MESSAGE TO SAVE:`, {
      type: message.type,
      messageId: message.messageId, 
      conversationId,
      contentLength: message.content.length,
      contentPreview: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
      timestamp: new Date(message.timestamp).toISOString()
    });
    
    try {
      // Save to backend
      console.log(`📤 Saving message ${message.messageId} to Supabase...`);
      
      // This is where we send to Supabase
      const saveParams = {
        messageId: message.messageId,
        message: message.content,
        role: message.type,
        rank: 0, // We don't have rank info here, could be improved
        providerChatId: conversationId,
        model: message.model || '',
        thinkingTime: message.thinkingTime || 0
      };
      
      console.log(`📦 Save params:`, saveParams);
      
      apiService.saveMessageToBackend(saveParams)
        .then(response => {
          console.log(`✅ Successfully saved message ${message.messageId} to Supabase:`, response);
        })
        .catch(error => {
          console.error(`❌ Error saving message ${message.messageId} to Supabase:`, error);
        });
      
      // Notify all listeners
      this.notifyListeners(message);
      
      console.log(`✅ Processed ${message.type} message: ${message.messageId}`);
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  }
  
  /**
   * Clear the processed messages cache
   */
  public clearProcessedMessages(): void {
    this.processedMessages.clear();
  }
  
  /**
   * Save message to backend
   */
  private saveMessageToBackend(params: SaveMessageParams): void {
    apiService.saveMessageToBackend(params).catch(error => {
      console.error('❌ Error saving message to backend:', error);
    });
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