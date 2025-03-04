// src/services/ChatInterceptorService.ts
// This service handles interception and processing of ChatGPT messages
import { apiService } from './ApiService';
import { messageObserver } from '@/utils/messageObserver';

export interface MessageEvent {
  type: 'user' | 'assistant';
  messageId: string;
  content: string;
  timestamp: number;
}

/**
 * Service to handle interception and processing of ChatGPT messages
 * Combines network interception and DOM observation approaches
 */
export class ChatInterceptorService {
  private static instance: ChatInterceptorService;
  private originalFetch: typeof window.fetch;
  private originalXHR: typeof XMLHttpRequest;
  private isIntercepting = false;
  private currentChatId: string | null = null;
  private chatTitle: string = 'New Conversation';
  private messageListeners: ((event: MessageEvent) => void)[] = [];
  
  private constructor() {
    this.originalFetch = window.fetch;
    this.originalXHR = XMLHttpRequest;
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
   * Initialize the message interception
   */
  public initialize(): void {
    if (this.isIntercepting) return;
    
    console.log('🔍 Initializing ChatGPT interception...');
    
    // Extract chat ID and title from URL
    this.extractChatInfoFromURL();
    
    // Start DOM-based message observer
    messageObserver.initialize();
    messageObserver.onNewMessage((message) => {
      this.handleNewMessage({
        type: message.role as 'user' | 'assistant', 
        messageId: message.messageId,
        content: message.message,
        timestamp: message.timestamp
      });
    });
    
    // Start network interception for completeness
    this.startNetworkInterception();
    
    // Listen for URL changes to detect conversation changes
    this.setupURLChangeListener();
    
    this.isIntercepting = true;
    console.log('✅ ChatGPT interception initialized');
  }
  
  /**
   * Stop all interception
   */
  public cleanup(): void {
    if (!this.isIntercepting) return;
    
    // Reset network interception
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
    if (this.originalXHR) {
      window.XMLHttpRequest = this.originalXHR;
    }
    
    // Clean up message observer
    messageObserver.cleanup();
    
    // Clear any other resources
    this.messageListeners = [];
    
    this.isIntercepting = false;
    console.log('✅ ChatGPT interception cleaned up');
  }
  
  /**
   * Register a listener for new messages
   */
  public onMessage(listener: (event: MessageEvent) => void): () => void {
    this.messageListeners.push(listener);
    
    // Return cleanup function
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Get the current chat ID
   */
  public getCurrentChatId(): string | null {
    return this.currentChatId;
  }
  
  /**
   * Get the current chat title
   */
  public getChatTitle(): string {
    return this.chatTitle;
  }
  
  /**
   * Setup listener for URL changes to detect conversation changes
   */
  private setupURLChangeListener(): void {
    let lastUrl = window.location.href;
    
    // Regular polling for URL changes
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        this.extractChatInfoFromURL();
      }
    }, 1000);
    
