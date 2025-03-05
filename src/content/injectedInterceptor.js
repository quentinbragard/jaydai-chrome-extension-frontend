// injectedInterceptor.js
// This script will be injected into the page context to intercept network requests

(function() {
  console.log('🔌 ChatGPT Network Interceptor injected into page context');
  
  // Track if we've already processed the user info
  let userInfoProcessed = false;
  
  // Store original methods before overriding
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  // Define endpoints we're interested in
  const ENDPOINTS = {
    USER_INFO: '/backend-api/me',
    CONVERSATIONS: '/backend-api/conversations',
    CHAT_COMPLETION: '/backend-api/conversation'
  };
  
  // Track processed requests to avoid duplicates
  const processedRequests = new Set();
  
  /**
   * Send intercepted data back to the extension
   */
  function sendToExtension(type, data) {
    console.log(`🚀 Sending ${type} data to extension`);
    
    // Create and dispatch a custom event
    const event = new CustomEvent('archimind-network-intercept', {
      detail: {
        type,
        data,
        timestamp: Date.now()
      }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Check if a URL matches our target endpoints
   */
  function getEndpointType(url) {
    if (!url) return null;
    
    // Parse the URL to get the pathname
    let pathname;
    try {
      // For full URLs
      if (url.startsWith('http')) {
        pathname = new URL(url).pathname;
      } else {
        // For relative URLs
        pathname = url.split('?')[0];
      }
    } catch (e) {
      // If URL parsing fails, use the original URL
      pathname = url;
    }
    
    // More precise endpoint matching
    
    // Check for user info endpoint - exact match for /backend-api/me
    if (pathname === ENDPOINTS.USER_INFO) {
      console.log('🎯 Exact match for user info endpoint:', url);
      return 'userInfo';
    }
    
    // Check for conversations endpoint
    if (pathname.startsWith(ENDPOINTS.CONVERSATIONS) && url.includes('limit=')) {
      return 'conversationList';
    }
    
    // Check for chat completion endpoint
    if (pathname.startsWith(ENDPOINTS.CHAT_COMPLETION)) {
      return 'chatCompletion';
    }
    
    return null;
  }
  
  /**
   * Override fetch API to intercept requests
   */
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const requestId = `${url}-${Date.now()}`;
    
    // Get the endpoint type FIRST to ensure pathname is properly defined
    const endpointType = getEndpointType(url);
    
    // Debug log for important endpoints
    if (url.includes('/backend-api/me')) {
      console.log('🔍 Fetch request to ME endpoint detected:', url);
    }
    
    let requestBody = null;
    
    // Extract request body if present
    if (init && init.body) {
      try {
        const bodyText = typeof init.body === 'string' 
          ? init.body 
          : new TextDecoder().decode(init.body);
          
        if (bodyText.trim().startsWith('{')) {
          requestBody = JSON.parse(bodyText);
        }
      } catch (e) {
        // Silently fail if we can't parse
      }
    }
    
    // Call original fetch
    const response = await originalFetch.apply(this, arguments);
    
    // Only process if it's an endpoint we care about
    if (endpointType && !processedRequests.has(requestId)) {
      processedRequests.add(requestId);
      
      // Clean up processedRequests if it gets too large
      if (processedRequests.size > 1000) {
        const oldestEntries = Array.from(processedRequests).slice(0, 500);
        oldestEntries.forEach(entry => processedRequests.delete(entry));
      }
      
      console.log(`🔔 Processing ${endpointType} endpoint: ${url}`);
      
      // Clone the response to avoid consuming it
      const clonedResponse = response.clone();
      
      // Process response based on type
      try {
        const isStreaming = clonedResponse.headers.get('content-type')?.includes('text/event-stream') || false;
        
        if (!isStreaming) {
          // For normal JSON responses
          clonedResponse.json().then(data => {
            // Special handling for user info endpoint
            if (endpointType === 'userInfo') {
              userInfoProcessed = true;
              console.log('✅ Successfully intercepted user info from network request:', data, endpointType);
            }
            
            sendToExtension(endpointType, {
              url,
              requestBody,
              responseBody: data,
              method: init?.method || 'GET',
              isStreaming: false
            });
          }).catch(e => {
            console.error('Error parsing response JSON:', e);
          });
        } else if (endpointType === 'chatCompletion') {
          // For streaming responses, we need special handling
          sendToExtension(endpointType, {
            url,
            requestBody,
            method: init?.method || 'GET',
            isStreaming: true,
            // We can't send the actual stream, just metadata
            metadata: {
              url,
              headers: Object.fromEntries(clonedResponse.headers.entries()),
              status: clonedResponse.status
            }
          });
        }
      } catch (error) {
        console.error('Error processing intercepted fetch:', error);
      }
    }
    
    // Return original response
    return response;
  };
  
  /**
   * Override XMLHttpRequest to intercept requests
   */
  XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    this._method = method;
    
    // Debug log for important endpoints
    if (url.includes('/backend-api/me')) {
      console.log('🔍 XHR request to ME endpoint detected:', url);
    }
    
    return originalXHROpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    const url = this._url;
    const method = this._method;
    const endpointType = getEndpointType(url);
    const requestId = `xhr-${url}-${Date.now()}`;
    
    // Parse request body if possible
    let requestBody = null;
    if (body) {
      try {
        const bodyText = body.toString();
        if (bodyText.trim().startsWith('{')) {
          requestBody = JSON.parse(bodyText);
        }
      } catch (e) {
        // Silently fail if parsing fails
      }
    }
    
    // Only add listener if it's an endpoint we care about
    if (endpointType && !processedRequests.has(requestId)) {
      processedRequests.add(requestId);
      
      console.log(`🔔 Processing XHR ${endpointType} endpoint: ${url}`);
      
      // Add load event listener
      this.addEventListener('load', function() {
        if (this.status >= 200 && this.status < 300) {
          try {
            const responseText = this.responseText;
            if (responseText) {
              let responseData;
              try {
                responseData = JSON.parse(responseText);
              } catch (e) {
                responseData = { rawText: responseText.substring(0, 1000) };
              }
              
              // Special handling for user info endpoint
              if (endpointType === 'userInfo') {
                userInfoProcessed = true;
                console.log('✅ Successfully intercepted user info from XHR:', responseData);
              }
              
              sendToExtension(endpointType, {
                url,
                requestBody,
                responseBody: responseData,
                method,
                isStreaming: false
              });
            }
          } catch (error) {
            console.error('Error processing XHR response:', error);
          }
        }
      });
    }
    
    // Call original send
    return originalXHRSend.apply(this, arguments);
  };
  
  // FALLBACK: If we missed the initial /backend-api/me request, fetch it manually after a delay
  setTimeout(() => {
    if (!userInfoProcessed) {
      console.log('⚠️ User info not intercepted yet, fetching manually...');
      
      // Make a manual request to get user info
      fetch('/backend-api/me')
        .then(response => response.json())
        .then(data => {
          console.log('✅ Manually fetched user info:', data);
          userInfoProcessed = true;
          
          sendToExtension('userInfo', {
            url: '/backend-api/me',
            requestBody: null,
            responseBody: data,
            method: 'GET',
            isStreaming: false
          });
        })
        .catch(error => {
          console.error('❌ Error fetching user info:', error);
        });
    }
  }, 2000); // Wait 2 seconds after injection to check
  
  // Notify that injection is complete
  sendToExtension('injectionComplete', { status: 'success' });
})();