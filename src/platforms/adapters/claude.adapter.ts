
// src/platforms/adapters/claude.adapter.ts
import { BasePlatformAdapter } from './base.adapter';
import { claudeConfig } from '../config/claude.config';
import { Message, Conversation } from '@/types';
import { messageApi } from '@/services/api/MessageApi';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { chatService } from '@/services/network/ChatService';

export class ClaudeAdapter extends BasePlatformAdapter {
  constructor() {
    super(claudeConfig);
  }
  
  /**
   * Get the current Claude model from the UI
   */
  getModelFromUI(): string {
    try {
      // Find the model selector button that contains the model name
      const modelSelector = document.querySelector('[data-testid="model-selector-dropdown"]');
      
      if (modelSelector) {
        // Extract text content and clean it up
        const modelText = modelSelector.textContent?.trim() || '';
        
        // Extract just the model name (e.g., "3.7 Sonnet" from "Claude 3.7 Sonnet")
        if (modelText.includes('Claude')) {
          const modelMatch = modelText.match(/Claude\s+([\d\.]+\s+\w+)/i);
          if (modelMatch && modelMatch[1]) {
            return `claude-${modelMatch[1].toLowerCase().replace(/\s+/g, '-')}`;
          }
        }
        
        // If specific pattern isn't found but there's text, return it
        if (modelText) {
          return modelText.toLowerCase().replace(/\s+/g, '-');
        }
      }
      
      // Default fallback
      return 'claude';
    } catch (error) {
      console.warn('Failed to detect Claude model from UI:', error);
      return 'claude';
    }
  }
  