    // Also hook into History API
    const originalPushState = history.pushState;
    history.pushState = function() {
      originalPushState.apply(this, arguments as any);
      ChatInterceptorService.getInstance().extractChatInfoFromURL();
    };
  }
  
  /**
   * Extract chat ID and title from URL
   */
  private extractChatInfoFromURL(): void {
    try {
      const url = new URL(window.location.href);
      const match = url.pathname.match(/\/c\/([^/?]+)/);
      let newChatId = match ? match[1] : null;
      
      if (newChatId !== this.currentChatId) {
        console.log(`📝 Chat ID changed: ${this.currentChatId} -> ${newChatId}`);
        
        // Reset the message observer for the new chat
        messageObserver.cleanup();
        messageObserver.initialize();
        
        // Update chat ID and reset title
        this.currentChatId = newChatId;
        this.chatTitle = 'New Conversation';
        
        // Try to get the title from the DOM
        this.updateChatTitleFromDOM();
        
        // If we have a valid chat ID, save it to the backend
        if (this.currentChatId) {
          this.saveChatToBackend();
        }
      }
    } catch (error) {
      console.error('❌ Error extracting chat info from URL:', error);
    }
  }
  
  /**
   * Try to extract chat title from the DOM
   */
  private updateChatTitleFromDOM(): void {
    try {
      // Look for the chat title in the sidebar
      const titleElement = document.querySelector(`nav a[href="/c/${this.currentChatId}"] div[title]`);
      if (titleElement && titleElement.getAttribute('title')) {
        const newTitle = titleElement.getAttribute('title')!.trim();
        if (newTitle && newTitle !== 'New chat' && newTitle !== this.chatTitle) {
          this.chatTitle = newTitle;
          console.log(`📝 Chat title updated: ${this.chatTitle}`);
          
          // Update the title in the backend
          this.saveChatToBackend();
        }
      }
    } catch (error) {
      console.error('❌ Error updating chat title from DOM:', error);
    }
  }
  
  /**
   * Save the current chat to the backend
   */
  private saveChatToBackend(): void {
    if (!this.currentChatId) return;
    
    apiService.saveChatToBackend({
      chatId: this.currentChatId,
      chatTitle: this.chatTitle,
      providerName: 'ChatGPT'
    }).catch(error => {
      console.error('❌ Error saving chat to backend:', error);
    });
  }
  
  /**
   * Handle a new message from any source
   */
  private handleNewMessage(event: MessageEvent): void {
    // Skip if we don't have a chat ID
    if (!this.currentChatId) return;
    
    try {
      // Save the message to the backend
      apiService.saveMessageToBackend({
        messageId: event.messageId,
        message: event.content,
        role: event.type,
        rank: 0, // We don't have rank info here, could be improved
        providerChatId: this.currentChatId,
        thinkingTime: 0 // We don't track thinking time yet, could be added
      }).catch(error => {
        console.error('❌ Error saving message to backend:', error);
      });
      
      // Notify all listeners
      this.messageListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('❌ Error in message listener:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error handling new message:', error);
    }
  }
  
  /**
   * Start intercepting network requests to capture messages
   * This is a complementary approach to DOM observation
   */
  private startNetworkInterception(): void {
    this.interceptFetch();
    this.interceptXHR();
  }
  
  /**
   * Intercept the fetch API to capture ChatGPT completions
   */
  private interceptFetch(): void {
    const self = this;
    
    window.fetch = async function(input, init) {
      // Call original fetch
      const response = await self.originalFetch.call(this, input, init);
      
      // Process if it's a relevant request
      try {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        
        if (url && self.isChatCompletionURL(url)) {
          // Clone the response so we can read it
          const responseClone = response.clone();
          
          // Process this asynchronously to not block
          responseClone.json().then(data => {
            self.processCompletionResponse(data);
          }).catch(error => {
            console.error('❌ Error processing fetch response:', error);
          });
        }
      } catch (error) {
        console.error('❌ Error in fetch interception:', error);
      }
      
      // Return the original response
      return response;
    };
  }
  
  /**
   * Intercept XMLHttpRequest to capture ChatGPT completions
   */
  private interceptXHR(): void {
    const self = this;
    
    window.XMLHttpRequest = function() {
      const xhr = new self.originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      let requestUrl = '';
      
      xhr.open = function() {
        requestUrl = arguments[1] || '';
        return originalOpen.apply(this, arguments as any);
      };
      
      xhr.send = function() {
        if (self.isChatCompletionURL(requestUrl)) {
          xhr.addEventListener('load', function() {
            try {
              const response = JSON.parse(xhr.responseText);
              self.processCompletionResponse(response);
            } catch (error) {
              console.error('❌ Error processing XHR response:', error);
            }
          });
        }
        
        return originalSend.apply(this, arguments as any);
      };
      
      return xhr;
    } as any;
  }
  
  /**
   * Check if URL is a ChatGPT completion API
   */
  private isChatCompletionURL(url: string): boolean {
    return url.includes('api.openai.com/v1/chat/completions') || 
           url.includes('chatgpt.com/backend-api/conversation');
  }
  
  /**
   * Process a completion response from network interception
   */
  private processCompletionResponse(data: any): void {
    try {
      if (!data) return;
      
      // Extract message content based on the response format
      if (data.choices && data.choices[0]?.message) {
        // OpenAI API format
        const message = data.choices[0].message;
        
        this.handleNewMessage({
          type: 'assistant',
          messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: message.content,
          timestamp: Date.now()
        });
      } else if (data.message) {
        // ChatGPT web format
        const message = data.message;
        const content = message.content?.parts?.join('\n') || message.content || '';
        
        this.handleNewMessage({
          type: 'assistant',
          messageId: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: content,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('❌ Error processing completion response:', error);
    }
  }
}

// Export a singleton instance
export const chatInterceptor = ChatInterceptorService.getInstance();