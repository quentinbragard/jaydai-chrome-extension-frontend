import { apiService } from './ApiService';

interface ConversationData {
  conversationId: string;
  title: string;
  messages: MessageData[];
  model: string;
  metadata?: Record<string, any>;
}

interface MessageData {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/**
 * Intercepts and processes ChatGPT conversations
 */
export class ChatInterceptor {
  private static instance: ChatInterceptor;
  private originalFetch: typeof window.fetch;
  private originalXHR: typeof XMLHttpRequest;
  private isIntercepting = false;
  private pendingConversations = new Map<string, ConversationData>();

  private constructor() {
    this.originalFetch = window.fetch;
    this.originalXHR = XMLHttpRequest;
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ChatInterceptor {
    if (!ChatInterceptor.instance) {
      ChatInterceptor.instance = new ChatInterceptor();
    }
    return ChatInterceptor.instance;
  }

  /**
   * Start intercepting network requests
   */
  public startIntercepting(): void {
    if (this.isIntercepting) return;
    
    this.interceptFetch();
    this.interceptXHR();
    this.isIntercepting = true;
    console.log('✅ ChatGPT API interception started');
  }

  /**
   * Stop intercepting network requests
   */
  public stopIntercepting(): void {
    if (!this.isIntercepting) return;
    
    window.fetch = this.originalFetch;
    window.XMLHttpRequest = this.originalXHR;
    this.isIntercepting = false;
    console.log('✅ ChatGPT API interception stopped');
  }

  /**
   * Intercept fetch requests to capture conversation data
   */
  private interceptFetch(): void {
    const self = this;
    
    window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      
      // Only intercept ChatGPT API requests
      if (!self.shouldInterceptUrl(url)) {
        return self.originalFetch.call(this, input, init);
      }
      
      // Process the request
      try {
        // Clone the request body if it exists
        let requestBodyClone;
        if (init?.body) {
          requestBodyClone = init.body instanceof ReadableStream
            ? await new Response(init.body).text()
            : init.body;
        }
        
        // Make the original fetch call
        const response = await self.originalFetch.call(this, input, init);
        
        // Process the response if successful
        if (response.ok) {
          // Clone the response to not disturb the original
          const responseClone = response.clone();
          
          // Process the intercepted data
          self.processInterceptedData(url, requestBodyClone, responseClone).catch(err => {
            console.error('Error processing intercepted data:', err);
          });
        }
        
        // Return the original response
        return response;
      } catch (error) {
        console.error('Error in fetch interception:', error);
        return self.originalFetch.call(this, input, init);
      }
    };
  }

  /**
   * Intercept XMLHttpRequest to capture conversation data
   */
  private interceptXHR(): void {
    const self = this;
    
    window.XMLHttpRequest = function() {
      const xhr = new self.originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      let requestUrl = '';
      let requestBody: any = null;
      
      // Intercept open method to capture the URL
      xhr.open = function() {
        requestUrl = arguments[1];
        return originalOpen.apply(this, arguments as any);
      };
      
      // Intercept send method to capture the request body
      xhr.send = function(body) {
        requestBody = body;
        
        // If this is a relevant request, add response listener
        if (self.shouldInterceptUrl(requestUrl)) {
          xhr.addEventListener('load', function() {
            if (xhr.status >= 200 && xhr.status < 300) {
              const responseData = xhr.responseText;
              
              // Process the intercepted data
              self.processInterceptedData(requestUrl, requestBody, responseData).catch(err => {
                console.error('Error processing intercepted data:', err);
              });
            }
          });
        }
        
        return originalSend.apply(this, arguments as any);
      };
      
      return xhr;
    } as any;
  }

  /**
   * Determine if a URL should be intercepted
   */
  private shouldInterceptUrl(url: string): boolean {
    // Add additional ChatGPT API endpoints as needed
    return (
      url.includes('api.openai.com/v1/chat/completions') ||
      url.includes('chatgpt.com/backend-api/conversation')
    );
  }

  /**
   * Process the intercepted request and response data
   */
  private async processInterceptedData(
    url: string, 
    requestData: any, 
    responseData: Response | string
  ): Promise<void> {
    try {
      // Parse request data
      let requestJson: any;
      if (typeof requestData === 'string') {
        try {
          requestJson = JSON.parse(requestData);
        } catch {
          requestJson = requestData;
        }
      } else {
        requestJson = requestData;
      }
      
      // Parse response data
      let responseJson: any;
      if (responseData instanceof Response) {
        const responseText = await responseData.text();
        try {
          responseJson = JSON.parse(responseText);
        } catch {
          responseJson = responseText;
        }
      } else {
        try {
          responseJson = JSON.parse(responseData);
        } catch {
          responseJson = responseData;
        }
      }
      
      // Extract and process conversation data
      const conversationData = this.extractConversationData(url, requestJson, responseJson);
      if (conversationData) {
        await this.saveConversation(conversationData);
      }
    } catch (error) {
      console.error('Error processing intercepted data:', error);
    }
  }

