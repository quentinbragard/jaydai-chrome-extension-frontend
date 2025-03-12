import { apiService } from '@/services/ApiService';
import { UrlChangeListener } from '@/services/UrlChangeListener';
import { batchSaveService } from '@/services/BatchSaveService';

/**
 * Interface for message data extracted from DOM
 */
interface ExtractedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
}

/**
 * Service to scan the current conversation page for all messages
 * and save them in batch
 */
export class ConversationContentScanner {
  private static instance: ConversationContentScanner;
  private processedConversations: Set<string> = new Set();
  private processedMessages: Set<string> = new Set();
  private isScanning: boolean = false;
  private scanTimeout: number | null = null;
  private scanAttempts: number = 0;
  private readonly MAX_SCAN_ATTEMPTS = 3;
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ConversationContentScanner {
    if (!ConversationContentScanner.instance) {
      ConversationContentScanner.instance = new ConversationContentScanner();
    }
    return ConversationContentScanner.instance;
  }
  
  /**
   * Scan the current conversation page for all messages
   */
  public scanConversationContent(force: boolean = false): void {
    // Clear any existing timeout
    if (this.scanTimeout !== null) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    
    // Get current chat ID from URL
    const chatId = UrlChangeListener.extractChatIdFromUrl(window.location.href);
    if (!chatId) {
      console.log('⚠️ No chat ID in URL, skipping message scan');
      return;
    }
    
    // Skip if already processed this conversation and not forcing
    if (!force && this.processedConversations.has(chatId)) {
      console.log(`⏭️ Already scanned conversation ${chatId}, skipping`);
      return;
    }
    
    // Skip if already scanning
    if (this.isScanning) {
      return;
    }
    
    this.isScanning = true;
    this.scanAttempts = 0;
    
    // Start the scanning process
    this.executeContentScan(chatId);
  }
  
  /**
   * Execute the content scan with retry logic
   */
  private executeContentScan(chatId: string): void {
    try {
      console.log(`🔍 Scanning conversation ${chatId} for messages...`);
      
      // Extract all messages from the DOM
      const messages = this.extractMessagesFromDOM(chatId);
      
      // If no messages found and we haven't exceeded max attempts, retry
      if (messages.length === 0 && this.scanAttempts < this.MAX_SCAN_ATTEMPTS) {
        this.scanAttempts++;
        console.log(`⏱️ No messages found, will retry scan (attempt ${this.scanAttempts}/${this.MAX_SCAN_ATTEMPTS})`);
        
        // Schedule another attempt with exponential backoff
        const delay = Math.pow(2, this.scanAttempts) * 1000;
        this.isScanning = false;
        
        this.scanTimeout = window.setTimeout(() => {
          this.executeContentScan(chatId);
        }, delay);
        
        return;
      }
      
      if (messages.length === 0) {
        console.log('⚠️ No messages found after maximum attempts');
        this.processedConversations.add(chatId);
        this.isScanning = false;
        return;
      }
      
      console.log(`📝 Found ${messages.length} messages in conversation ${chatId}`);
      
      // Queue all messages for batch saving
      messages.forEach(message => {
        if (!this.processedMessages.has(message.id)) {
          this.processedMessages.add(message.id);
          
          batchSaveService.queueMessage({
            messageId: message.id,
            content: message.content,
            type: message.role,
            timestamp: message.timestamp,
            conversationId: chatId,
            model: message.model || 'unknown'
          });
        }
      });
      
      // Force save the batch
      batchSaveService.forceSave();
      
      // Mark this conversation as processed
      this.processedConversations.add(chatId);
      console.log(`✅ Scanned and queued ${messages.length} messages for conversation ${chatId}`);
    } catch (error) {
      console.error('❌ Error scanning conversation content:', error);
    } finally {
      this.isScanning = false;
    }
  }
  
  /**
   * Extract all messages from the DOM
   */
  private extractMessagesFromDOM(chatId: string): ExtractedMessage[] {
    try {
      // Use the selector based on the HTML structure you provided
      const messageElements = document.querySelectorAll('div[data-message-author-role][data-message-id]');
      console.log(`Found ${messageElements.length} message elements in DOM`);
      
      const messages: ExtractedMessage[] = [];
      
      // Process each message element
      messageElements.forEach((element) => {
        try {
          const messageId = element.getAttribute('data-message-id');
          const role = element.getAttribute('data-message-author-role');
          
          // Skip if missing required attributes
          if (!messageId || !role || (role !== 'user' && role !== 'assistant' && role !== 'system')) {
            return;
          }
          
          // Skip if already processed
          if (this.processedMessages.has(messageId)) {
            return;
          }
          
          // Extract message content based on role
          let content = '';
          
          if (role === 'user') {
            // For user messages, look for div with whitespace-pre-wrap class
            const contentElement = element.querySelector('div.whitespace-pre-wrap');
            if (contentElement) {
              content = contentElement.textContent?.trim() || '';
            }
          } else if (role === 'assistant') {
            // For assistant messages, look for markdown prose element
            const contentElement = element.querySelector('div.markdown.prose');
            if (contentElement) {
              content = contentElement.textContent?.trim() || '';
            }
          }
          
          // Skip if empty content
          if (!content) {
            return;
          }
          
          // Extract model if available
          let model = undefined;
          const modelSlug = element.getAttribute('data-message-model-slug');
          if (modelSlug) {
            model = modelSlug;
          }
          
          // Create message object
          messages.push({
            id: messageId,
            role: role as 'user' | 'assistant' | 'system',
            content,
            timestamp: Date.now(),
            model
          });
        } catch (error) {
          console.error('❌ Error extracting message data:', error);
        }
      });
      
      return messages;
    } catch (error) {
      console.error('❌ Error extracting messages from DOM:', error);
      return [];
    }
  }
  
  /**
   * Reset scanner for a specific conversation
   */
  public resetConversation(chatId: string): void {
    if (chatId && this.processedConversations.has(chatId)) {
      this.processedConversations.delete(chatId);
    }
  }
  
  /**
   * Reset entire scanner state
   */
  public reset(): void {
    this.processedConversations.clear();
    
    // Don't clear processedMessages to avoid duplicates
    // this.processedMessages.clear();
    
    if (this.scanTimeout !== null) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    
    this.isScanning = false;
    this.scanAttempts = 0;
  }
}

// Export the singleton instance
export const conversationContentScanner = ConversationContentScanner.getInstance();