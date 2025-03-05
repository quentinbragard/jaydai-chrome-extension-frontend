// src/services/chat/ChatInterceptorService.ts
// Main service that coordinates all chat interception functionality
import { messageObserver } from '@/utils/messageObserver';
import { NetworkInterceptor } from './NetworkInterceptor';
import { StreamProcessor } from './StreamProcessor';
import { UrlChangeListener } from './UrlChangeListener';
import { MessageEvent } from './types';

// Import handlers
import { conversationHandler } from './handlers/ConversationHandler';
import { messageHandler } from './handlers/MessageHandler';
import { userHandler } from './handlers/UserHandler';

/**
 * Main service to coordinate ChatGPT interception
 */
export class ChatInterceptorService {
  private static instance: ChatInterceptorService;
  private isInitialized: boolean = false;
  private networkInterceptor: NetworkInterceptor;
  private urlListener: UrlChangeListener;
  
  private constructor() {
    // Initialize sub-components
    this.networkInterceptor = new NetworkInterceptor({
      onConversationList: (data) => conversationHandler.processConversationList(data),
      onUserInfo: (data) => userHandler.processUserInfo(data),
      onChatCompletion: this.handleChatCompletion.bind(this)
    });
    
    this.urlListener = new UrlChangeListener({
      onUrlChange: (newUrl) => this.handleUrlChange(newUrl)
    });
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ChatInterceptorService {
    if (!ChatInterceptorService.instance) {
      ChatInterceptorService.instance = new ChatInterceptorService();
    }
    return ChatInterceptorService.instance;
  }
  
  /**
   * Initialize the ChatGPT interception
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    console.log('🚀 Initializing ChatGPT interception...');
    
    // Get initial chat ID from URL
    const chatId = UrlChangeListener.extractChatIdFromUrl(window.location.href);
    conversationHandler.setCurrentChatId(chatId);
    
    // Try to get the title from the DOM
    conversationHandler.updateChatTitleFromDOM();
    
    // Start message observer
    messageObserver.initialize();
    messageObserver.onNewMessage((message) => {
      messageHandler.processMessage({
        type: message.role as 'user' | 'assistant',
        messageId: message.messageId,
        content: message.message,
        timestamp: message.timestamp,
        conversationId: message.providerChatId
      });
    });
    
    // Start network interception
    this.networkInterceptor.startIntercepting();
    
    // Start URL change listener
    this.urlListener.startListening();
    
    // If we have a valid chat ID, save it to the backend
    if (chatId) {
      conversationHandler.saveCurrentChatToBackend();
    }
    
    this.isInitialized = true;
    console.log('✅ ChatGPT interception initialized');
  }
  
  /**
   * Clean up all resources
   */
  public cleanup(): void {
    if (!this.isInitialized) return;
    
    console.log('🧹 Cleaning up ChatGPT interception...');
    
    // Stop URL listener
    this.urlListener.stopListening();
    
    // Stop network interception
    this.networkInterceptor.stopIntercepting();
    
    // Clean up message observer
    messageObserver.cleanup();
    
    // Clear processed messages
    messageHandler.clearProcessedMessages();
    
    this.isInitialized = false;
    console.log('✅ ChatGPT interception cleaned up');
  }
  
  /**
   * Register a listener for new messages
   * @returns Function to remove the listener
   */
  public onMessage(listener: (event: MessageEvent) => void): () => void {
    return messageHandler.onMessage(listener);
  }
  
  /**
   * Get the current chat ID
   */
  public getCurrentChatId(): string | null {
    return conversationHandler.getCurrentChatId();
  }
  
  /**
   * Get the current chat title
   */
  public getChatTitle(): string {
    return conversationHandler.getCurrentChatTitle();
  }
  
  /**
   * Handle URL changes
   */
  private handleUrlChange(newUrl: string): void {
    // Extract chat ID from URL
    const chatId = UrlChangeListener.extractChatIdFromUrl(newUrl);
    
    // Update current chat ID
    conversationHandler.setCurrentChatId(chatId);
    
    // Try to get the title from the DOM
    conversationHandler.updateChatTitleFromDOM();
    
    // If we have a new chat ID, reset the message observer
    if (chatId !== conversationHandler.getCurrentChatId()) {
      messageObserver.cleanup();
      messageObserver.initialize();
    }
    
    // If we have a valid chat ID, save it to the backend
    if (chatId) {
      conversationHandler.saveCurrentChatToBackend();
    }
  }
  
  /**
   * Handle chat completion response
   */
  private async handleChatCompletion(
    response: Response, 
    requestBody: any, 
    url: string, 
    isStreaming: boolean
  ): Promise<void> {
    try {
      // Process user message from request body
      if (requestBody && requestBody.messages && requestBody.messages.length > 0) {
        const userMessage = StreamProcessor.extractUserMessage(requestBody);
        if (userMessage) {
          messageHandler.processMessage({
            type: 'user',
            messageId: userMessage.id,
            content: userMessage.content,
            timestamp: Date.now(),
            conversationId: requestBody.conversation_id || null,
            model: userMessage.model
          });
        }
      }
      
      // Process assistant response
      if (isStreaming) {
        // Process streaming response
        const assistantMessage = await StreamProcessor.processStream(response, requestBody);
        if (assistantMessage) {
          messageHandler.processMessage({
            type: 'assistant',
            messageId: assistantMessage.id,
            content: assistantMessage.content,
            timestamp: Date.now(),
            conversationId: assistantMessage.conversationId,
            model: assistantMessage.model
          });
        }
      } else {
        // Process regular JSON response
        const data = await response.json();
        
        if (data.message) {
          const messageContent = data.message.content?.parts?.join('\n') || 
                               data.message.content || '';
          
          messageHandler.processMessage({
            type: 'assistant',
            messageId: data.message.id || `assistant-${Date.now()}`,
            content: messageContent,
            timestamp: Date.now(),
            conversationId: data.conversation_id || null,
            model: data.message.metadata?.model_slug || null
          });
        }
      }
    } catch (error) {
      console.error('❌ Error handling chat completion:', error);
    }
  }
}

// Export a singleton instance
export const chatInterceptor = ChatInterceptorService.getInstance();