  /**
   * Extract relevant conversation data from API request/response
   */
  private extractConversationData(
    url: string, 
    requestData: any, 
    responseData: any
  ): ConversationData | null {
    // Different extraction logic based on endpoint
    if (url.includes('api.openai.com/v1/chat/completions')) {
      return this.extractFromOpenAIAPI(requestData, responseData);
    } else if (url.includes('chatgpt.com/backend-api/conversation')) {
      return this.extractFromChatGPTAPI(requestData, responseData);
    }
    
    return null;
  }

  /**
   * Extract conversation data from OpenAI API format
   */
  private extractFromOpenAIAPI(requestData: any, responseData: any): ConversationData | null {
    if (!requestData || !responseData) return null;
    
    try {
      // The conversation ID might be in the response or we generate one
      const conversationId = responseData.id || `oai-${Date.now()}`;
      
      // Get existing conversation or create new one
      let conversation = this.pendingConversations.get(conversationId) || {
        conversationId,
        title: 'New conversation',
        messages: [],
        model: requestData.model || responseData.model || 'unknown',
        metadata: {}
      };
      
      // Add user message from request
      if (requestData.messages && Array.isArray(requestData.messages)) {
        for (const message of requestData.messages) {
          // Skip if we already have this message
          if (conversation.messages.some(m => m.content === message.content && m.role === message.role)) {
            continue;
          }
          
          conversation.messages.push({
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: message.role,
            content: message.content,
            timestamp: Date.now()
          });
        }
      }
      
      // Add assistant message from response
      if (responseData.choices && Array.isArray(responseData.choices)) {
        for (const choice of responseData.choices) {
          if (choice.message) {
            conversation.messages.push({
              id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              role: choice.message.role,
              content: choice.message.content,
              timestamp: Date.now()
            });
          }
        }
      }
      
      // Update pending conversations
      this.pendingConversations.set(conversationId, conversation);
      
      return conversation;
    } catch (error) {
      console.error('Error extracting from OpenAI API:', error);
      return null;
    }
  }

  /**
   * Extract conversation data from ChatGPT's own API format
   */
  private extractFromChatGPTAPI(requestData: any, responseData: any): ConversationData | null {
    if (!requestData && !responseData) return null;
    
    try {
      // ChatGPT's API format varies, this is a simplified example
      let conversationId = '';
      let messages: MessageData[] = [];
      
      // Extract from request data
      if (requestData) {
        conversationId = requestData.conversation_id || requestData.parent_message_id || `chat-${Date.now()}`;
        
        if (requestData.messages && Array.isArray(requestData.messages)) {
          messages = requestData.messages.map((message: any) => ({
            id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: message.role || message.author?.role || 'user',
            content: message.content?.parts?.join('\n') || message.content || '',
            timestamp: message.create_time || Date.now()
          }));
        }
      }
      
      // Extract from response data
      if (responseData) {
        conversationId = responseData.conversation_id || conversationId;
        
        if (responseData.message) {
          const message = responseData.message;
          messages.push({
            id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role: message.role || message.author?.role || 'assistant',
            content: message.content?.parts?.join('\n') || message.content || '',
            timestamp: message.create_time || Date.now()
          });
        }
      }
      
      // Get existing conversation or create new one
      let conversation = this.pendingConversations.get(conversationId) || {
        conversationId,
        title: responseData.title || 'New conversation',
        messages: [],
        model: responseData.model || 'unknown',
        metadata: {}
      };
      
      // Add new messages, avoiding duplicates
      for (const message of messages) {
        if (!conversation.messages.some(m => m.id === message.id)) {
          conversation.messages.push(message);
        }
      }
      
      // Update pending conversations
      this.pendingConversations.set(conversationId, conversation);
      
      return conversation;
    } catch (error) {
      console.error('Error extracting from ChatGPT API:', error);
      return null;
    }
  }

  /**
   * Save the conversation to the backend
   */
  private async saveConversation(conversation: ConversationData): Promise<void> {
    try {
      // First save the chat/conversation
      await apiService.saveChatToBackend({
        chatId: conversation.conversationId,
        chatTitle: conversation.title,
        providerName: 'ChatGPT'
      });
      
      // Then save each message
      for (const message of conversation.messages) {
        await apiService.saveMessageToBackend({
          messageId: message.id,
          message: message.content,
          role: message.role,
          rank: conversation.messages.indexOf(message),
          providerChatId: conversation.conversationId,
          model: conversation.model,
          timestamp: message.timestamp
        });
      }
      
      console.log(`✅ Saved conversation: ${conversation.conversationId}`);
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }
}

// Export the singleton instance
export const chatInterceptor = ChatInterceptor.getInstance();