// src/services/handlers/ConversationHandler.ts
import { apiService } from '@/services/ApiService';
import { ChatInfo } from '../chat/types';
import { specificConversationHandler } from './SpecificConversationHandler';

/**
 * Service to handle conversation data from ChatGPT
 * Consolidates functionality from the ConversationListService
 */
export class ConversationHandler {
  private static instance: ConversationHandler;
  private currentChatId: string | null = null;
  private currentChatTitle: string = 'No title';
  private fetchInProgress: boolean = false;
  private conversations: Map<string, ChatInfo> = new Map();
  private storageKey: string = 'archimind_conversations';
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ConversationHandler {
    if (!ConversationHandler.instance) {
      ConversationHandler.instance = new ConversationHandler();
    }
    return ConversationHandler.instance;
  }
  
  /**
   * Initialize the handler
   */
  public async initialize(): Promise<void> {
    console.log('📋 Initializing conversation handler...');
    
    // Load conversations from storage
    await this.loadConversationsFromStorage();
    
    console.log('✅ Conversation handler initialized');
  }
  
  /**
   * Load conversations from storage
   */
  private async loadConversationsFromStorage(): Promise<void> {
    try {
      const data = await new Promise<any[]>((resolve) => {
        chrome.storage.local.get([this.storageKey], (result) => {
          if (result && result[this.storageKey]) {
            resolve(result[this.storageKey]);
          } else {
            resolve([]);
          }
        });
      });
      
      if (data && Array.isArray(data)) {
        // Process stored conversations
        data.forEach((chat: ChatInfo) => {
          if (chat && chat.id) {
            this.conversations.set(chat.id, chat);
          }
        });
        console.log(`📋 Loaded ${data.length} conversations from storage`);
      }
    } catch (error) {
      console.error('❌ Error loading conversations from storage:', error);
    }
  }
  
  /**
   * Save conversations to storage
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
   * Set the active conversation ID (e.g., from URL)
   */
  public setCurrentChatId(chatId: string | null): void {
    if (this.currentChatId !== chatId) {
      this.currentChatId = chatId;
      
      // Try to get title from existing conversations
      if (chatId && this.conversations.has(chatId)) {
        this.currentChatTitle = this.conversations.get(chatId)?.title || 'No title';
      } else {
        // Try to get from DOM if not in our records
        this.updateChatTitleFromDOM();
      }
      
      // Proactively fetch conversation data if we have a valid chat ID
      if (chatId) {
        this.fetchConversationData(chatId);
      }
    }
  }
  
  /**
   * Get the current active chat ID
   */
  public getCurrentChatId(): string | null {
    return this.currentChatId;
  }
  
  /**
   * Get the current chat title
   */
  public getCurrentChatTitle(): string {
    return this.currentChatTitle;
  }
  
  /**
   * Proactively fetch conversation data using the chatId
   */
  public async fetchConversationData(chatId: string): Promise<void> {
    if (this.fetchInProgress) return;
    
    this.fetchInProgress = true;
    
    try {
      // Use the fetch API directly with the current user's credentials
      const conversationUrl = `https://chatgpt.com/backend-api/conversation/${chatId}`;
      
      const response = await fetch(conversationUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the conversation title
      if (data.title) {
        this.updateChatTitle(data.title);
      }
      
      // Process the fetched conversation data using the handler
      specificConversationHandler.processSpecificConversation({
        responseBody: data
      });
      
    } catch (error) {
      console.error(`❌ Error fetching conversation: ${error}`);
    } finally {
      this.fetchInProgress = false;
    }
  }
  
  /**
   * Update the title of the current conversation
   */
  public updateChatTitle(title: string): void {
    if (title && title !== this.currentChatTitle) {
      this.currentChatTitle = title;
      
      if (this.currentChatId) {
        this.saveChatToBackend(this.currentChatId, this.currentChatTitle);
      }
    }
  }
  
  /**
   * Update chat title from DOM element (fallback)
   */
  public updateChatTitleFromDOM(): boolean {
    try {
      if (!this.currentChatId) return false;
      
      // Look for the chat title in the sidebar
      const titleElement = document.querySelector(`nav a[href="/c/${this.currentChatId}"] div[title]`);
      if (titleElement && titleElement.getAttribute('title')) {
        const newTitle = titleElement.getAttribute('title')!.trim();
        if (newTitle && newTitle !== 'New chat' && newTitle !== this.currentChatTitle) {
          this.updateChatTitle(newTitle);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Error updating chat title from DOM:', error);
      return false;
    }
  }
  
  /**
   * Process conversation list data from API
   * Replaces the need for ChatListScanner
   */
  public processConversationList(data: any): void {
    try {
      if (!data || !Array.isArray(data.items)) return;
      
      console.log(`📋 Processing ${data.items.length} conversations from API`);
      
      // Prepare data for batch save
      const conversations = data.items.map(chat => ({
        provider_chat_id: chat.id,
        title: chat.title || `Chat ${chat.id.substring(0, 8)}`,
        provider_name: 'ChatGPT'
      }));
      
      // Batch save to backend
      if (conversations.length > 0) {
        apiService.saveChatListBatch(conversations)
          .then(() => console.log(`✅ Saved ${conversations.length} conversations in batch`))
          .catch(error => console.error('❌ Error saving conversations:', error));
      }
      
      // Process each conversation locally
      for (const chat of data.items) {
        if (chat.id) {
          const chatInfo: ChatInfo = {
            id: chat.id,
            title: chat.title || `Chat ${chat.id.substring(0, 8)}`,
            create_time: chat.create_time,
            update_time: chat.update_time
          };
          
          // Add to our map
          this.conversations.set(chat.id, chatInfo);
          
          // If this is the current chat, update the title
          if (this.currentChatId === chat.id && chat.title !== this.currentChatTitle) {
            this.currentChatTitle = chat.title;
          }
        }
      }
      
      // Save updated conversations to storage
      this.saveConversationsToStorage();
    } catch (error) {
      console.error('❌ Error processing conversation list:', error);
    }
  }
  
  /**
   * Process a single conversation
   */
  public processConversation(chat: ChatInfo): void {
    // Add to tracked conversations
    this.conversations.set(chat.id, chat);
    
    // Save to backend
    this.saveChatToBackend(chat.id, chat.title);
    
    // If this is the current chat, update the title
    if (this.currentChatId === chat.id && chat.title !== this.currentChatTitle) {
      this.currentChatTitle = chat.title;
    }
  }
  
  /**
   * Save a chat to the backend
   */
  private saveChatToBackend(chatId: string, title: string): void {
    apiService.saveChatToBackend({
      chatId: chatId,
      chatTitle: title,
      providerName: 'ChatGPT'
    }).catch(error => {
      console.error('❌ Error saving chat to backend:', error);
    });
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
    this.conversations.clear();
    
    // Clear from storage
    chrome.storage.local.remove([this.storageKey]);
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Save conversations to storage before cleanup
    this.saveConversationsToStorage();
    
    console.log('✅ Conversation handler cleaned up');
  }
}

// Export a singleton instance
export const conversationHandler = ConversationHandler.getInstance();