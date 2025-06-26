import { debug } from '@/core/config';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { Message } from '@/types';

interface ChatMessage {
  author?: { role: string };
  role?: string;
  content: { parts?: string[] } | string;
  id?: string;
  create_time?: number;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  conversation_id?: string;
  model?: string;
  parent_message_provider_id?: string;
}

function extractUserMessage(requestBody: ChatRequestBody): Message | null {
  try {
    const message = requestBody.messages.find(
      (m) => m.author?.role === 'user' || m.role === 'user'
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
      created_at: message.create_time ? message.create_time * 1000 : Date.now(),
      parent_message_provider_id: requestBody.parent_message_id
    };
  } catch (error) {
    errorReporter.captureError(
      new AppError('Error extracting user message', ErrorCode.API_ERROR, error)
    );
    return null;
  }
}

/**
 * Handle chat completion requests
 */
export function handleChatgptChatCompletion(event: CustomEvent): void {
    debug('**********************handleChatgptChatCompletion', event);
  try {
    const { requestBody } = event.detail;
    if (!requestBody?.messages?.length) return;
    
    const message = extractUserMessage(requestBody);
    if (message) {
      // Emit event with extracted message
      document.dispatchEvent(new CustomEvent('jaydai:message-extracted', {
        detail: { message }
      }));
    }
  } catch (error) {
    errorReporter.captureError(
      new AppError('Error handling chat completion', ErrorCode.API_ERROR, error)
    );
  }
}