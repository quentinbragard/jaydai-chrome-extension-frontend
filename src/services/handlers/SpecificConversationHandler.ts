// src/services/handlers/SpecificConversationHandler.ts
import { apiService } from '../ApiService'; // Assuming you have this service

/**
 * Handles processing of complete conversation data from specific conversation endpoints
 */
export class SpecificConversationHandler {
  private static instance: SpecificConversationHandler;
  private processedConversations: Set<string> = new Set();
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): SpecificConversationHandler {
    if (!SpecificConversationHandler.instance) {
      SpecificConversationHandler.instance = new SpecificConversationHandler();
    }
    return SpecificConversationHandler.instance;
  }
  
  /**
   * Process a complete conversation response from the specific conversation endpoint
   */
  public async processSpecificConversation(data: any): Promise<void> {
    console.log('💬 Processing specific conversation:', data);
    try {
      if (!data || !data.responseBody) return;
      
      const conversationData = data.responseBody;
      if (!conversationData || !conversationData.conversation_id) {
        console.warn('⚠️ Invalid conversation data received');
        return;
      }
      
      const conversationId = conversationData.conversation_id;
      
      // Skip if we've already processed this conversation recently
      if (this.processedConversations.has(conversationId)) {
        return;
      }
      
      console.log(`📑 Processing complete conversation: ${conversationId}`);
      
      // Process all messages in the conversation
      if (conversationData.mapping && typeof conversationData.mapping === 'object') {
        const messages = this.extractMessagesFromMapping(conversationData.mapping, conversationId);
        
        if (messages.length > 0) {
          try {
            // Directly call the batch API with messages
            console.log("🔄🔄🔄🔄🔄 Saving messages batch:", messages);
            await apiService.saveMessageBatch(messages);
            console.log(`✅ Successfully sent ${messages.length} messages to batch API for conversation: ${conversationId}`);
          } catch (error) {
            console.error('❌ Error sending messages to batch API:', error);
          }
        }
      }
      
      // Mark as processed to avoid duplicate processing in short timeframe
      this.processedConversations.add(conversationId);
      
      // Clear old processed IDs after some time to allow re-processing if needed
      setTimeout(() => {
        this.processedConversations.delete(conversationId);
      }, 60000); // 1 minute
      
      console.log(`✅ Processed conversation with ID: ${conversationId}`);
    } catch (error) {
      console.error('❌ Error processing specific conversation:', error);
    }
  }
  
  /**
   * Extract all messages from the conversation mapping structure
   * Follows conversation tree structure to preserve proper message order
   */
  private extractMessagesFromMapping(mapping: Record<string, any>, conversationId: string): any[] {
    console.log("===========mapping===========", mapping);
    try {
      // Create array to store processed messages
      const processedMessages: any[] = [];
      let rank = 0;
      
      // Log each message in the mapping
      Object.keys(mapping).forEach((messageId: string) => {
        if (messageId !== "client-created-root") {
          const message = mapping[messageId].message;
          const role = message.author.role;
          if (role === "user" || role === "assistant" && message.content.content_type === "text") {
            rank += 1;
            const createdTime = message.create_time;
            const content = message.content.parts.join("\n");
            const model = message.metadata.model_slug;
  
          processedMessages.push({
            message_id: messageId,
            provider_chat_id: conversationId,
            content: content,
            role: role,
            rank: rank,
            model: model,
            created_at: createdTime,
            });
          }
        }
      });
      
      
      
      
      
      console.log('🎉 Extraction complete. Processed messages:', processedMessages);
      return processedMessages;
    } catch (error) {
      console.error('❌ Error extracting messages from mapping:', error);
      return [];
    }
  }
}

// Export singleton instance
export const specificConversationHandler = SpecificConversationHandler.getInstance();