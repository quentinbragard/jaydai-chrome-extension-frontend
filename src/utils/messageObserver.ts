import { apiService } from '@/services/ApiService';

export interface ChatMessage {
  messageId: string;
  message: string;
  role: 'user' | 'assistant' | 'system';
  rank: number;
  providerChatId: string;
  model?: string;
  thinkingTime?: number;
  timestamp: number;
}

export interface ChatInfo {
  chatId: string;
  chatTitle: string;
  providerName: string;
  messages: ChatMessage[];
}

/**
 * Class to observe and capture ChatGPT messages
 */
export class MessageObserver {
  private observer: MutationObserver | null = null;
  private messageQueue: ChatMessage[] = [];
  private isProcessing: boolean = false;
  private currentChat: ChatInfo | null = null;
  private isInitialized: boolean = false;
  private onNewMessageCallback: ((message: ChatMessage) => void) | null = null;
  private processingInterval: number | null = null;
  private messageSelectors = {
    // Define selectors for ChatGPT's DOM structure
    // These may need updates if ChatGPT changes its UI
    container: 'main div.flex.flex-col.text-sm',
    userMessage: '[data-message-author-role="user"]',
    assistantMessage: '[data-message-author-role="assistant"]',
    messageContent: '.markdown',
    messageId: 'data-message-id',
  };

  /**
   * Setup the observer to monitor DOM changes
   */
  initialize() {
    if (this.isInitialized) return;

    // Get or create chat info
    //this.extractChatInfo();

    // Initial scan of existing messages
    this.scanExistingMessages();

    // Setup message processing interval
    this.processingInterval = window.setInterval(() => {
      this.processMessageQueue();
    }, 5000);

    // Create and start the mutation observer
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    // Start observing with a slight delay to ensure page is loaded
    setTimeout(() => {
      if (this.observer) {
        const targetNode = document.querySelector('body');
        if (targetNode) {
          this.observer.observe(targetNode, {
            childList: true,
            subtree: true,
          });
          console.log('✅ ChatGPT message observer started');
          this.isInitialized = true;
        } else {
          console.error('❌ Could not find target node for observer');
        }
      }
    }, 1000);
  }

  /**
   * Extract chat information from the page
   */
  private extractChatInfo() {
    try {
      // Extract chat ID from URL or DOM
      const url = new URL(window.location.href);
      const chatId = url.pathname.split('/').pop() || `chat-${Date.now()}`;
      
      // Try to find chat title
      // For ChatGPT, the title might be in the nav sidebar
      const titleElement = document.querySelector('nav h1');
      const chatTitle = titleElement?.textContent?.trim() || 'New Conversation';

      this.currentChat = {
        chatId,
        chatTitle,
        providerName: 'ChatGPT',
        messages: [],
      };

      // Save chat info to backend
      apiService.saveChatToBackend({
        chatId: this.currentChat.chatId,
        chatTitle: this.currentChat.chatTitle,
        providerName: this.currentChat.providerName
      }).catch(error => {
        console.error('❌ Failed to save chat info:', error);
      });

      console.log('✅ Extracted chat info:', this.currentChat);
    } catch (error) {
      console.error('❌ Failed to extract chat info:', error);
      // Create fallback chat info
      this.currentChat = {
        chatId: `chat-${Date.now()}`,
        chatTitle: 'Untitled Conversation',
        providerName: 'ChatGPT',
        messages: [],
      };
    }
  }

  /**
   * Scan existing messages on the page
   */
  private scanExistingMessages() {
    try {
      const container = document.querySelector(this.messageSelectors.container);
      if (!container) {
        console.log('⚠️ Message container not found');
        return;
      }

      // Find all messages
      const userMessages = container.querySelectorAll(this.messageSelectors.userMessage);
      const assistantMessages = container.querySelectorAll(this.messageSelectors.assistantMessage);

      // Process user messages
      userMessages.forEach((node, index) => {
        const message = this.extractMessageFromNode(node as HTMLElement, 'user', index);
        if (message) this.queueMessage(message);
      });

      // Process assistant messages
      assistantMessages.forEach((node, index) => {
        const message = this.extractMessageFromNode(node as HTMLElement, 'assistant', userMessages.length + index);
        if (message) this.queueMessage(message);
      });

      console.log(`✅ Scanned ${userMessages.length + assistantMessages.length} existing messages`);
    } catch (error) {
      console.error('❌ Error scanning existing messages:', error);
    }
  }

