// Updated ChatService with fixes for the errors

import { messageApi } from "@/api/MessageApi";
import { debug } from "@/core/config";
import { AppError } from "@/core/errors/AppError";
import { errorReporter } from "@/core/errors/ErrorReporter";
import { emitEvent } from "@/core/events/events";
import { AppEvent } from "@/core/events/events";
import { networkRequestMonitor } from "@/core/network/NetworkRequestMonitor";
import { Conversation, Message } from "@/types/chat";

/**
 * Service for chat functionality
 */
export class ChatService {
  private static instance: ChatService;
  private currentConversationId: string | null = null;
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private pendingMessages: PendingMessage[] = [];
  
  private constructor() {}
  
  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }
  
  /**
   * Initialize the chat service
   */
  public async initialize(): Promise<void> {
    try {
      // Initialize network monitoring
      networkRequestMonitor.initialize();
      
      // Listen for network events
      networkRequestMonitor.addListener('chatCompletion', this.handleChatCompletion);
      networkRequestMonitor.addListener('assistantResponse', this.handleAssistantResponse);
      networkRequestMonitor.addListener('specificConversation', this.handleSpecificConversation);
      
      // Listen for URL changes that might indicate a new conversation
      window.addEventListener('popstate', this.checkUrlForConversationId);
      this.checkUrlForConversationId(); // Check current URL
      
      debug('Chat service initialized');
    } catch (error) {
      const appError = AppError.from(error, 'Failed to initialize chat service');
      errorReporter.captureError(appError);
      throw appError;
    }
  }
  
  /**
   * Check the current URL for a conversation ID
   */
  private checkUrlForConversationId = (): void => {
    try {
      const match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
      if (match && match[1]) {
        const conversationId = match[1];
        
        // Only proceed if this is a different conversation ID
        if (conversationId !== this.currentConversationId) {
          debug(`Detected conversation ID from URL: ${conversationId}`);
          this.setCurrentConversationId(conversationId);
          
          // Process any pending messages now that we have a conversation ID
          this.processPendingMessages(conversationId);
          
          // Emit event
          emitEvent(AppEvent.CHAT_CONVERSATION_CHANGED, {
            conversationId
          });
        }
      }
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error checking URL for conversation ID'));
    }
  };
  
  /**
   * Process messages waiting for a conversation ID
   */
  private processPendingMessages(conversationId: string): void {
    if (this.pendingMessages.length === 0) return;
    
    debug(`Processing ${this.pendingMessages.length} pending messages for conversation: ${conversationId}`);
    
    // Process each pending message
    this.pendingMessages.forEach(item => {
      const message = item.message;
      
      // Update the conversation ID
      message.conversationId = conversationId;
      
      // Add to messages for this conversation
      this.addMessage(message);
      
      // Save to backend
      this.saveMessage(message);
    });
    
    // Clear pending messages
    this.pendingMessages = [];
  }
  
  /**
   * Clean up old pending messages
   */
  private cleanupOldPendingMessages(): void {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    this.pendingMessages = this.pendingMessages.filter(item => {
      return now - item.timestamp < fiveMinutes;
    });
  }
  
  /**
   * Handle chat completion requests
   */
  private handleChatCompletion = (data: any): void => {
    try {
      if (!data?.requestBody?.messages?.length) return;
      
      const userMessage = this.extractUserMessage(data.requestBody);
      if (userMessage) {
        // Check if this is a message for an existing conversation
        if (userMessage.conversationId) {
          // Add to local cache
          this.addMessage(userMessage);
          
          // Emit event
          emitEvent(AppEvent.CHAT_MESSAGE_SENT, {
            messageId: userMessage.messageId,
            content: userMessage.content,
            conversationId: userMessage.conversationId
          });
          
          // Save to backend
          this.saveMessage(userMessage);
          
          // Update current conversation
          this.currentConversationId = userMessage.conversationId;
        } else {
          // This is a message for a new conversation
          // Store as pending until we get a conversation ID
          this.pendingMessages.push({
            message: userMessage,
            timestamp: Date.now()
          });
          
          debug('Stored pending user message for new conversation');
          
          // Clean up old pending messages (older than 5 minutes)
          this.cleanupOldPendingMessages();
        }
      }
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error handling chat completion'));
    }
  };
  
  /**
   * Handle assistant responses
   */
  private handleAssistantResponse = (data: any): void => {
    try {
      if (!data.messageId || !data.content) return;
      
      const message: Message = {
        messageId: data.messageId,
        conversationId: data.conversationId || '',
        content: data.content,
        role: 'assistant',
        model: data.model || 'unknown',
        timestamp: data.createTime ? data.createTime * 1000 : Date.now(), // Convert to milliseconds if needed
        thinkingTime: data.thinkingTime,
        parent_message_id: data.parentMessageId || undefined // Use parent message ID from data
      };
      
      // If we have a conversation ID, process normally
      if (message.conversationId) {
        // Add to local cache
        this.addMessage(message);
        
        // Update current conversation ID
        this.currentConversationId = message.conversationId;
        
        // Save chat title if this is a new conversation
        if (!this.conversations.has(message.conversationId)) {
          // Extract title from first line of content
          const title = message.content.split('\n')[0].trim().substring(0, 50) || 'New conversation';
          
          this.conversations.set(message.conversationId, {
            id: message.conversationId,
            title,
            lastMessageTime: message.timestamp
          });
          
          // Save conversation to backend
          this.saveConversation(message.conversationId, title);
          
          // Process any pending messages for this conversation
          this.processPendingMessages(message.conversationId);
        }
        
        // Emit event
        emitEvent(AppEvent.CHAT_MESSAGE_RECEIVED, {
          messageId: message.messageId,
          content: message.content,
          role: message.role,
          conversationId: message.conversationId
        });
        
        // Save to backend
        this.saveMessage(message);
      } else {
        // Add to pending messages if no conversation ID
        this.pendingMessages.push({
          message,
          timestamp: Date.now()
        });
        
        debug('Stored pending assistant response for new conversation');
      }
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error handling assistant response'));
    }
  };
  
  /**
   * Handle specific conversation data
   */
  private handleSpecificConversation = (data: any): void => {
    try {
      if (!data?.responseBody?.conversation_id) return;
      
      const conversationId = data.responseBody.conversation_id;
      const title = data.responseBody.title || 'Conversation';
      
      // Extract messages from the conversation data
      const extractedMessages = this.extractMessagesFromConversation(data.responseBody);
      
      // Update local cache
      this.conversations.set(conversationId, {
        id: conversationId,
        title,
        messageCount: extractedMessages.length,
        lastMessageTime: Date.now()
      });
      
      // Update messages cache
      this.messages.set(conversationId, extractedMessages);
      
      // Set as current conversation
      this.currentConversationId = conversationId;
      
      // Process any pending messages for this conversation
      this.processPendingMessages(conversationId);
      
      // Emit event
      emitEvent(AppEvent.CHAT_CONVERSATION_LOADED, {
        conversationId,
        title,
        messages: extractedMessages
      });
      
      // Save conversation and messages to backend
      this.saveConversationBatch(conversationId, title, extractedMessages);
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error handling specific conversation'));
    }
  };
  
  /**
   * Extract user message from request body
   */
  private extractUserMessage(requestBody: any): Message | null {
    const message = requestBody.messages.find(
      (m: any) => m.author?.role === 'user' || m.role === 'user'
    );
    
    if (!message) return null;
    
    // Extract content from message
    let content = '';
    if (message.content?.parts) {
      content = message.content.parts.join('\n');
    } else if (message.content) {
      content = message.content;
    }
    
    return {
      messageId: message.id || `user-${Date.now()}`,
      conversationId: requestBody.conversation_id || '',
      content,
      role: 'user',
      model: requestBody.model || 'unknown',
      timestamp: message.create_time ? message.create_time * 1000 : Date.now(), // Use create_time if available
      parent_message_id: requestBody.parent_message_id || undefined // Use parent message ID from request
    };
  }
  
  /**
   * Extract messages from conversation data
   */
  /**
 * Extract messages from conversation data with improved model detection
 */
