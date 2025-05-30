import { BasePlatformAdapter } from './base.adapter';
import { copilotConfig } from '../config/copilot.config';
import { Message, Conversation } from '@/types';
import { messageApi, SaveChatParams, SaveMessageParams } from '@/services/api/MessageApi';
import { chatService } from '@/services/network/ChatService';

export class CopilotAdapter extends BasePlatformAdapter {
  constructor() {
    super(copilotConfig);
  }

  extractUserMessage(_data: any): Message | null {
    return null;
  }

  extractAssistantMessage(_data: any): Message | null {
    return null;
  }

  extractConversation(data: any): Conversation | null {
    if (!data?.results) return null;
    return { chat_provider_id: chatService.getCurrentConversationId() || '', title: data.results[0]?.title || 'Conversation', provider_name: 'Copilot' } as any;
  }

  extractMessagesFromConversation(data: any): Message[] {
    if (!data?.results) return [];
    return data.results.map((m: any) => ({
      messageId: m.id,
      conversationId: chatService.getCurrentConversationId() || '',
      content: Array.isArray(m.content) ? m.content.map((c:any)=>c.text).join('\n') : m.content?.text || '',
      role: m.author === 'human' ? 'user' : 'assistant',
      model: 'copilot',
      timestamp: new Date(m.createdAt).getTime(),
      parent_message_provider_id: null
    }));
  }

  async handleConversationList(responseBody: any): Promise<void> {
    if (!responseBody?.results) return Promise.resolve();
    const chats: SaveChatParams[] = responseBody.results
      .filter((c: any) => c.type === 'chat')
      .map((c: any) => ({ chat_provider_id: c.id, title: c.title || 'Conversation', provider_name: 'Copilot' }));
    if (chats.length) await messageApi.saveChatBatch(chats);
    return Promise.resolve();
  }

  async handleSpecificConversation(responseBody: any): Promise<void> {
    const conversation = this.extractConversation(responseBody);
    const messages = this.extractMessagesFromConversation(responseBody);
    if (conversation) await messageApi.saveChat(conversation as SaveChatParams);
    if (messages.length) {
      await messageApi.saveMessageBatch(messages.map((m) => ({
        message_provider_id: m.messageId,
        chat_provider_id: m.conversationId,
        content: m.content,
        role: m.role,
        model: m.model,
        created_at: m.timestamp,
        parent_message_provider_id: m.parent_message_provider_id
      })));
    }
    if (conversation) {
      chatService.setCurrentConversationId(conversation.chat_provider_id);
      document.dispatchEvent(new CustomEvent('jaydai:conversation-loaded', { detail: { conversation, messages } }));
    }
    return Promise.resolve();
  }

  handleChatCompletion(_event: CustomEvent): void {}
  handleAssistantResponse(_event: CustomEvent): void {}
  insertPrompt(content: string): boolean {
    const textarea = document.querySelector(this.config.domSelectors.PROMPT_TEXTAREA) as HTMLTextAreaElement | null;
    if (!textarea || !content) return false;
    textarea.value = content;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = content.length;
    return true;
  }
  supportsStreaming(): boolean { return false; }
  async processStreamingResponse(_response: Response, _body: any): Promise<void> { return Promise.resolve(); }
}

export const copilotAdapter = new CopilotAdapter();
