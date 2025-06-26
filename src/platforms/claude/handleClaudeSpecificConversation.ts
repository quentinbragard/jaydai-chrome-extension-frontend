import { debug } from '@/core/config';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { Conversation, Message } from '@/services/chat/ConversationParser';
import { messageApi } from '@/services/api/MessageApi';

/**
 * Extract a single conversation from data
 */
function extractConversation(data: any): Conversation {
  return {
    chat_provider_id: data.uuid,
    title: data.name || 'Conversation',
    provider_name: 'Claude'
  };
}

/**
 * Extract messages from conversation data
 */
function extractMessagesFromConversation(responseBody: any): Message[] {
  try {
    const messages: Message[] = [];
    
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
          debug('MESSAaaaaaaaGE', message);
          
          messages.push({
            message_provider_id: message.uuid, // Use message UUID
            chat_provider_id: responseBody.uuid, // Conversation UUID
            content,
            role,
            model: responseBody.model || 'claude', // Get model from settings if available
            created_at: new Date(message.created_at).getTime(), // Convert ISO timestamp to milliseconds
            parent_message_provider_id: message.parent_message_uuid // Parent message reference
          });
        }
      });
    }
    
    // Sort messages by index to ensure correct order
    return messages.sort((a, b) => {
      // Use the index property from the original messages if available
      const indexA = responseBody.chat_messages.find((m: any) => m.uuid === a.message_provider_id)?.index || 0;
      const indexB = responseBody.chat_messages.find((m: any) => m.uuid === b.message_provider_id)?.index || 0;
      return indexA - indexB;
    });
  } catch (error) {
    errorReporter.captureError(
      new AppError('Error extracting messages from conversation', ErrorCode.PARSING_ERROR, error)
    );
    return [];
  }
}

export function handleClaudeSpecificConversation(responseBody: any): Promise<void> {
  debug('handleClaudeSpecificConversation', responseBody);
  try {
    if (!responseBody?.uuid) {
      console.warn('Missing conversation UUID in Claude response');
      return Promise.resolve();
    }
    
    const conversation = extractConversation(responseBody);
    const messages = extractMessagesFromConversation(responseBody);
    
    debug('Extracted conversation:', conversation);
    debug('Extracted messages:', messages);
    
    // Only save if we have valid data
    if (conversation.chat_provider_id && messages.length > 0) {
      // Save the chat first
      return messageApi.saveChat(conversation)
        .then(() => {
          // Then save all messages
          return messageApi.saveMessageBatch(messages);
        })
        .then(() => {
          // Emit event with conversation and messages
          debug('Emitting conversation-loaded event');
          document.dispatchEvent(new CustomEvent('jaydai:conversation-loaded', {
            detail: { conversation, messages }
          }));
        })
        .catch(error => {
          errorReporter.captureError(
            new AppError('Error saving Claude conversation data', ErrorCode.API_ERROR, error)
          );
        });
    }
  } catch (error) {
    errorReporter.captureError(
      new AppError('Error handling Claude specific conversation', ErrorCode.PARSING_ERROR, error)
    );
  }
  return Promise.resolve();
}