private extractMessagesFromConversation(conversation: any): Message[] {
  const messages: Message[] = [];
  const modelCache: Record<string, string> = {};
  
  if (!conversation.mapping) return messages;
  
  // First pass: Extract messages and build the message structure
  Object.keys(conversation.mapping).forEach(messageId => {
    if (messageId === 'client-created-root') return;
    
    const messageNode = conversation.mapping[messageId];
    if (!messageNode?.message?.author?.role) return;
    
    const message = messageNode.message;
    const role = message.author.role;
    
    // Only process user, assistant and tool text messages
    if ((role === 'user' || role === 'assistant' || role === 'tool')) {
      
      const contentType = message.content.content_type;
      let content = '';
      if (contentType === 'text') {
        content = Array.isArray(message.content.parts) 
          ? message.content.parts.join('\n') 
          : message.content.parts || '';
      } else if (contentType === "multimodal_text") {
        message.content.parts.forEach((part: any) => {
          if (typeof part === 'string') {
            content += part;
          }
          else if (part.text && typeof part.text === 'string') {
            content += part.text;
          }
        });
      }
      
      // Get parent message ID if available, otherwise try to use children info
      let parentMessageId = ''
      if (!messageNode.children && messageNode.children.length > 0) {
        // Attempt to use the first child as a potential parent
        parentMessageId = messageNode.children[0];
      }
      if (!parentMessageId) {
        parentMessageId = messageNode.parent?.id || message.metadata?.parent_id;
      }
      
      // Extract model if available
      const model = message.metadata?.model_slug;
      if (model) {
        // If this message has a model, cache it by message ID
        modelCache[messageId] = model;
      }
      
      messages.push({
        messageId,
        conversationId: conversation.conversation_id,
        content,
        role,
        model: model || 'unknown', // Set default model, will try to update in second pass
        timestamp: message.create_time ? message.create_time * 1000 : Date.now(),
        parent_message_id: parentMessageId
      });
    }
  });
  
  // Second pass: For messages without a model, try to find from child messages
  // This is especially useful for user messages where model info is in the assistant's response
  messages.forEach(msg => {
    if (msg.model === 'unknown') {
      // Try to find model info from children
      const messageNode = conversation.mapping[msg.messageId];
      if (messageNode?.children && messageNode.children.length > 0) {
        // Look for the first child with a cached model
        for (const childId of messageNode.children) {
          if (modelCache[childId]) {
            msg.model = modelCache[childId];
            break;
          }
        }
      }
    }
  });
  
  // Sort messages by timestamp
  messages.sort((a, b) => a.timestamp - b.timestamp);
  
  return messages;
}
  
  /**
   * Add a message to local cache
   */
  private addMessage(message: Message): void {
    const { conversationId } = message;
    
    if (!conversationId) return;
    
    // Get or create conversation messages array
    if (!this.messages.has(conversationId)) {
      this.messages.set(conversationId, []);
    }
    
    const conversationMessages = this.messages.get(conversationId)!;
    
    // Check if message already exists
    const existingIndex = conversationMessages.findIndex(m => m.messageId === message.messageId);
    
    if (existingIndex >= 0) {
      // Update existing message
      conversationMessages[existingIndex] = message;
    } else {
      // Add new message
      conversationMessages.push(message);
      
      // Sort by timestamp
      conversationMessages.sort((a, b) => a.timestamp - b.timestamp);
    }
  }
  
  /**
   * Save message to backend
   */
  private async saveMessage(message: Message): Promise<void> {
    try {
      await messageApi.saveMessage({
        message_id: message.messageId,
        provider_chat_id: message.conversationId,
        content: message.content,
        role: message.role,
        parent_message_id: message.parent_message_id, // Include parent_message_id
        model: message.model || 'unknown',
        created_at: message.timestamp
      });
      
      debug(`Saved message ${message.messageId.substring(0, 8)}...`);
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error saving message'));
    }
  }
  
  /**
   * Save conversation to backend
   */
  private async saveConversation(conversationId: string, title: string): Promise<void> {
    try {
      await messageApi.saveChat({
        provider_chat_id: conversationId,
        title,
        provider_name: 'ChatGPT'
      });
      
      debug(`Saved conversation ${conversationId.substring(0, 8)}...`);
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error saving conversation'));
    }
  }
  
  /**
   * Save conversation and messages in batch
   */
  private async saveConversationBatch(conversationId: string, title: string, messages: Message[]): Promise<void> {
    try {
      // Format messages for API
      const formattedMessages = messages.map((msg) => ({
        message_id: msg.messageId,
        provider_chat_id: msg.conversationId,
        content: msg.content,
        role: msg.role,
        parent_message_id: msg.parent_message_id, // Include parent_message_id
        model: msg.model || 'unknown',
        created_at: msg.timestamp
      }));
      
      // Save batch
      await messageApi.saveBatch({
        chats: [{
          provider_chat_id: conversationId,
          title,
          provider_name: 'ChatGPT'
        }],
        messages: formattedMessages
      });
      
      debug(`Saved conversation batch with ${messages.length} messages`);
    } catch (error) {
      errorReporter.captureError(AppError.from(error, 'Error saving conversation batch'));
    }
  }
  
  /**
   * Get current conversation ID
   */
  public getCurrentConversationId(): string | null {
    return this.currentConversationId;
  }
  
  /**
   * Set current conversation ID
   */
  public setCurrentConversationId(conversationId: string): void {
    this.currentConversationId = conversationId;
    
    // Process any pending messages for this conversation
    this.processPendingMessages(conversationId);
  }
  
  /**
   * Get messages for a conversation
   */
  public getConversationMessages(conversationId: string): Message[] {
    return this.messages.get(conversationId) || [];
  }
  
  /**
   * Get a conversation by ID
   */
  public getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }
  
  /**
   * Get all conversations
   */
  public getConversations(): Conversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    networkRequestMonitor.cleanup();
    window.removeEventListener('popstate', this.checkUrlForConversationId);
  }
}

export const chatService = ChatService.getInstance();