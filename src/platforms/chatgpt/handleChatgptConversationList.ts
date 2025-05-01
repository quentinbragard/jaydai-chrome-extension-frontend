import { SaveChatParams, messageApi } from '@/services/api/MessageApi'

/**
   * Map conversations to chat parameters for saving
   */
 function mapConversationsToChatParams(conversations: any[]): SaveChatParams[] {
    return conversations.map(chat => ({
      chat_provider_id: chat.id,
      title: chat.title || 'Unnamed Conversation',
      provider_name: 'ChatGPT'  // Explicitly set to ChatGPT
    })).filter(chat => 
      // Filter out any chats with missing or invalid chat_provider_id
      chat.chat_provider_id && 
      chat.chat_provider_id.trim() !== ''
    );
  }


export function handleChatgptConversationList(conversationItems: any[]): Promise<void> {
    console.log('=========================handleChatgptConversationList', conversationItems);
    if (conversationItems && Array.isArray(conversationItems)) {
        const processedChats = mapConversationsToChatParams(conversationItems);
        return messageApi.saveChatBatch(processedChats);
    }
    return Promise.resolve();
}