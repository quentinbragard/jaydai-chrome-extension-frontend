import { apiService } from '@/services/ApiService';

/**
 * Chat information extracted from DOM
 */
interface ChatListItem {
  id: string;
  title: string;
  timestamp?: string;
}

/**
 * Service to scan the ChatGPT sidebar for all existing chats
 * and save them in a single batch operation
 */
export class ChatListScanner {
  private static instance: ChatListScanner;
  private hasScanned: boolean = false;
  private isScanning: boolean = false;
  private scanAttempts: number = 0;
  private readonly MAX_SCAN_ATTEMPTS = 5;
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ChatListScanner {
    if (!ChatListScanner.instance) {
      ChatListScanner.instance = new ChatListScanner();
    }
    return ChatListScanner.instance;
  }
  
  /**
   * Scan the sidebar for all chat links and save them in batch
   */
  public async scanAndSaveChatList(force: boolean = false): Promise<boolean> {
    // Skip if already scanned and not forcing
    if (this.hasScanned && !force) {
      return true;
    }
    
    // Skip if already scanning
    if (this.isScanning) {
      return false;
    }
    
    this.isScanning = true;
    
    try {
      console.log('🔍 Scanning ChatGPT sidebar for all chats...');
      
      // Find all chat links in the sidebar
      const chatLinks = this.extractChatLinksFromSidebar();
      
      // If no chats found and we haven't exceeded max attempts, try again later
      if (chatLinks.length === 0 && this.scanAttempts < this.MAX_SCAN_ATTEMPTS) {
        this.scanAttempts++;
        console.log(`⏱️ No chats found, will retry scan (attempt ${this.scanAttempts}/${this.MAX_SCAN_ATTEMPTS})`);
        
        // Schedule another attempt with exponential backoff
        const delay = Math.pow(2, this.scanAttempts) * 1000;
        this.isScanning = false;
        
        setTimeout(() => {
          this.scanAndSaveChatList();
        }, delay);
        
        return false;
      }
      
      if (chatLinks.length === 0) {
        console.log('⚠️ No chats found after maximum attempts');
        this.hasScanned = true;
        return false;
      }
      
      console.log(`📝 Found ${chatLinks.length} chats in sidebar`);
      
      // Save all chats in a single batch operation
      await this.saveChatListBatch(chatLinks);
      
      this.hasScanned = true;
      console.log('✅ Chat list scan and save complete');
      return true;
    } catch (error) {
      console.error('❌ Error scanning chat list:', error);
      return false;
    } finally {
      this.isScanning = false;
    }
  }
  
  /**
   * Extract all chat links from the sidebar navigation
   */
  private extractChatLinksFromSidebar(): ChatListItem[] {
    try {
      // This selector needs to be updated based on ChatGPT's DOM structure
      // Look for link elements in the navigation sidebar
      const chatLinks = document.querySelectorAll('nav a[href^="/c/"]');
      console.log(`Found ${chatLinks.length} chat links in sidebar`);
      
      const chats: ChatListItem[] = [];
      
      // Process each link
      chatLinks.forEach((link) => {
        try {
          // Extract ID from href
          const href = link.getAttribute('href');
          if (!href) return;
          
          const match = href.match(/\/c\/([a-zA-Z0-9-]+)/);
          if (!match) return;
          
          const id = match[1];
          
          // Extract title
          let title = 'Untitled Chat';
          const titleElement = link.querySelector('div[title]');
          if (titleElement) {
            title = titleElement.getAttribute('title') || title;
          } else {
            // Try to get text content if no title attribute
            title = link.textContent?.trim() || title;
          }
          
          // Extract timestamp if available (this depends on ChatGPT's DOM structure)
          let timestamp = undefined;
          const timeElement = link.querySelector('div.text-xs');
          if (timeElement) {
            timestamp = timeElement.textContent?.trim();
          }
          
          chats.push({ id, title, timestamp });
        } catch (error) {
          console.error('❌ Error extracting chat link info:', error);
        }
      });
      
      return chats;
    } catch (error) {
      console.error('❌ Error extracting chat links from sidebar:', error);
      return [];
    }
  }
  
  /**
   * Save all chats in a single batch operation
   */
  private async saveChatListBatch(chatList: ChatListItem[]): Promise<boolean> {
    try {
      // Prepare batch data
      const chats = chatList.map(chat => ({
        provider_chat_id: chat.id,
        title: chat.title,
        provider_name: 'ChatGPT'
      }));
      
      console.log(`🔄 Saving ${chats.length} chats in batch...`);
      
      // Send batch save request
      const response = await apiService.saveChatListBatch(chats);
      
      if (response && response.success) {
        console.log(`✅ Chat list batch save successful: ${chats.length} chats`);
        return true;
      } else {
        console.error('❌ Chat list batch save failed:', response);
        return false;
      }
    } catch (error) {
      console.error('❌ Error in chat list batch save:', error);
      return false;
    }
  }
  
  /**
   * Reset the scan status
   */
  public resetScan(): void {
    this.hasScanned = false;
    this.scanAttempts = 0;
  }
}

// Export the singleton instance
export const chatListScanner = ChatListScanner.getInstance();