  /**
   * Extract user message from request body
   */
  extractUserMessage(requestBody: any, url?: string): Message | null {
    try {
      // Claude has a different API structure
      const content = requestBody.prompt || '';
      const parentMessageProviderId = requestBody.parent_message_uuid || null;
      
      // Extract conversation ID from URL if not in body
      let conversationId = requestBody.conversation_id || '';
      if (!conversationId && url) {
        const match = url.match(/\/chat_conversations\/([a-f0-9-]+)/);
        if (match && match[1]) {
          conversationId = match[1];
        }
      }
      
      // Get model from UI if possible, fall back to request or default
      const model = this.getModelFromUI() || requestBody.model || 'claude';
      
      return {
        messageId: `user-${Date.now()}`, // Claude doesn't provide message ID in request
        conversationId: conversationId,
        content,
        role: 'user',
        model,
        timestamp: Date.now(),
        parent_message_provider_id: parentMessageProviderId
      };
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting user message from Claude', ErrorCode.PARSING_ERROR, error)
      );
      return null;
    }
  }
  
  /**
   * Extract assistant message from response data
   */
  extractAssistantMessage(data: any): Message | null {
    try {
      // Get model from UI if possible, or from data
      const model = this.getModelFromUI() || data.model || 'claude';
      
      return {
        messageId: data.messageId || data.uuid || `claude-${Date.now()}`,
        conversationId: data.conversationId || data.chat_id || '',
        content: data.content || data.text || '',
        role: 'assistant',
        model,
        timestamp: data.createTime ? data.createTime * 1000 : Date.now(),
        thinkingTime: data.thinkingTime,
        parent_message_provider_id: data.parentMessageId || data.parent_message_uuid
      };
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting assistant message from Claude', ErrorCode.PARSING_ERROR, error)
      );
      return null;
    }
  }
  
  /**
   * Extract conversation from response data
   */
  extractConversation(data: any): Conversation | null {
    try {
      if (!data?.uuid) return null;
      
      return {
        chat_provider_id: data.uuid,
        title: data.name || 'Conversation',
        provider_name: 'Claude'
      };
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting conversation from Claude', ErrorCode.PARSING_ERROR, error)
      );
      return null;
    }
  }
  
  /**
   * Extract messages from conversation data
   */
  extractMessagesFromConversation(responseBody: any): Message[] {
    try {
      const messages: Message[] = [];
      
      // Get model from UI if possible, or from response
      const defaultModel = this.getModelFromUI() || responseBody.model || 'claude';
      
      if (responseBody.chat_messages && Array.isArray(responseBody.chat_messages)) {
        // Claude format has an array of chat_messages
        responseBody.chat_messages.forEach((message: any) => {
          if (!message) return;
          
          // Get the message role (sender)
          const role = message.sender === 'human' ? 'user' : message.sender;
          
          // Only process user and assistant messages
          if (role === 'user' || role === 'assistant') {
            // Extract content - Claude stores it in content array
            let content = '';
            
            if (message.content && Array.isArray(message.content)) {
              // Combine all text content parts
              content = message.content
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text || '')
                .join('\n');
            } else if (message.text) {
              // Fallback to text field if available
              content = message.text;
            }
            
            messages.push({
              messageId: message.uuid, // Use message UUID
              conversationId: responseBody.uuid, // Conversation UUID
              content,
              role,
              model: defaultModel, // Use model from UI or response
              timestamp: new Date(message.created_at).getTime(), // Convert ISO timestamp to milliseconds
              parent_message_provider_id: message.parent_message_uuid // Parent message reference
            });
          }
        });
      }
      
      // Sort messages by index to ensure correct order
      return messages.sort((a, b) => {
        // Use the index property from the original messages if available
        const indexA = responseBody.chat_messages.find(
          (m: any) => m.uuid === a.messageId
        )?.index || 0;
        const indexB = responseBody.chat_messages.find(
          (m: any) => m.uuid === b.messageId
        )?.index || 0;
        return indexA - indexB;
      });
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting messages from Claude conversation', ErrorCode.PARSING_ERROR, error)
      );
      return [];
    }
  }
  
  /**
   * Handle conversation list event
   */
  async handleConversationList(conversationItems: any): Promise<void> {
    try {
      if (!Array.isArray(conversationItems)) {
        return Promise.resolve();
      }
      
      const processedChats = conversationItems.map(chat => ({
        chat_provider_id: chat.uuid,
        title: chat.name || 'Unnamed Conversation',
        provider_name: 'Claude'
      })).filter(chat => 
        chat.chat_provider_id && 
        chat.chat_provider_id.trim() !== ''
      );
      
      if (processedChats.length > 0) {
        await messageApi.saveChatBatch(processedChats);
      }
      
      return Promise.resolve();
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling Claude conversation list', ErrorCode.API_ERROR, error)
      );
      return Promise.resolve();
    }
  }
  
  /**
   * Handle specific conversation event
   */
  async handleSpecificConversation(responseBody: any): Promise<void> {
    try {
      if (!responseBody?.uuid) {
        console.warn('Missing conversation UUID in Claude response');
        return Promise.resolve();
      }
      
      const conversation = this.extractConversation(responseBody);
      const messages = this.extractMessagesFromConversation(responseBody);
      
      // Only save if we have valid data
      if (conversation && messages.length > 0) {
        // Save the chat first
        await messageApi.saveChat(conversation);
        
        // Then save all messages
        await messageApi.saveMessageBatch(messages.map(msg => ({
          message_provider_id: msg.messageId,
          chat_provider_id: msg.conversationId,
          content: msg.content,
          role: msg.role,
          model: msg.model || 'unknown',
          created_at: msg.timestamp,
          parent_message_provider_id: msg.parent_message_provider_id
        })));
        
        // Update the current conversation ID
        chatService.setCurrentConversationId(conversation.chat_provider_id);
        
        // Emit event with conversation and messages
        document.dispatchEvent(new CustomEvent('jaydai:conversation-loaded', {
          detail: { conversation, messages }
        }));
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling Claude specific conversation', ErrorCode.PARSING_ERROR, error)
      );
    }
    return Promise.resolve();
  }
  
  /**
   * Handle chat completion event
   */
  handleChatCompletion(event: CustomEvent): void {
    try {
      const { requestBody, url } = event.detail;
      
      const message = this.extractUserMessage(requestBody, url);
      if (message) {
        // Emit event with extracted message
        document.dispatchEvent(new CustomEvent('jaydai:message-extracted', {
          detail: { message, platform: this.name }
        }));
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling Claude chat completion', ErrorCode.PARSING_ERROR, error)
      );
    }
  }
  
  /**
   * Handle assistant response event
   */
  handleAssistantResponse(event: CustomEvent): void {
    try {
      const data = event.detail;
      if (!data.messageId || !data.content) return;
      
      // Only process complete messages
      if (data.isComplete) {
        const message = this.extractAssistantMessage(data);
        if (message) {
          // Emit event with extracted message
          document.dispatchEvent(new CustomEvent('jaydai:message-extracted', {
            detail: { message, platform: this.name }
          }));
        }
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling Claude assistant response', ErrorCode.PARSING_ERROR, error)
      );
    }
  }
  
  /**
   * Insert content into Claude's input area
   */
  insertPrompt(content: string): boolean {
    if (!content) {
      console.error('No content to insert into Claude');
      return false;
    }
    
    try {
      // Find Claude's input area using our config
      const inputArea = document.querySelector(this.config.domSelectors.PROMPT_TEXTAREA);
      
      if (!inputArea) {
        console.error('Could not find Claude input area');
        return false;
      }
      
      // Find the contentEditable div within the input area
      const contentEditableDiv = inputArea.querySelector('[contenteditable="true"]') || inputArea;
      
      if (!contentEditableDiv) {
        console.error('Could not find contentEditable element in Claude input area');
        return false;
      }
      
      // Normalize the content - preserve all newlines and formatting
      const normalizedContent = content.replace(/\r\n/g, '\n');
      
      // Method 1: Try setting innerHTML with paragraph tags for each line
      try {
        // Focus the contentEditable area
        contentEditableDiv.focus();
        
        // Convert content to HTML paragraphs
        const paragraphs = normalizedContent.split('\n');
        const htmlContent = paragraphs.map(paragraph => {
          // Escape HTML entities in the paragraph
          const escapedParagraph = paragraph
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
            
          return paragraph ? `<p>${escapedParagraph}</p>` : '<p><br></p>';
        }).join('');
        
        // Set the innerHTML
        contentEditableDiv.innerHTML = htmlContent;
        
        // Dispatch input event to notify Claude
        contentEditableDiv.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Position cursor at the end
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(contentEditableDiv);
        range.collapse(false); // Collapse to the end
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        return true;
      } catch (error) {
        console.warn('Method 1 (innerHTML) failed for Claude:', error);
        // Continue to next method
      }
      
      // Method 2: Use document.execCommand
      try {
        contentEditableDiv.focus();
        
        // Clear existing content
        contentEditableDiv.innerHTML = '';
        
        // Insert text using execCommand
        document.execCommand('insertText', false, normalizedContent);
        
        return true;
      } catch (error) {
        console.warn('Method 2 (execCommand) failed for Claude:', error);
        // Continue to next method
      }
      
      // Method 3: Try clipboard approach
      try {
        contentEditableDiv.focus();
        
        // Use clipboard API
        return navigator.clipboard.writeText(normalizedContent)
          .then(() => {
            document.execCommand('paste');
            return true;
          })
          .catch(err => {
            
            // Final fallback - direct textContent manipulation
            contentEditableDiv.textContent = normalizedContent;
            contentEditableDiv.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          });
      } catch (error) {
        console.error('All insertion methods failed for Claude:', error);
        return false;
      }
    } catch (error) {
      console.error('Error inserting content into Claude:', error);
      return false;
    }
  }
  
  /**
   * Check if platform supports streaming
   */
  supportsStreaming(): boolean {
    return false; // Claude doesn't use our streaming approach
  }
  
  /**
   * Process streaming response - not applicable for Claude
   */
  async processStreamingResponse(response: Response, requestBody: any): Promise<void> {
    // As you mentioned, Claude doesn't need streaming processing
    // We'll get the conversation data after the response is complete
    return Promise.resolve();
  }
}

export const claudeAdapter = new ClaudeAdapter();