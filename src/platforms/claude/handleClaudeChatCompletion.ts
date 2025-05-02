import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { Message } from '@/types';


 function extractUserMessage(requestBody: any, url: string): Message | null {
    try {
    const content = requestBody.prompt
    const parentMessageProviderId = requestBody.parent_message_uuid
      return {
        messageId: message.id || `user-${Date.now()}`,
        conversationId: requestBody.conversation_id || '',
        content,
        role: 'user',
        model: requestBody.model || 'unknown',
        created_at: message.create_time ? message.create_time * 1000 : Date.now(),
        parent_message_provider_id: parentMessageProviderId
      };
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting user message', ErrorCode.PARSING_ERROR, error)
      );
      return null;
    }
  }
  /**
   * Handle chat completion requests
   */
  export function handleClaudeChatCompletion(event: CustomEvent): void {
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
        new AppError('Error handling chat completion', ErrorCode.PARSING_ERROR, error)
      );
    }
  };