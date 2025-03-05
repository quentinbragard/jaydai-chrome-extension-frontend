// src/content/injectInterceptor.ts
import { apiService } from '@/services/ApiService';
import { conversationHandler } from '@/services/chat/handlers/ConversationHandler';
import { messageHandler } from '@/services/chat/handlers/MessageHandler';
import { userHandler } from '@/services/chat/handlers/UserHandler';
import { StreamProcessor } from '@/services/chat/StreamProcessor';

/**
 * Injects the network interceptor script into the page context
 */
export function injectNetworkInterceptor(): void {
  try {
    console.log('🚀 Injecting network interceptor into page context...');
    
    // Check if already injected
    if (document.querySelector('#archimind-network-interceptor')) {
      console.log('⚠️ Network interceptor already injected');
      return;
    }
    
    // Create a script element
    const script = document.createElement('script');
    script.id = 'archimind-network-interceptor';
    
    // Set script source from extension resources
    script.src = chrome.runtime.getURL('injectedInterceptor.js');
    
    // Add to page and set up removal after load
    (document.head || document.documentElement).appendChild(script);
    script.onload = function() {
      console.log('✅ Network interceptor script loaded');
      // Optional: Remove the script element after loading
      // script.remove();
    };
    
    // Set up listener for intercepted network data
    setupInterceptListener();
  } catch (error) {
    console.error('❌ Failed to inject network interceptor:', error);
  }
}

/**
 * Sets up a listener for events from the injected script
 */
function setupInterceptListener(): void {
  document.addEventListener('archimind-network-intercept', async (event: CustomEvent) => {
    const { type, data } = event.detail;
    
    try {
      console.log('🔄🔄🔄🔄🔄🔄🔄🔄 Received intercepted data:', JSON.stringify(data, null, 2));
      console.log(' ❌❌❌❌❌❌❌Received intercepted type:', type);
      
      switch (type) {
        case 'userInfo':
          console.log("OOOOOOKKKKKKKKKKKKKK")
          handleUserInfo(data);
          break;
          
        case 'conversationList':
          handleConversationList(data);
          break;
          
        case 'chatCompletion':
          await handleChatCompletion(data);
          break;
          
        case 'injectionComplete':
          console.log('✅ Interceptor injection completed successfully');
          break;
          
        default:
          console.log(`⚠️ Unknown intercept type: ${type}`);
      }
    } catch (error) {
      console.error('❌ Error handling intercepted data:', error);
    }
  });
  
  console.log('👂 Set up listener for intercepted network data');
}

/**
 * Handle intercepted user info data
 */
function handleUserInfo(data: any): void {
  try {
    if (data && data.responseBody) {
      console.log('👤 Processing intercepted user info', JSON.stringify(data, null, 2));
      userHandler.processUserInfo(data.responseBody);
    }
  } catch (error) {
    console.error('❌ Error processing user info:', error);
  }
}

/**
 * Handle intercepted conversation list data
 */
function handleConversationList(data: any): void {
  console.log('👤👤👤👤👤👤👤👤👤👤👤👤👤👤👤👤👤👤 Processing intercepted conversation list', JSON.stringify(data, null, 2));
  try {
    if (data && data.responseBody) {
      console.log('📋 Processing intercepted conversation list');
      conversationHandler.processConversationList(data.responseBody);
    }
  } catch (error) {
    console.error('❌ Error processing conversation list:', error);
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
      console.log('👤👤👤👤👤👤👤👤👤👤👤👤👤👤👤👤👤👤 Processing intercepted user message', JSON.stringify(userMessage, null, 2));
      if (userMessage) {
        messageHandler.processMessage({
          type: 'user',
          messageId: userMessage.id,
          content: userMessage.content,
          timestamp: Date.now(),
          conversationId: requestBody.conversation_id || null,
          model: userMessage.model
        });
      }
    }
    
    // Handle non-streaming responses
    if (!isStreaming && responseBody) {
      if (responseBody.message) {
        const messageContent = responseBody.message.content?.parts?.join('\n') || 
                              responseBody.message.content || '';
        
        messageHandler.processMessage({
          type: 'assistant',
          messageId: responseBody.message.id || `assistant-${Date.now()}`,
          content: messageContent,
          timestamp: Date.now(),
          conversationId: responseBody.conversation_id || null,
          model: responseBody.message.metadata?.model_slug || null
        });
      }
    }
    
    // For streaming responses, we don't have the full content here
    // The content script will still see these via the message observer
  } catch (error) {
    console.error('❌ Error processing chat completion:', error);
  }
}