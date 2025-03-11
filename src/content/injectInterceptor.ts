// src/content/injectInterceptor.ts
import { conversationHandler } from '@/services/handlers/ConversationHandler';
import { messageHandler } from '@/services/handlers/MessageHandler';
import { userHandler } from '@/services/handlers/UserHandler';
import { specificConversationHandler } from '@/services/handlers/SpecificConversationHandler';
import { StreamProcessor } from '@/services/chat/StreamProcessor';

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
    
    console.log('✅ Network interceptor script injected');
  } catch (error) {
    console.error('Failed to inject network interceptor:', error);
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
          
        case 'injectionComplete':
          console.log('✅ Interceptor injection completed');
          break;
      }
    } catch (error) {
      console.error('Error handling intercepted data:', error);
    }
  });
}

/**
 * Handle intercepted user info data
 */
function handleUserInfo(data: any): void {

  try {
    if (data && data.responseBody) {
      userHandler.processUserInfo(data.responseBody);
    }
  } catch (error) {
    console.error('Error processing user info:', error);
  }
}

/**
 * Handle intercepted conversation list data
 */
function handleConversationList(data: any): void {

  try {
    if (data && data.responseBody) {
      conversationHandler.processConversationList(data.responseBody);
    }
  } catch (error) {
    console.error('Error processing conversation list:', error);
  }
}

/**
 * Handle intercepted specific conversation data
 * This contains the complete conversation with all messages
 */
function handleSpecificConversation(data: any): void {
  try {
    specificConversationHandler.processSpecificConversation(data);
  } catch (error) {
    console.error('Error processing specific conversation:', error);
  }
}

/**
 * Handle intercepted chat completion data
 */
async function handleChatCompletion(data: any): Promise<void> {
  try {
    const { url, requestBody, responseBody, isStreaming } = data;
    
    // Process user message from request body if present
    if (requestBody && requestBody.messages && requestBody.messages.length > 0) {
      const userMessage = StreamProcessor.extractUserMessage(requestBody);
      if (userMessage) {
        messageHandler.processMessage({
          type: 'user',
          messageId: userMessage.id,
          content: userMessage.content,
          timestamp: Date.now(),
          conversationId: requestBody.conversation_id || null,
          model: requestBody.model || userMessage.model
        });
      }
    }
    
    // Handle non-streaming responses
    if (!isStreaming && responseBody) {
      if (responseBody.message) {
        const messageContent = responseBody.message.content?.parts?.join('\n') || 
                              responseBody.message.content || '';
        
        // Extract model information
        const model = responseBody.message.metadata?.model_slug || 
                     responseBody.model || 
                     'unknown';
        
        messageHandler.processMessage({
          type: 'assistant',
          messageId: responseBody.message.id || `assistant-${Date.now()}`,
          content: messageContent,
          timestamp: Date.now(),
          conversationId: responseBody.conversation_id || null,
          model: model
        });
      }
    }
  } catch (error) {
    console.error('Error processing chat completion:', error);
  }
}