// src/services/ConversationListService.ts
import { networkRequestMonitor } from '@/utils/NetworkRequestMonitor';
import { conversationHandler } from '@/services/handlers/ConversationHandler';
import { apiService } from '@/services/ApiService';
import { ChatInfo } from './chat/types';

/**
 * Service to fetch and process conversation list information
 */
export class ConversationListService {
  private static instance: ConversationListService;
  private fetchedConversations: boolean = false;
  private storageKey: string = 'archimind_conversations';
  private cleanupListeners: (() => void)[] = [];
  private conversations: Map<string, ChatInfo> = new Map();
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ConversationListService {
    if (!ConversationListService.instance) {
      ConversationListService.instance = new ConversationListService();
    }
    return ConversationListService.instance;
  }
  
  /**
   * Initialize the service - fetch conversation list
   */
  public initialize(): void {
    console.log('📋 Initializing conversation list service...');
    
    // First try to get from storage
    this.getConversationsFromStorage().then(data => {
      if (data && Array.isArray(data)) {
        // Process stored conversations
        data.forEach((chat: ChatInfo) => {
          if (chat && chat.id) {
            this.conversations.set(chat.id, chat);
            conversationHandler.processConversation(chat);
          }
        });
        this.fetchedConversations = true;
        console.log(`📋 Loaded ${data.length} conversations from storage`);
      }
    });
    
    // Initialize network request monitoring
    networkRequestMonitor.initialize();
    
    // Listen specifically for /backend-api/conversations responses
    const removeConversationsListener = networkRequestMonitor.addListener(
      '/backend-api/conversations',
      this.handleConversationsCapture.bind(this)
    );
    this.cleanupListeners.push(removeConversationsListener);
    
    // Add event listener for conversation data from injected script
    document.addEventListener('archimind-network-intercept', this.handleInterceptEvent.bind(this));
    
    console.log('✅ Conversation list service initialized');
  }
  
  /**
   * Handle conversations captured by network monitor
   */
  private handleConversationsCapture(data: any): void {
    if (!data || !data.responseBody) return;

    console.log('📋 Processing conversation list data from network capture');
    const conversationsData = data.responseBody;
    
    // Verify this is complete conversations data
    if (conversationsData && Array.isArray(conversationsData.items)) {
      this.processConversationList(conversationsData);
    }
  }
  
  /**
   * Process conversation list data
   */
  private processConversationList(data: any): void {
    if (!data || !Array.isArray(data.items)) {
      console.log('⚠️ Invalid conversation list data format', data);
      return;
    }
    
    console.log(`📋 Processing ${data.items.length} conversations`);
    
    // Process each conversation
    for (const chat of data.items) {
      if (chat && chat.id) {
        const chatInfo: ChatInfo = {
          id: chat.id,
          title: chat.title || `Chat ${chat.id.substring(0, 8)}`,
          create_time: chat.create_time,
          update_time: chat.update_time
        };
        
        // Add to our map
        this.conversations.set(chat.id, chatInfo);
        
        // Process using the existing handler
        conversationHandler.processConversation(chatInfo);
      }
    }
    
    this.fetchedConversations = true;
    this.saveConversationsToStorage();
  }
  
  /**
   * Handle events from the network interceptor
   */
  private handleInterceptEvent(event: any): void {
    if (!event.detail || event.detail.type !== 'conversationList' || !event.detail.data) {
      return;
    }
    
    const data = event.detail.data;
    if (!data.responseBody) return;
    
    console.log('📋 Processing conversation list data from interceptor event');
    this.processConversationList(data.responseBody);
  }
  
  /**
   * Save conversations to extension storage
   */
  private saveConversationsToStorage(): void {
    try {
      // Convert map to array
      const conversationsArray = Array.from(this.conversations.values());
      
      // Save to chrome.storage
      chrome.storage.local.set({ [this.storageKey]: conversationsArray });
      console.log(`📋 Saved ${conversationsArray.length} conversations to storage`);
    } catch (error) {
      console.error('❌ Error saving conversations to storage:', error);
    }
  }
  
  /**
   * Get conversations from storage
   */
  private async getConversationsFromStorage(): Promise<any> {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get([this.storageKey], (result) => {
          if (result && result[this.storageKey]) {
            resolve(result[this.storageKey]);
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error getting conversations from storage:', error);
      return null;
    }
  }
  
  /**
   * Get all conversations
   */
  public getConversations(): ChatInfo[] {
    return Array.from(this.conversations.values());
  }
  
  /**
   * Get a conversation by ID
   */
  public getConversation(id: string): ChatInfo | undefined {
    return this.conversations.get(id);
  }
  
  /**
   * Force a refresh of the conversations
   */
  public refreshConversations(): void {
    this.fetchedConversations = false;
    this.conversations.clear();
    
    // Clear from storage
    chrome.storage.local.remove([this.storageKey]);
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Remove all listeners
    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];
    
    // Remove event listener
    document.removeEventListener('archimind-network-intercept', this.handleInterceptEvent.bind(this));
    
    console.log('✅ Conversation list service cleaned up');
  }
}

// Export a singleton instance
export const conversationListService = ConversationListService.getInstance();