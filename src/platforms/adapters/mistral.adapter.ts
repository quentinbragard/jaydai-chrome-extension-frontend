import { BasePlatformAdapter } from './base.adapter';
import { mistralConfig } from '../config/mistral.config';
import { Message, Conversation } from '@/types';
import { messageApi } from '@/services/api/MessageApi';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { chatService } from '@/services/network/ChatService';

export class MistralAdapter extends BasePlatformAdapter {
  constructor() {
    super(mistralConfig);
  }

  extractUserMessage(requestBody: any): Message | null {
    try {
      let messageId = requestBody?.messageId || `user-${Date.now()}`;
      let conversationId = requestBody?.chatId || '';
      let content = '';
      if (requestBody?.mode === "start") {
          const firstSelected = document.querySelector('div.select-text span');
          const domText = firstSelected?.textContent?.trim();
          if (domText) {
            content = domText;
          }
        return {
          messageId,
          conversationId,
          content: content,
          role: 'user',
          model: requestBody.model || 'mistral',
          timestamp: Date.now(),
          parent_message_provider_id: 'start',
        };
      } else {
      let parentMessageId = requestBody?.parentMessageId;

      // First message of a conversation is wrapped under the "0.json" key
      if (requestBody["0"]?.json) {
        const json = requestBody["0"].json;
        if (Array.isArray(json.content)) {
          content = json.content.map((c: any) => c.text || '').join('\n');
        }
        messageId = json.messageId || messageId;
        conversationId = json.chatId || conversationId;
        parentMessageId = json.parentMessageId || parentMessageId;
      } else if (requestBody.messageInput) {
        // Subsequent messages use the messageInput array
        if (Array.isArray(requestBody.messageInput)) {
          content = requestBody.messageInput.map((m: any) => m.text || '').join('\n');
        } else {
          content = requestBody.messageInput;
        }
      }
         // In "start" mode the request body contains the placeholder "start"
      // instead of the actual user message. Retrieve the real text from the DOM
      

      return {
        messageId,
        conversationId,
        content,
        role: 'user',
        model: requestBody?.model || 'mistral',
        timestamp: Date.now(),
        parent_message_provider_id: parentMessageId,
        };
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting user message from Mistral', ErrorCode.PARSING_ERROR, error),
      );
      return null;
    }
  }

