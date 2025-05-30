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
      const content = requestBody.messageInput || '';
      return {
        messageId: requestBody.messageId || `user-${Date.now()}`,
        conversationId: requestBody.chatId || '',
        content,
        role: 'user',
        model: requestBody.model || 'mistral',
        timestamp: Date.now(),
        parent_message_provider_id: requestBody.parentMessageId,
      };
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting user message from Mistral', ErrorCode.PARSING_ERROR, error),
      );
      return null;
    }
  }

  extractAssistantMessage(data: any): Message | null {
    try {
      return {
        messageId: data.messageId || `mistral-${Date.now()}`,
        conversationId: data.chatId || '',
        content: data.content || '',
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
            new CustomEvent('jaydai:message-extracted', { detail: { message, platform: this.name } }),
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
    if (!content) return false;
    try {
      const textarea = document.querySelector(this.config.domSelectors.PROMPT_TEXTAREA) as HTMLTextAreaElement | null;
      if (!textarea) return false;
      textarea.value = content;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = content.length;
      return true;
    } catch (error) {
      console.error('Error inserting prompt in Mistral:', error);
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
          }
        }
      }
      if (messageId && content) {
        document.dispatchEvent(
          new CustomEvent('jaydai:assistant-response', {
            detail: {
              messageId,
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
    } catch (error) {
      console.error('Error processing Mistral stream:', error);
    }
  }
}

export const mistralAdapter = new MistralAdapter();
