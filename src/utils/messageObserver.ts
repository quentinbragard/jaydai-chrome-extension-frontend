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

  /**
   * Setup the observer to monitor DOM changes
   */
  initialize() {
    if (this.isInitialized) return;

    // Get or create chat info
    this.extractChatInfo();

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
        this.observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        console.log('✅ ChatGPT message observer started');
        this.isInitialized = true;
      }
    }, 1000);
  }

  /**
   * Extract chat information from the page
   */
  private extractChatInfo() {
    try {
      // Extract chat ID from URL or DOM (implementation depends on ChatGPT's structure)
      const url = new URL(window.location.href);
      const chatId = url.pathname.split('/').pop() || `chat-${Date.now()}`;
      
      // Try to find chat title (this selector needs to match ChatGPT's structure)
      const titleElement = document.querySelector('[data-testid="conversation-title"]');
      const chatTitle = titleElement?.textContent || 'Untitled Conversation';

      this.currentChat = {
        chatId,
        chatTitle,
        providerName: 'ChatGPT',
        messages: [],
      };

      // Save chat info to backend
      apiService.saveChatToBackend(this.currentChat).catch(error => {
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
   * Handle DOM mutations to detect new messages
   */
  private handleMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      // Skip if no chat info available
      if (!this.currentChat) return;

      // Look for new message containers
      // This logic needs to be adapted to match ChatGPT's DOM structure
      const messageNodes = this.findMessageNodes(mutation);
      
      for (const node of messageNodes) {
        const message = this.extractMessageFromNode(node);
        if (message) {
          this.queueMessage(message);
        }
      }
    }
  }

  /**
   * Find message nodes in a mutation record
   * This is a placeholder - actual implementation depends on ChatGPT's DOM structure
   */
  private findMessageNodes(mutation: MutationRecord): HTMLElement[] {
    const messageNodes: HTMLElement[] = [];
    
    // ChatGPT typically has a structure with user and assistant messages
    // You'll need to identify the specific selectors for message containers
    // Example (adjust based on actual ChatGPT DOM):
    const potentialContainer = mutation.target as HTMLElement;
    const messageElements = potentialContainer.querySelectorAll('[data-message-id]');
    
    messageElements.forEach(element => {
      if (element instanceof HTMLElement && !element.dataset.processed) {
        messageNodes.push(element);
        // Mark as processed to avoid duplicate processing
        element.dataset.processed = 'true';
      }
    });
    
    return messageNodes;
  }

  /**
   * Extract message data from a DOM node
   * This is a placeholder - actual implementation depends on ChatGPT's DOM structure
   */
  private extractMessageFromNode(node: HTMLElement): ChatMessage | null {
    try {
      // These selectors need to be adjusted based on ChatGPT's actual DOM structure
      const messageId = node.dataset.messageId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const messageText = node.querySelector('.message-content')?.textContent?.trim() || '';
      
      // Determine role based on classes or data attributes
      let role: 'user' | 'assistant' | 'system' = 'user';
      if (node.classList.contains('assistant-message') || node.dataset.role === 'assistant') {
        role = 'assistant';
      } else if (node.classList.contains('system-message') || node.dataset.role === 'system') {
        role = 'system';
      }
      
      // Get current messages count for ranking
      const rank = this.currentChat?.messages.length || 0;
      
      // Optional: extract model info if available
      const model = node.dataset.model || undefined;
      
      // Create message object
      const message: ChatMessage = {
        messageId,
        message: messageText,
        role,
        rank,
        providerChatId: this.currentChat?.chatId || '',
        model,
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