  extractAssistantMessage(data: any): Message | null {
    try {
      let trimmedContent = data.content;
      console.log('trimmedContent----->', trimmedContent);
      if (data.content && data.content.startsWith('safe') && data.content.endsWith('null')) {
       trimmedContent = data.content.slice(4, -4);
      }
      return {
        messageId: data.messageId || `mistral-${Date.now()}`,
        conversationId: data.chatId || '',
        content: trimmedContent || '',
        role: 'assistant',
        model: data.model || 'mistral',
        timestamp: Date.now(),
        thinkingTime: data.thinkingTime,
        parent_message_provider_id: data.parentMessageId,
      };
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting assistant message from Mistral', ErrorCode.PARSING_ERROR, error),
      );
      return null;
    }
  }

  extractConversation(data: any): Conversation | null {
    try {
      if (!data?.chatId) return null;
      return {
        chat_provider_id: data.chatId,
        title: data.title || 'Conversation',
        provider_name: 'Mistral',
      } as any;
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting conversation from Mistral', ErrorCode.PARSING_ERROR, error),
      );
      return null;
    }
  }

  extractMessagesFromConversation(_data: any): Message[] {
    return [];
  }

  async handleConversationList(_data: any): Promise<void> {
    return Promise.resolve();
  }

  async handleSpecificConversation(_data: any): Promise<void> {
    return Promise.resolve();
  }

  handleChatCompletion(event: CustomEvent): void {
    try {
      const { requestBody } = event.detail;
      const message = this.extractUserMessage(requestBody);
      if (message) {
        document.dispatchEvent(
          new CustomEvent('jaydai:message-extracted', { detail: { message, platform: this.name } }),
        );
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling chat completion', ErrorCode.PARSING_ERROR, error),
      );
    }
  }

  handleAssistantResponse(event: CustomEvent): void {
    try {
      const data = event.detail;
      if (!data) return;
      if (data.isComplete) {
        const message = this.extractAssistantMessage(data);
        if (message) {
          document.dispatchEvent(
            new CustomEvent('jaydai:message-extracted', { detail: { message, platform: this.name, parentMessageId: data.parentMessageId } }),
          );
        }
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling assistant response', ErrorCode.PARSING_ERROR, error),
      );
    }
  }

  insertPrompt(content: string): boolean {
    if (!content) {
      console.error('No content to insert into Mistral');
      return false;
    }
    
    try {
      // Find Mistral's editor element (textarea or ProseMirror)
      const editor = document.querySelector(
        this.config.domSelectors.PROMPT_TEXTAREA,
      ) as HTMLElement | HTMLTextAreaElement | null;

      if (!editor) {
        console.error('Could not find Mistral editor element');
        return false;
      }

      // Normalize content (preserve all characters including quotes)
      const normalizedContent = content.replace(/\r\n/g, '\n');

      // Method 1: Handle plain textarea
      try {
        editor.focus();

        if (editor instanceof HTMLTextAreaElement) {
          editor.value = normalizedContent;
          editor.dispatchEvent(
            new Event('input', { bubbles: true, cancelable: true }),
          );
          editor.selectionStart = editor.selectionEnd = normalizedContent.length;
          return true;
        }

        if (editor instanceof HTMLElement && editor.isContentEditable) {
          const escapeHTML = (str: string) =>
            str
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');

          const paragraphs = normalizedContent.split('\n');
          const paragraphsHTML = paragraphs
            .map(p =>
              p
                ? `<p>${escapeHTML(p)}</p>`
                : '<p><br class="ProseMirror-trailingBreak"></p>',
            )
            .join('');

          editor.innerHTML = paragraphsHTML;
          editor.dispatchEvent(
            new Event('input', { bubbles: true, cancelable: true }),
          );

          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);

          return true;
        }
      } catch (e) {
        console.warn('Primary method failed for Mistral:', e);
      }
      
      // Method 2: Try document.execCommand approach
      try {
        editor.focus();
        
        // Clear existing content
        editor.innerHTML = '<p><br class="ProseMirror-trailingBreak"></p>';
        
        // Position cursor at the beginning
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(editor.firstChild || editor, 0);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        // Insert text using execCommand
        document.execCommand('insertText', false, normalizedContent);
        
        return true;
      } catch (e) {
        console.warn('Fallback method failed for Mistral:', e);
      }
      
      // Method 3: Direct textContent approach (last resort)
      try {
        editor.focus();
        
        // Set as plain text and wrap in paragraph
        editor.innerHTML = `<p>${normalizedContent.replace(/\n/g, '</p><p>')}</p>`;
        
        // Trigger input event
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        
        return true;
      } catch (e) {
        console.error('All insertion methods failed for Mistral:', e);
        return false;
      }
      
    } catch (error) {
      console.error('Error inserting content into Mistral:', error);
      return false;
    }
  }

  supportsStreaming(): boolean {
    return true;
  }

  async processStreamingResponse(response: Response, requestBody: any): Promise<void> {
    if (!response.body) return;
    const reader = response.clone().body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let messageId = '';
    let content = '';
    const parentMessageId = requestBody.parentMessageId;
    const conversationId = requestBody.chatId || '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let index;
        while ((index = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, index).trim();
          buffer = buffer.slice(index + 1);
          if (!line) continue;
          if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (dataStr === '[DONE]') {
              if (messageId && content) {
                document.dispatchEvent(
                  new CustomEvent('jaydai:assistant-response', {
                    detail: {
                      messageId,
                      parentMessageId,
                      conversationId,
                      content,
                      role: 'assistant',
                      model: 'mistral',
                      isComplete: true,
                      platform: this.name,
                    },
                  }),
                );
              }
              continue;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.messageId) messageId = data.messageId;
              if (data.token) content += data.token;
              if (data.content) content += data.content;
            } catch (_) {
              content += dataStr;
            }
          } else {
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
              let token = line.slice(colonIndex + 1).trim();
              if (token.startsWith('"') && token.endsWith('"')) {
                try {
                  token = JSON.parse(token);
                } catch (_) {
                  token = token.slice(1, -1);
                }
              }
              content += token;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing Mistral stream:', error);
    }
  }
}

export const mistralAdapter = new MistralAdapter();
