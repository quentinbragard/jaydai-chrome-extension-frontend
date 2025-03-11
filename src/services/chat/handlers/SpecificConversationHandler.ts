// src/services/chat/handlers/SpecificConversationHandler.ts
import { messageHandler } from './MessageHandler';
import { conversationHandler } from './ConversationHandler';

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
  public processSpecificConversation(data: any): void {
    try {
      if (!data || !data.responseBody) return;
      
      const conversation = data.responseBody;
      if (!conversation || !conversation.id) {
        console.warn('⚠️ Invalid conversation data received');
        return;
      }
      
      const conversationId = conversation.id;
      
      // Skip if we've already processed this conversation
      if (this.processedConversations.has(conversationId)) {
        return;
      }
      
      console.log(`📑 Processing complete conversation: ${conversationId}`);
      
      // Update conversation info
      conversationHandler.processConversation({
        id: conversationId,
        title: conversation.title || `Chat ${conversationId.substring(0, 8)}`,
        create_time: conversation.create_time,
        update_time: conversation.update_time
      });
      
      // Process all messages in the conversation
      if (conversation.mapping && typeof conversation.mapping === 'object') {
        this.processConversationMapping(conversation.mapping, conversationId);
      }
      
      // Mark as processed
      this.processedConversations.add(conversationId);
      
      console.log(`✅ Processed conversation with ${Object.keys(conversation.mapping || {}).length} nodes`);
    } catch (error) {
      console.error('❌ Error processing specific conversation:', error);
    }
  }
  
  /**
   * Process the conversation mapping structure containing all messages
   */
  private processConversationMapping(mapping: Record<string, any>, conversationId: string): void {
    try {
      // First pass: collect all nodes and their relationships
      const nodes = new Map();
      
      // Skip the root nodes that don't contain actual messages
      const rootNodeId = Object.keys(mapping).find(id => 
        id === 'client-created-root' || 
        (mapping[id].parent === null && mapping[id].message === null)
      );
      
      // Build the node graph
      Object.entries(mapping).forEach(([nodeId, node]) => {
        if (node.message && node.message.content && 
            node.message.author && node.message.author.role) {
          nodes.set(nodeId, {
            id: nodeId,
            parentId: node.parent,
            message: node.message,
            children: node.children || []
          });
        }
      });
      
      // Find the first level of real message nodes (children of the root)
      let currentNodes = rootNodeId 
        ? (mapping[rootNodeId]?.children || []).map(id => nodes.get(id)).filter(Boolean)
        : Array.from(nodes.values()).filter(n => !n.parentId || !nodes.has(n.parentId));
      
      // Process nodes in order
      let rank = 0;
      while (currentNodes.length > 0) {
        const nextNodes = [];
        
        for (const node of currentNodes) {
          this.processMessageNode(node, rank, conversationId);
          rank++;
          
          // Add children to the next level
          const childNodes = node.children
            .map(id => nodes.get(id))
            .filter(Boolean);
            
          nextNodes.push(...childNodes);
        }
        
        currentNodes = nextNodes;
      }
    } catch (error) {
      console.error('❌ Error processing conversation mapping:', error);
    }
  }
  
  /**
   * Process a single message node
   */
  private processMessageNode(node: any, rank: number, conversationId: string): void {
    try {
      const message = node.message;
      if (!message || !message.author || !message.content) return;
      
      const role = message.author.role;
      if (!role || (role !== 'user' && role !== 'assistant' && role !== 'system')) return;
      
      // Extract content based on content type
      let content = '';
      if (message.content.content_type === 'text') {
        content = message.content.parts.join('\n');
      } else if (typeof message.content === 'string') {
        content = message.content;
      } else if (message.content.parts && Array.isArray(message.content.parts)) {
        content = message.content.parts.join('\n');
      }
      
      if (!content.trim()) return;
      
      // Extract model information
      let modelName = 'unknown';
      if (message.metadata && message.metadata.model_slug) {
        modelName = message.metadata.model_slug;
      }
      
      // Process the message
      messageHandler.processMessage({
        type: role as 'user' | 'assistant' | 'system',
        messageId: message.id,
        content: content,
        timestamp: new Date(message.create_time || Date.now()).getTime(),
        conversationId: conversationId,
        model: modelName
      });
    } catch (error) {
      console.error('❌ Error processing message node:', error);
    }
  }
}

// Export singleton instance
export const specificConversationHandler = SpecificConversationHandler.getInstance();