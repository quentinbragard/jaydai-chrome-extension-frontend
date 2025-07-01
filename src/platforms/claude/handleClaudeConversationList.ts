
import { messageApi, SaveChatParams } from '@/services/api/MessageApi'

/**
   * Map conversations to chat parameters for saving
   */
function mapConversationsToChatParams(conversations: any[]): SaveChatParams[] {
  return conversations.map(chat => ({
    chat_provider_id: chat.uuid,
    title: chat.name || 'Unnamed Conversation',
    provider_name: 'Claude'  // Explicitly set to ChatGPT
  })).filter(chat => 
    // Filter out any chats with missing or invalid chat_provider_id
    chat.chat_provider_id && 
    chat.chat_provider_id.trim() !== ''
  );
}

export function handleClaudeConversationList(conversationItems: any[]): Promise<void> {
    if (conversationItems && Array.isArray(conversationItems)) {
        const processedChats = mapConversationsToChatParams(conversationItems);
        return messageApi.saveChatBatch(processedChats);
    }
    return Promise.resolve();
}