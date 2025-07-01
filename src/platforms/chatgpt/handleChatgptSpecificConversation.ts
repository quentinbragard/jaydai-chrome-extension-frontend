
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { Conversation, Message } from '@/services/chat/ConversationParser';
import { messageApi, SaveMessageParams, SaveChatParams } from '@/services/api/MessageApi';


 /**
  * Extract a single conversation from data
  */
function extractConversation(data: any): Conversation {
    return {
      chat_provider_id: data.conversation_id,
      title: data.title || 'Conversation',
      provider_name: 'ChatGPT'
    };
  }

/**
   * Extract messages from conversation data
   */
function extractMessagesFromConversation(conversation: any): Message[] {
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
                message_provider_id: messageId,
                chat_provider_id: conversation.conversation_id,
                content,
                role,
                model: node.message.metadata?.model_slug || 'unknown',
                created_at: node.message.create_time ? node.message.create_time * 1000 : Date.now(),
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

export function handleChatgptSpecificConversation(responseBody: any): Promise<void> {
    try {
      if (!responseBody?.conversation_id) return Promise.resolve();
      
      const conversation = extractConversation(responseBody);
      const messages = extractMessagesFromConversation(responseBody);
      
      messageApi.saveMessageBatch(messages);
      messageApi.saveChat(conversation);
      
      // Emit event with conversation and messages
        
      document.dispatchEvent(new CustomEvent('jaydai:conversation-loaded', {
        detail: { conversation, messages }
      }));
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling specific conversation', ErrorCode.PARSING_ERROR, error)
      );
    }
    return Promise.resolve();
  };