
// src/api/MessageApi.ts - Updated interface
import { apiClient } from './ApiClient';
import { trackEvent, EVENTS } from '@/utils/amplitude';

export interface SaveMessageParams {
  message_provider_id: string;
  content: string;
  role: string;
  chat_provider_id: string;
  model?: string;
  created_at?: number;
  parent_message_provider_id?: string; // Added parent_message_provider_id
}

export interface SaveChatParams {
  chat_provider_id: string;
  title: string;
  provider_name?: string;
}

export class MessageApi {
  /**
   * Save a batch of messages in one operation
   */
  async saveMessageBatch(messages: SaveMessageParams[]): Promise<any> {
    messages.forEach(message => {
      if (message.role === 'user') {
        trackEvent(EVENTS.USER_MESSAGE_CAPTURED, {
          message_provider_id: message.message_provider_id,
          content_length: message.content.length,
          role: message.role,
          chat_provider_id: message.chat_provider_id,
        });
      }
      else if (message.role === 'assistant') {
        trackEvent(EVENTS.AI_ANSWER_CAPTURED, {
          message_provider_id: message.message_provider_id,
          content_length: message.content.length,
          role: message.role,
          chat_provider_id: message.chat_provider_id,
        });
      }
    });
    return apiClient.request('/save/batch/message', {
      method: 'POST',
      body: JSON.stringify({
        messages: messages
      })
    });
  }
  
  /**
   * Save a single message
   */
  async saveMessage(message: SaveMessageParams): Promise<any> {
    if (message.role === 'user') {
      trackEvent(EVENTS.USER_MESSAGE_CAPTURED, {
      message_provider_id: message.message_provider_id,
      content_length: message.content.length,
      role: message.role,
      chat_provider_id: message.chat_provider_id,
      });
    }
    else if (message.role === 'assistant') {
      trackEvent(EVENTS.AI_ANSWER_CAPTURED, {
        message_provider_id: message.message_provider_id,
        content_length: message.content.length,
        role: message.role,
        chat_provider_id: message.chat_provider_id,
      });
    }
    return apiClient.request('/save/message', {
      method: 'POST',
      body: JSON.stringify(message)
    });
  }
  
  /**
   * Save a batch of chats
   */
  async saveChatBatch(chats: SaveChatParams[]): Promise<any> {
    chats.forEach(chat => {
      trackEvent(EVENTS.CHAT_CAPTURED, {
        chat_provider_id: chat.chat_provider_id,
        title: chat.title,
        provider_name: chat.provider_name || 'ChatGPT'
      });
    });
    return apiClient.request('/save/batch/chat', {
      method: 'POST',
      body: JSON.stringify({
        chats: chats
      })
    });
  }
  
  /**
   * Save a single chat
   */
  async saveChat(chat: SaveChatParams): Promise<any> {
    trackEvent(EVENTS.CHAT_CAPTURED, {
      chat_provider_id: chat.chat_provider_id,
      title: chat.title,
      provider_name: chat.provider_name || 'ChatGPT'
    });
    return apiClient.request('/save/chat', {
      method: 'POST',
      body: JSON.stringify({
        chat_provider_id: chat.chat_provider_id,
        title: chat.title,
        provider_name: chat.provider_name || 'ChatGPT'
      })
    });
  }
  
  /**
   * Save a batch of chats and messages
   */
  async saveBatch(batchData: { chats?: SaveChatParams[], messages?: SaveMessageParams[] }): Promise<any> {
    return apiClient.request('/save/batch', {
      method: 'POST',
      body: JSON.stringify(batchData)
    });
  }
}

export const messageApi = new MessageApi();