// src/platforms/adapters/chatgpt.adapter.ts
import { BasePlatformAdapter } from './base.adapter';
import { chatGptConfig } from '../config/chatgpt.config';
import { Message, Conversation } from '@/types';
import { messageApi, SaveChatParams, SaveMessageParams } from '@/services/api/MessageApi';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';

export class ChatGptAdapter extends BasePlatformAdapter {
  constructor() {
    super(chatGptConfig);
  }
  
  extractUserMessage(requestBody: any): Message | null {
    try {
      const message = requestBody.messages?.find(
        (m: any) => m.author?.role === 'user' || m.role === 'user'
      );
      
      if (!message) return null;
      
      // Extract content
      let content = '';
      if (typeof message.content === 'object' && message.content?.parts) {
        content = message.content.parts.join('\n');
      } else if (typeof message.content === 'string') {
        content = message.content;
      }
      
      return {
        messageId: message.id || `user-${Date.now()}`,
        conversationId: requestBody.conversation_id || '',
        content,
        role: 'user',
        model: requestBody.model || 'unknown',
        timestamp: message.create_time ? message.create_time * 1000 : Date.now(),
        parent_message_provider_id: requestBody.parent_message_id
      };
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting user message', ErrorCode.PARSING_ERROR, error)
      );
      return null;
    }
  }
  
  extractAssistantMessage(data: any): Message | null {
    try {
      return {
        messageId: data.messageId,
        conversationId: data.conversationId || '',
        content: data.content,
        role: 'assistant',
        model: data.model || 'unknown',
        timestamp: data.createTime ? data.createTime * 1000 : Date.now(),
        thinkingTime: data.thinkingTime,
        parent_message_provider_id: data.parentMessageId
      };
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting assistant message', ErrorCode.PARSING_ERROR, error)
      );
      return null;
    }
  }
  
  extractConversation(data: any): Conversation | null {
    try {
      if (!data?.conversation_id) return null;
      
      return {
        chat_provider_id: data.conversation_id,
        title: data.title || 'Conversation',
        provider_name: 'ChatGPT'
      };
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting conversation', ErrorCode.PARSING_ERROR, error)
      );
      return null;
    }
  }
  
  extractMessagesFromConversation(conversation: any): Message[] {
    try {
      const messages: Message[] = [];
      
      if (conversation.mapping) {
        Object.entries(conversation.mapping).forEach(([messageId, node]: [string, any]) => {
          if (messageId === 'client-created-root') return;
          
          if (node.message?.author?.role) {
            const role = node.message.author.role;
            
            // Only extract user and assistant messages
            if (role === 'user' || role === 'assistant') {
              // Extract content
              let content = '';
              const contentType = node.message.content?.content_type;
              
              if (contentType === 'text') {
                content = Array.isArray(node.message.content.parts) 
                  ? node.message.content.parts.join('\n') 
                  : node.message.content.parts || '';
              }
              
              messages.push({
                messageId: messageId,
                conversationId: conversation.conversation_id,
                content,
                role,
                model: node.message.metadata?.model_slug || 'unknown',
                timestamp: node.message.create_time ? node.message.create_time * 1000 : Date.now(),
                parent_message_provider_id: node.parent
              });
            }
          }
        });
      }
      
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting messages from conversation', ErrorCode.PARSING_ERROR, error)
      );
      return [];
    }
  }
  
  async handleConversationList(responseData: any): Promise<void> {
    try {
      if (!responseData?.items || !Array.isArray(responseData.items)) {
        return Promise.resolve();
      }
      
      const processedChats: SaveChatParams[] = responseData.items.map(chat => ({
        chat_provider_id: chat.id,
        title: chat.title || 'Unnamed Conversation',
        provider_name: 'ChatGPT'
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
        new AppError('Error handling ChatGPT conversation list', ErrorCode.API_ERROR, error)
      );
      return Promise.resolve();
    }
  }
  
  async handleSpecificConversation(responseBody: any): Promise<void> {
    try {
      if (!responseBody?.conversation_id) return Promise.resolve();
      
      const conversation = this.extractConversation(responseBody);
      const messages = this.extractMessagesFromConversation(responseBody);
      
      if (conversation && messages.length > 0) {
        // Save the conversation and messages
        await messageApi.saveChat(conversation);
        await messageApi.saveMessageBatch(messages.map(msg => ({
          message_provider_id: msg.messageId,
          chat_provider_id: msg.conversationId,
          content: msg.content,
          role: msg.role,
          model: msg.model || 'unknown',
          created_at: msg.timestamp,
          parent_message_provider_id: msg.parent_message_provider_id
        })));
        
        // Emit event with conversation and messages
        document.dispatchEvent(new CustomEvent('jaydai:conversation-loaded', {
          detail: { conversation, messages }
        }));
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling specific conversation', ErrorCode.PARSING_ERROR, error)
      );
    }
    return Promise.resolve();
  }
  
  handleChatCompletion(event: CustomEvent): void {
    try {
      const { requestBody } = event.detail;
      if (!requestBody?.messages?.length) return;
      
      const message = this.extractUserMessage(requestBody);
      if (message) {
        // Emit event with extracted message
        document.dispatchEvent(new CustomEvent('jaydai:message-extracted', {
          detail: { message }
        }));
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling chat completion', ErrorCode.PARSING_ERROR, error)
      );
    }
  }
  
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
            detail: { message }
          }));
        }
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling assistant response', ErrorCode.PARSING_ERROR, error)
      );
    }
  }
  
  insertPrompt(content: string): boolean {
    if (!content) {
      console.error('No content to insert into ChatGPT');
      return false;
    }
    
    try {
      // Find the textarea using our config
      const textarea = document.querySelector(this.config.domSelectors.PROMPT_TEXTAREA);
      if (!textarea) {
        console.error('Could not find ChatGPT textarea element');
        return false;
      }
      
      // Normalize content (preserve all characters including quotes)
      const normalizedContent = content.replace(/\r\n/g, '\n');
      
      // Method 1: Standard textarea approach
      try {
        textarea.focus();
        
        if (textarea instanceof HTMLTextAreaElement) {
          // Set the value directly
          textarea.value = normalizedContent;
          
          // Trigger input event to notify React/ChatGPT of the change
          textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          
          // Position cursor at the end
          textarea.selectionStart = textarea.selectionEnd = normalizedContent.length;
          
          return true;
        }
        
        // For contenteditable divs
        if (textarea instanceof HTMLElement && textarea.isContentEditable) {
          // Properly escape HTML entities
          const escapeHTML = (str: string) => {
            return str
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
          };
          
          // Generate HTML paragraphs with proper escaping
          const paragraphs = normalizedContent.split('\n');
          const paragraphsHTML = paragraphs.map(p => 
            `<p>${escapeHTML(p) || '<br>'}</p>`
          ).join('');
          
          // Set content directly
          textarea.innerHTML = paragraphsHTML;
          
          // Trigger input event
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          
          return true;
        }
      } catch (e) {
        console.warn('Primary method failed for ChatGPT:', e);
      }
      
      // Method 2: document.execCommand approach
      try {
        textarea.focus();
        document.execCommand('insertText', false, normalizedContent);
        return true;
      } catch (e) {
        console.warn('Fallback method failed for ChatGPT:', e);
      }
      
      console.error('All insertion methods failed for ChatGPT');
      return false;
    } catch (error) {
      console.error('Error inserting content into ChatGPT:', error);
      return false;
    }
  }
}

export const chatGptAdapter = new ChatGptAdapter();