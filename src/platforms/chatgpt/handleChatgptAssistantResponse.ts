import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { Message } from '@/types';



  /**
   * Extract assistant message from response data
   */
  function extractAssistantMessage(data: any): Message | null {
    try {
      return {
        messageId: data.messageId,
        conversationId: data.conversationId || '',
        content: data.content,
        role: 'assistant',
        model: data.model || 'unknown',
        timestamp: data.createTime ? data.createTime * 1000 : Date.now(),
        thinkingTime: data.thinkingTime,
        parent_message_provider_id: data.parentMessageId
      };
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error extracting assistant message', ErrorCode.PARSING_ERROR, error)
      );
      return null;
    }
  }
 /**
   * Handle assistant responses
   */
 export function handleChatgptAssistantResponse(event: CustomEvent): void {
    try {
      const data = event.detail;
      if (!data.messageId || !data.content) return;
      
      // Only process complete messages
      if (data.isComplete) {
        const message = extractAssistantMessage(data);
        if (message) {
          // Emit event with extracted message
          document.dispatchEvent(new CustomEvent('jaydai:message-extracted', {
            detail: { message }
          }));
        }
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling assistant response', ErrorCode.PARSING_ERROR, error)
      );
    }
  };