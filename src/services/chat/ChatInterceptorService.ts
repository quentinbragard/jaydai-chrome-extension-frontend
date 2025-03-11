// src/services/chat/ChatInterceptorService.ts
import { messageObserver } from '@/utils/messageObserver';
import { UrlChangeListener } from './UrlChangeListener';
import { MessageEvent } from './types';
import { injectNetworkInterceptor } from '@/content/injectInterceptor';
import { conversationHandler } from './handlers/ConversationHandler';
import { messageHandler } from './handlers/MessageHandler';

/**
 * Main service to coordinate ChatGPT interception
 */
export class ChatInterceptorService {
  private static instance: ChatInterceptorService;
  private isInitialized: boolean = false;
  private urlListener: UrlChangeListener;
  private cleanupListeners: (() => void)[] = [];
  
  private constructor() {
    // Initialize URL listener with our URL change handler
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
    
    // Get initial chat ID from URL and update conversation handler
    const chatId = UrlChangeListener.extractChatIdFromUrl(window.location.href);
    conversationHandler.setCurrentChatId(chatId);
    conversationHandler.updateChatTitleFromDOM();
    
    // Initialize message observer and store its cleanup function
    messageObserver.initialize();
    const removeMessageListener = messageObserver.onNewMessage((message) => {
      messageHandler.processMessage({
        type: message.role as 'user' | 'assistant',
        messageId: message.messageId,
        content: message.message,
        timestamp: message.timestamp,
        conversationId: message.providerChatId,
        model: message.model || ''
      });
    });
    this.cleanupListeners.push(removeMessageListener);
    
    // Inject network interceptor into the page context
    injectNetworkInterceptor();
    
    // Start URL listener and store a cleanup function
    this.urlListener.startListening();
    this.cleanupListeners.push(() => this.urlListener.stopListening());
    
    // Save the current chat to the backend if a chatId exists
    if (chatId) {
      conversationHandler.saveCurrentChatToBackend();
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Clean up all resources and event listeners
   */
  public cleanup(): void {
    if (!this.isInitialized) return;
    
    // Call all stored cleanup functions
    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];
    
    // Also clean up the message observer and clear processed messages
    messageObserver.cleanup();
    messageHandler.clearProcessedMessages();
    
    this.isInitialized = false;
  }
  
  /**
   * Register a listener for new messages
   * @returns Function to remove the listener
   */
  public onMessage(listener: (event: MessageEvent) => void): () => void {
    return messageHandler.onMessage(listener);
  }
  
  /**
   * Get the current active chat ID
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
   * Handle URL changes by updating the conversation handler
   */
  private handleUrlChange(newUrl: string): void {
    const chatId = UrlChangeListener.extractChatIdFromUrl(newUrl);
    conversationHandler.setCurrentChatId(chatId);
    conversationHandler.updateChatTitleFromDOM();
    
    // Reset the message observer if necessary
    if (chatId !== conversationHandler.getCurrentChatId()) {
      messageObserver.cleanup();
      messageObserver.initialize();
    }
    
    if (chatId) {
      conversationHandler.saveCurrentChatToBackend();
    }
  }
}

// Export a singleton instance
export const chatInterceptor = ChatInterceptorService.getInstance();
