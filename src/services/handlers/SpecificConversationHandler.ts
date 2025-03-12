// src/services/handlers/SpecificConversationHandler.ts
import { apiClient } from '../../api/apiClient';

/**
 * Handles processing of complete conversation data
 */
export class SpecificConversationHandler {
  private static instance: SpecificConversationHandler;
  private processedConversations: Set<string> = new Set();
  
  private constructor() {}
  
  public static getInstance(): SpecificConversationHandler {
    if (!SpecificConversationHandler.instance) {
      SpecificConversationHandler.instance = new SpecificConversationHandler();
    }
    return SpecificConversationHandler.instance;
  }
  
  /**
   * Process a complete conversation response
   */
  public async processSpecificConversation(data: any): Promise<void> {
    if (!data || !data.responseBody) return;
    
    try {
      const conversationData = data.responseBody;
      if (!conversationData?.conversation_id) return;
      
      const conversationId = conversationData.conversation_id;
      
      // Skip if already processed recently
      if (this.processedConversations.has(conversationId)) return;
      
      console.log(`Processing conversation: ${conversationId}`);
      
      // Extract and process messages
      if (conversationData.mapping && typeof conversationData.mapping === 'object') {
        const messages = this.extractMessages(conversationData.mapping, conversationId);
        
        if (messages.length > 0) {
          try {
            await apiClient.saveMessageBatch(messages);
            console.log(`Saved ${messages.length} messages for conversation: ${conversationId}`);
          } catch (error) {
            console.error('Error saving messages batch:', error);
          }
        }
      }
      
      // Mark as processed and clear after 1 minute
      this.processedConversations.add(conversationId);
      setTimeout(() => {
        this.processedConversations.delete(conversationId);
      }, 60000);
      
    } catch (error) {
      console.error('Error processing conversation:', error);
    }
  }
  
  /**
   * Extract messages from conversation mapping
   */
  private extractMessages(mapping: Record<string, any>, conversationId: string): any[] {
    const messages = [];
    let rank = 0;
    
    // Process each message in the mapping
    for (const messageId in mapping) {
      if (messageId === 'client-created-root') continue;
      
      const messageNode = mapping[messageId];
      if (!messageNode?.message?.author?.role) continue;
      
      const message = messageNode.message;
      const role = message.author.role;
      
      // Only process user and assistant text messages
      if ((role === 'user' || role === 'assistant') && 
          (!message.content.content_type || message.content.content_type === 'text')) {
        
        rank++;
        const content = Array.isArray(message.content.parts) 
          ? message.content.parts.join('\n') 
          : message.content.parts || '';
          
        messages.push({
          message_id: messageId,
          provider_chat_id: conversationId,
          content: content,
          role: role,
          rank: rank,
          model: message.metadata?.model_slug || 'unknown',
          created_at: message.create_time || Date.now()
        });
      }
    }
    
    return messages;
  }
}

export const specificConversationHandler = SpecificConversationHandler.getInstance();