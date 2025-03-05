// src/services/chat/handlers/ConversationHandler.ts
// Handles conversation data from ChatGPT API
import { apiService } from '@/services/ApiService';
import { ChatInfo } from '../types';

/**
 * Service to handle conversation data from ChatGPT
 */
export class ConversationHandler {
  private currentChatId: string | null = null;
  private currentChatTitle: string = 'New Conversation';
  
  /**
   * Set the active conversation ID (e.g., from URL)
   */
  public setCurrentChatId(chatId: string | null): void {
    if (this.currentChatId !== chatId) {
      console.log(`📝 Chat ID changed: ${this.currentChatId} -> ${chatId}`);
      this.currentChatId = chatId;
      this.currentChatTitle = 'New Conversation';
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
    console.log(' conversationList Processing conversation list', JSON.stringify(data, null, 2));
    try {
      if (!data || !Array.isArray(data.items)) {
        return;
      }
      
      console.log(`📋 Processing conversation list: ${data.items.length} conversations`);
      
      // Process each conversation
      for (const chat of data.items) {
        if (chat.id) {
          this.processConversation({
            id: chat.id,
            title: chat.title || `Chat ${chat.id.substring(0, 8)}`,
            create_time: chat.create_time,
            update_time: chat.update_time
          });
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