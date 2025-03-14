// src/extension/content/injectInterceptor.ts
import { chatService } from '@/services/chat/ChatService';
import { userInfoService } from '@/services/user/UserInfoService';

import { messageService } from '@/services/MessageService';
import { emitEvent, AppEvent } from '@/core/events/events';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';

/**
 * Injects the network interceptor script into the page context
 */
export function injectNetworkInterceptor(): void {
  try {
    // Check if already injected
    if (document.querySelector('#archimind-network-interceptor')) {
      return;
    }
    
    // Create a script element
    const script = document.createElement('script');
    script.id = 'archimind-network-interceptor';
    
    // Set script source from extension resources
    script.src = chrome.runtime.getURL('injectedInterceptor.js');
    
    // Add to page and set up removal after load
    (document.head || document.documentElement).appendChild(script);
    
    // Set up listener for intercepted network data
    setupInterceptListener();
    
  } catch (error) {
    errorReporter.captureError(
      new AppError('Failed to inject network interceptor', ErrorCode.INJECTION_ERROR, error)
    );
  }
}

/**
 * Sets up a listener for events from the injected script
 */
function setupInterceptListener(): void {
  document.addEventListener('archimind-network-intercept', async (event: CustomEvent) => {
    const { type, data } = event.detail;
    
    try {
      switch (type) {
        case 'userInfo':
          handleUserInfo(data);
          break;
          
        case 'conversationList':
          handleConversationList(data);
          break;
          
        case 'specificConversation':
          handleSpecificConversation(data);
          break;
          
        case 'chatCompletion':
          await handleChatCompletion(data);
          break;
          
        case 'assistantResponse':
          handleAssistantResponse(data);
          break;
          
        case 'injectionComplete':
          console.log('Network interceptor injected successfully');
          break;
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling intercepted data', ErrorCode.EXTENSION_ERROR, error)
      );
    }
  });
}

/**
 * Handle intercepted user info data
 */
function handleUserInfo(data: any): void {
  try {
    if (data && data.responseBody) {
      // Use the userInfoService instead of userHandler
      userInfoService.handleUserInfoCapture(data.responseBody);
      
      // Emit an event for other components
      emitEvent(AppEvent.USER_INFO_UPDATED, {
        email: data.responseBody.email
      });
    }
  } catch (error) {
    errorReporter.captureError(
      new AppError('Error processing user info', ErrorCode.API_ERROR, error)
    );
  }
}

/**
 * Handle intercepted conversation list data
 */
function handleConversationList(data: any): void {
  try {
    if (data && data.responseBody) {
      // Process the conversation list data with chatService
      const conversations = extractConversations(data.responseBody);
      
      // Add each conversation to the chat service
      conversations.forEach(conversation => {
        chatService.addConversation(conversation);
      });
      
      // Emit an event for other components
      emitEvent(AppEvent.CONVERSATION_LIST_UPDATED, {
        count: conversations.length
      });
    }
  } catch (error) {
    errorReporter.captureError(
      new AppError('Error processing conversation list', ErrorCode.API_ERROR, error)
    );
  }
}

/**
 * Extract conversations from response data
 */
function extractConversations(responseBody: any): any[] {
  // Extract conversations from the response body
  if (responseBody.items && Array.isArray(responseBody.items)) {
    return responseBody.items.map((item: any) => ({
      id: item.id,
      title: item.title || 'Untitled',
      lastMessageTime: item.update_time || Date.now(),
      model: item.model || 'unknown'
    }));
  }
  return [];
}

/**
 * Handle intercepted specific conversation data
 * This contains the complete conversation with all messages
 */
function handleSpecificConversation(data: any): void {
  try {
    // We can keep using chatService temporarily
    // until it's fully migrated to the chat service
    chatService.processSpecificConversation(data);
    
    // Extract the conversation ID for current chat tracking
    if (data && data.responseBody && data.responseBody.conversation_id) {
      const conversationId = data.responseBody.conversation_id;
      
      // Update the current conversation ID in the chat service
      chatService.setCurrentConversationId(conversationId);
      
      // Emit an event about the conversation change
      emitEvent(AppEvent.CHAT_CONVERSATION_CHANGED, {
        conversationId
      });
    }
  } catch (error) {
    errorReporter.captureError(
      new AppError('Error processing specific conversation', ErrorCode.API_ERROR, error)
    );
  }
}

/**
 * Handle intercepted chat completion data
 */
async function handleChatCompletion(data: any): Promise<void> {
  try {
    const { requestBody } = data;
    
    // Process user message from request body if present
    if (requestBody && requestBody.messages && requestBody.messages.length > 0) {
      const userMessage = extractUserMessage(requestBody);
      
      if (userMessage) {
        // Use messageService to process the user message
        messageService.processMessage({
          messageId: userMessage.id,
          conversationId: requestBody.conversation_id || null,
          content: userMessage.content,
          role: 'user',
          timestamp: Date.now(),
          model: requestBody.model || userMessage.model
        });
        
        // Emit an event for the sent message
        emitEvent(AppEvent.CHAT_MESSAGE_SENT, {
          messageId: userMessage.id,
          content: userMessage.content,
          conversationId: requestBody.conversation_id || null
        });
        
        // Update current conversation ID if available
        if (requestBody.conversation_id) {
          chatService.setCurrentConversationId(requestBody.conversation_id);
        }
      }
    }
  } catch (error) {
    errorReporter.captureError(
      new AppError('Error processing chat completion', ErrorCode.API_ERROR, error)
    );
  }
}

/**
 * Handle assistant response from streaming data
 */
function handleAssistantResponse(data: any): void {
  try {
    if (!data.messageId || !data.content || !data.isComplete) {
      return;
    }
    
    // Use messageService to process the assistant response
    messageService.processMessage({
      messageId: data.messageId,
      conversationId: data.conversationId || null,
      content: data.content,
      role: 'assistant',
      timestamp: data.createTime || Date.now(),
      model: data.model || 'unknown'
    });
    
    // Emit an event for the received message
    emitEvent(AppEvent.CHAT_MESSAGE_RECEIVED, {
      messageId: data.messageId,
      content: data.content,
      role: 'assistant',
      conversationId: data.conversationId || null
    });
    
    // Update the current conversation ID if available
    if (data.conversationId) {
      chatService.setCurrentConversationId(data.conversationId);
    }
  } catch (error) {
    errorReporter.captureError(
      new AppError('Error processing assistant response', ErrorCode.API_ERROR, error)
    );
  }
}

/**
 * Extract user message from chat completion request body
 */
function extractUserMessage(requestBody: any): { id: string, content: string, model?: string } | null {
  try {
    const message = requestBody.messages.find(
      (m: any) => m.author?.role === 'user' || m.role === 'user'
    );
    
    if (!message) return null;
    
    // Extract content from message
    let content = '';
    if (message.content?.parts) {
      content = message.content.parts.join('\n');
    } else if (message.content) {
      content = message.content;
    }
    
    return {
      id: message.id || `user-${Date.now()}`,
      content,
      model: requestBody.model
    };
  } catch (error) {
    errorReporter.captureError(
      new AppError('Error extracting user message', ErrorCode.VALIDATION_ERROR, error)
    );
    return null;
  }
}