// src/platforms/adapters/chatgpt.adapter.ts
import { BasePlatformAdapter } from './base.adapter';
import { chatGptConfig } from '../config/chatgpt.config';
import { Message, Conversation } from '@/types';
import { messageApi, SaveChatParams, SaveMessageParams } from '@/services/api/MessageApi';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { chatService } from '@/services/network/ChatService';

export class ChatGptAdapter extends BasePlatformAdapter {
  constructor() {
    super(chatGptConfig);
  }
  
  /**
   * Extract user message from request body
   */
  extractUserMessage(requestBody: any, url?: string): Message | null {
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
      
      const conversationId = requestBody.conversation_id || '';
      
      return {
        messageId: message.id || `user-${Date.now()}`,
        conversationId,
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
  
  /**
   * Extract assistant message from response data
   */
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
  
  /**
   * Extract conversation data
   */
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
  
  /**
   * Extract messages from conversation data
   */
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
  
  /**
   * Handle conversation list event
   */
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
  
  /**
   * Handle specific conversation event
   */
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
        
        // Update the current conversation ID if needed
        chatService.setCurrentConversationId(conversation.chat_provider_id);
        
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
  
  /**
   * Handle chat completion event
   */
  handleChatCompletion(event: CustomEvent): void {
    try {
      const { requestBody } = event.detail;
      if (!requestBody?.messages?.length) return;
      
      const message = this.extractUserMessage(requestBody);
      if (message) {
        // Emit event with extracted message
        document.dispatchEvent(new CustomEvent('jaydai:message-extracted', {
          detail: { message, platform: this.name }
        }));
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling chat completion', ErrorCode.PARSING_ERROR, error)
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
        new AppError('Error handling assistant response', ErrorCode.PARSING_ERROR, error)
      );
    }
  }
  
  /**
   * Insert content into ChatGPT textarea
   */
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
  
  /**
   * Check if platform supports streaming
   */
  supportsStreaming(): boolean {
    return true; // ChatGPT supports streaming
  }

  /**
   * Get model from UI element on the page
   */
  getModelFromUI(): string {
    try {
      // Look for model info in the UI
      const modelElement = document.querySelector('[aria-label="Model selector"]') || 
                           document.querySelector('[data-testid="model-selector"]');
      
      if (modelElement) {
        const modelText = modelElement.textContent || '';
        // Extract model name (e.g. "GPT-4", "GPT-3.5")
        const modelMatch = modelText.match(/(GPT-\d+(\.\d+)?)/i);
        if (modelMatch && modelMatch[1]) {
          return modelMatch[1].toLowerCase();
        }
      }
      
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * Process streaming response
   */
  async processStreamingResponse(response: Response, requestBody: any): Promise<void> {
    if (!response || !response.body) {
      console.error('Invalid response object for streaming');
      return;
    }
    
    const clonedResponse = response.clone();
    const reader = clonedResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    // Data for current assistant response
    let assistantData = {
      messageId: null,
      conversationId: null,
      model: null,
      content: '',
      isComplete: false,
      createTime: null,
      parentMessageId: null
    };
    
    // Array to track thinking steps
    let thinkingSteps = [];
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete events
        let eventEndIndex;
        while ((eventEndIndex = buffer.indexOf('\n\n')) !== -1) {
          const eventString = buffer.substring(0, eventEndIndex + 2);
          buffer = buffer.substring(eventEndIndex + 2);
          
          // Parse event
          const eventMatch = eventString.match(/^event: ([^\n]+)/);
          const dataMatch = eventString.match(/data: (.+)$/m);
          
          if (!dataMatch) continue;
          
          const eventType = eventMatch ? eventMatch[1] : 'unknown';

          // Handle special "[DONE]" message 
          if (dataMatch[1] === '[DONE]') {
            if (assistantData.messageId && assistantData.content.length > 0) {
              assistantData.isComplete = true;
              this.dispatchAssistantResponse(assistantData);
            }
            continue; // Skip JSON parsing for this message
          }
          
          // Parse JSON data (only for non-[DONE] messages)
          try {
            const data = JSON.parse(dataMatch[1]);
            
            // Process message stream complete event
            if (data.type === "message_stream_complete") {
              if (assistantData.messageId) {
                assistantData.isComplete = true;
                this.dispatchAssistantResponse(assistantData);
              }
              continue;
            }
            
            // Process the data
            const result = this.processStreamData(data, assistantData, thinkingSteps);
            assistantData = result.assistantData;
            thinkingSteps = result.thinkingSteps;
            
            // Send periodic updates for long responses
            if (assistantData.messageId && 
                assistantData.content.length > 0 && 
                assistantData.content.length % 500 === 0) {
              this.dispatchAssistantResponse({
                ...assistantData,
                isComplete: false
              });
            }
          } catch (error) {
            console.error('Error parsing stream data:', error);
          }
        }
      }
      
      // Final check: If we have message content but never got a completion signal
      if (assistantData.messageId && assistantData.content.length > 0 && !assistantData.isComplete) {
        assistantData.isComplete = true;
        this.dispatchAssistantResponse(assistantData);
      }
    } catch (error) {
      console.error('Error processing stream:', error);
      
      // Try to salvage partial response in case of errors
      if (assistantData.messageId && assistantData.content.length > 0) {
        assistantData.isComplete = true;
        this.dispatchAssistantResponse(assistantData);
      }
    }
  }

  /**
   * Helper method to dispatch assistant response events
   */
  private dispatchAssistantResponse(assistantData: any): void {
    document.dispatchEvent(new CustomEvent('jaydai:assistant-response', {
      detail: { 
        ...assistantData,
        platform: this.name 
      }
    }));
  }

  /**
   * Process individual stream data chunks
   */
  private processStreamData(data: any, assistantData: any, thinkingSteps: any[]): { 
    assistantData: any;
    thinkingSteps: any[];
  } {
    // Initialize assistantData if needed
    if (!assistantData) {
      assistantData = {
        messageId: null,
        conversationId: null,
        model: null,
        content: '',
        isComplete: false,
        currentThinkingStep: null,
        createTime: null,
        parentMessageId: null
      };
    }
    
    // Initialize thinkingSteps if needed
    if (!thinkingSteps) {
      thinkingSteps = [];
    }

    // Handle message stream complete marker
    if (data.type === "message_stream_complete") {
      assistantData.isComplete = true;
      assistantData.conversationId = data.conversation_id || assistantData.conversationId;
      return { assistantData, thinkingSteps };
    }
    
    // Handle initial message creation with 'add' operation
    if (data.v?.message) {
      // Extract message metadata
      assistantData.messageId = data.v.message.id;
      assistantData.conversationId = data.v.conversation_id;
      assistantData.model = data.v.message.metadata?.model_slug || null;
      
      // Extract create_time if available
      if (data.v.message.create_time) {
        assistantData.createTime = data.v.message.create_time;
      }
      
      // Extract parent_message_provider_id if available in metadata
      if (data.v.message.metadata?.parent_id) {
        assistantData.parentMessageId = data.v.message.metadata.parent_id;
      }
      
      // Check if this is a thinking step (tool) or the final answer (assistant)
      const role = data.v.message.author?.role;
      
      // Create a new thinking step entry
      const newStep = {
        id: data.v.message.id,
        role: role,
        content: '',
        createTime: data.v.message.create_time,
        parentMessageId: data.v.message.metadata?.parent_id,
        initialText: data.v.message.metadata?.initial_text || '',
        finishedText: data.v.message.metadata?.finished_text || ''
      };
      
      thinkingSteps.push(newStep);
      assistantData.currentThinkingStep = thinkingSteps.length - 1;
      
      // If this is the assistant's final message, set it as the main content
      if (role === 'assistant') {
        assistantData.content = '';
      }
      
      return { assistantData, thinkingSteps };
    }
    
    // Handle content append operations
    if (data.o === "append" && data.p === "/message/content/parts/0" && data.v) {
      if (assistantData.currentThinkingStep !== null && 
          assistantData.currentThinkingStep < thinkingSteps.length) {
        thinkingSteps[assistantData.currentThinkingStep].content += data.v;
        
        if (thinkingSteps[assistantData.currentThinkingStep].role === 'assistant') {
          assistantData.content += data.v;
        }
      }
      return { assistantData, thinkingSteps };
    }
    
    // Handle string content with no operation
    if (typeof data.v === "string" && !data.o) {
      if (assistantData.currentThinkingStep !== null && 
          assistantData.currentThinkingStep < thinkingSteps.length) {
        thinkingSteps[assistantData.currentThinkingStep].content += data.v;
        
        if (thinkingSteps[assistantData.currentThinkingStep].role === 'assistant') {
          assistantData.content += data.v;
        }
      }
      return { assistantData, thinkingSteps };
    }
    
    // Handle patch operations
    if (data.o === "patch" && Array.isArray(data.v)) {
      for (const patch of data.v) {
        // Check for metadata changes
        if (patch.p === "/message/metadata/finished_text" && 
            assistantData.currentThinkingStep !== null) {
          thinkingSteps[assistantData.currentThinkingStep].finishedText = patch.v;
        }
        
        // Check for content append in a patch
        if (patch.p === "/message/content/parts/0" && patch.o === "append" && patch.v) {
          if (assistantData.currentThinkingStep !== null && 
              assistantData.currentThinkingStep < thinkingSteps.length) {
            thinkingSteps[assistantData.currentThinkingStep].content += patch.v;
            
            if (thinkingSteps[assistantData.currentThinkingStep].role === 'assistant') {
              assistantData.content += patch.v;
            }
          }
        }
      }
      
      // Ensure assistant content isn't empty
      if (assistantData.content === "" && thinkingSteps.length > 0) {
        assistantData.content = thinkingSteps[thinkingSteps.length - 1].content;
      }
      
      return { assistantData, thinkingSteps };
    }
    
    // Return current state unchanged for any unhandled data format
    return { assistantData, thinkingSteps };
  }
}

export const chatGptAdapter = new ChatGptAdapter();