// src/services/chat/handlers/ConversationHandler.ts
// Handles conversation data from ChatGPT API
import { apiService } from '@/services/ApiService';
import { ChatInfo } from '../types';
import { specificConversationHandler } from './SpecificConversationHandler';

/**
 * Service to handle conversation data from ChatGPT
 */
export class ConversationHandler {
  private currentChatId: string | null = null;
  private currentChatTitle: string = 'No title';
  private fetchInProgress: boolean = false;
  
  /**
   * Set the active conversation ID (e.g., from URL)
   */
  public setCurrentChatId(chatId: string | null): void {
    if (this.currentChatId !== chatId) {
      console.log(`📝 Chat ID changed: ${this.currentChatId} -> ${chatId}`);
      this.currentChatId = chatId;
      const currentChatTitleElement = document.querySelector(`a[href="/c/${chatId}"]`);
      console.log(`📝 Current chat title element: ${currentChatTitleElement}`);
      this.currentChatTitle = currentChatTitleElement?.textContent || 'No title';
      console.log(`📝 Chat title: ${this.currentChatTitle}`);
      
      // Proactively fetch conversation data if we have a valid chat ID
      //if (chatId) {
      //  this.fetchConversationData(chatId);
      //}
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
    if (this.fetchInProgress) {
      console.log(`🔄 Fetch already in progress for chat: ${chatId}`);
      return;
    }
    
    this.fetchInProgress = true;
    console.log(`🔍 Proactively fetching conversation data for chat: ${chatId}`);
    
    try {
      // Use the fetch API directly with the current user's credentials
      const conversationUrl = `https://chatgpt.com/backend-api/conversation/${chatId}`;
      console.log(`📡 Requesting: ${conversationUrl}`);
      
      const response = await fetch(conversationUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // This ensures we use the browser's cookies/authentication
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Successfully fetched conversation data for: ${chatId}`);
      console.log(`📊 Response structure:`, Object.keys(data));
      console.log(`📄 Title: ${data.title || 'No title'}`);
      console.log(`📄 Message count: ${Object.keys(data.mapping || {}).length}`);
      
      // Update the conversation title
      if (data.title) {
        this.updateChatTitle(data.title);
      }
      
      // Process the fetched conversation data using our handler
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
      console.log(`📝 Chat title updated: ${this.currentChatTitle}`);
      
      if (this.currentChatId) {
        this.saveChatToBackend(this.currentChatId, this.currentChatTitle);
      }
    }
  }
  
  /**
   * Save the current conversation to the backend
   */
  public saveCurrentChatToBackend(): void {
    if (this.currentChatId) {
      this.saveChatToBackend(this.currentChatId, this.currentChatTitle);
    }
  }
  
  /**
   * Update chat title from DOM element
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
   */
  public processConversationList(data: any): void {
    console.log('📋 Processing conversation list data');
    try {
      if (!data || !Array.isArray(data.items)) {
        console.log('⚠️ Invalid conversation list data format', data);
        return;
      }
      
      console.log(`📋 Processing ${data.items.length} conversations`);
      
      // Process each conversation
      for (const chat of data.items) {
        if (chat.id) {
          this.processConversation({
            id: chat.id,
            title: chat.title || `Chat ${chat.id.substring(0, 8)}`,
            create_time: chat.create_time,
            update_time: chat.update_time
          });
          
          // Also fetch detailed data for each conversation
          // Commenting this out for now as it could create too many simultaneous requests
          // this.fetchConversationData(chat.id);
        }
      }
    } catch (error) {
      console.error('❌ Error processing conversation list:', error);
    }
  }
  
  /**
   * Process a single conversation
   */
  public processConversation(chat: ChatInfo): void {
    // Save to backend
    this.saveChatToBackend(chat.id, chat.title);
    
    // If this is the current chat, update the title
    if (this.currentChatId === chat.id && chat.title !== this.currentChatTitle) {
      this.currentChatTitle = chat.title;
      console.log(`📝 Chat title updated from API: ${this.currentChatTitle}`);
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
}

// Export a singleton instance
export const conversationHandler = new ConversationHandler();