  /**
   * Handle DOM mutations to detect new messages
   */
  private handleMutations(mutations: MutationRecord[]) {
    // Look for message-related mutations
    const relevantMutations = mutations.filter(mutation => {
      const target = mutation.target as HTMLElement;
      return (
        // Look for added nodes that might be messages
        (mutation.type === 'childList' && mutation.addedNodes.length > 0) ||
        // Or message content changes
        (target && (
          target.matches?.(this.messageSelectors.userMessage) || 
          target.matches?.(this.messageSelectors.assistantMessage) ||
          target.closest?.(this.messageSelectors.userMessage) ||
          target.closest?.(this.messageSelectors.assistantMessage)
        ))
      );
    });

    if (relevantMutations.length === 0) return;

    // Re-scan all messages when relevant changes occur
    // This is simpler than trying to determine exact changes
    setTimeout(() => this.scanExistingMessages(), 500);
  }

  /**
   * Extract message data from a DOM node
   */
  private extractMessageFromNode(
    node: HTMLElement, 
    defaultRole: 'user' | 'assistant' | 'system', 
    index: number
  ): ChatMessage | null {
    try {
      // Skip if already processed
      if (node.dataset.archiProcessed === 'true') {
        return null;
      }

      // Get message ID
      const messageId = node.getAttribute(this.messageSelectors.messageId) || 
                        `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Get message content
      const contentEl = node.querySelector(this.messageSelectors.messageContent);
      const messageText = contentEl?.textContent?.trim() || '';
      
      if (!messageText) {
        return null; // Skip empty messages
      }
      
      // Determine role
      let role = defaultRole;
      if (node.dataset.messageAuthorRole) {
        role = node.dataset.messageAuthorRole as 'user' | 'assistant' | 'system';
      }
      
      // Mark as processed
      node.dataset.archiProcessed = 'true';
      
      // Create message object
      const message: ChatMessage = {
        messageId,
        message: messageText,
        role,
        rank: index,
        providerChatId: this.currentChat?.chatId || '',
        timestamp: Date.now(),
      };
      
      return message;
    } catch (error) {
      console.error('❌ Failed to extract message:', error);
      return null;
    }
  }

  /**
   * Queue a message for processing
   */
  private queueMessage(message: ChatMessage) {
    // Check for duplicates
    const isDuplicate = this.messageQueue.some(m => m.messageId === message.messageId) || 
                        this.currentChat?.messages.some(m => m.messageId === message.messageId);
    
    if (!isDuplicate) {
      this.messageQueue.push(message);
      
      // Notify via callback if set
      if (this.onNewMessageCallback) {
        this.onNewMessageCallback(message);
      }
      
      console.log('✅ Queued new message:', message);
    }
  }

  /**
   * Process messages in the queue
   */
  private async processMessageQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      // Process messages in order
      const message = this.messageQueue.shift();
      if (!message || !this.currentChat) return;
      
      // Add to current chat messages
      this.currentChat.messages.push(message);
      
      // Save to backend
      await apiService.saveMessageToBackend(message);
      
      console.log('✅ Processed message:', message.messageId);
    } catch (error) {
      console.error('❌ Failed to process message:', error);
      // Could implement retry logic here if needed
    } finally {
      this.isProcessing = false;
      
      // Process next message if any remain
      if (this.messageQueue.length > 0) {
        setTimeout(() => this.processMessageQueue(), 500);
      }
    }
  }

  /**
   * Set a callback for new messages
   */
  onNewMessage(callback: (message: ChatMessage) => void) {
    this.onNewMessageCallback = callback;
  }

  /**
   * Clean up the observer
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    this.isInitialized = false;
    console.log('✅ Message observer cleaned up');
  }
}

// Export singleton instance
export const messageObserver = new MessageObserver();