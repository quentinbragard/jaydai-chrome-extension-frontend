// 🔹 Open welcome page when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: 'welcome.html' });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const actions = {
        googleSignIn: () => googleSignIn(sendResponse),
        emailSignIn: () => emailSignIn(request.email, request.password, sendResponse),
        getAuthToken: () => sendAuthToken(sendResponse),
        refreshAuthToken: () => refreshAndSendToken(sendResponse),
    };

    if (actions[request.action]) {
        actions[request.action]();
        return true; // Ensures async sendResponse will be used
    } else {
        sendResponse({ success: false, error: "Invalid action" });
        return false; // Ensures message channel is closed
    }
});




/* ==========================================
 🔹 GOOGLE SIGN-IN FLOW
========================================== */
function googleSignIn(sendResponse) {
    const manifest = chrome.runtime.getManifest();
    const authUrl = new URL("https://accounts.google.com/o/oauth2/auth");

    authUrl.searchParams.set("client_id", manifest.oauth2.client_id);
    authUrl.searchParams.set("response_type", "id_token");
    authUrl.searchParams.set("redirect_uri", `https://${chrome.runtime.id}.chromiumapp.org`);
    authUrl.searchParams.set("scope", manifest.oauth2.scopes.join(" "));

    chrome.identity.launchWebAuthFlow({ url: authUrl.href, interactive: true }, async (redirectedUrl) => {
        if (chrome.runtime.lastError) {
            console.error("❌ Google Sign-In failed:", chrome.runtime.lastError);
            return sendResponse({ success: false, error: chrome.runtime.lastError.message });
        }

        const url = new URL(redirectedUrl);
        const params = new URLSearchParams(url.hash.replace("#", "?"));
        const idToken = params.get("id_token");

        if (!idToken) {
            return sendResponse({ success: false, error: "No ID token received" });
        }

        console.log("🔹 Google ID Token:", idToken);

        try {
            const response = await fetch("http://127.0.0.1:8000/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_token: idToken }),
            });

            const data = await response.json();
            if (response.ok) {
                console.log("✅ User authenticated:", data);
                storeAuthSession(data.session);
                storeUserId(data.user.id);
                sendResponse({ success: true, user: data.user, access_token: data.session.access_token });
            } else {
                sendResponse({ success: false, error: data.error });
            }
        } catch (error) {
            console.error("❌ Error sending token to backend:", error);
            sendResponse({ success: false, error: error.message });
        }
    });
}

/* ==========================================
 🔹 EMAIL/PASSWORD SIGN-IN FLOW
========================================== */
async function emailSignIn(email, password, sendResponse) {
    try {
        const response = await fetch("http://127.0.0.1:8000/auth/sign_in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            console.log("✅ Email Sign-In successful:", data);
            storeAuthSession(data.session);
            storeUserId(data.user.id);
            sendResponse({ success: true, user: data.user, access_token: data.session.access_token });
        } else {
            sendResponse({ success: false, error: data.error });
        }
    } catch (error) {
        console.error("❌ Error in email sign-in:", error);
        sendResponse({ success: false, error: error.message });
    }
}

/* ==========================================
 🔹 AUTH TOKEN MANAGEMENT
========================================== */
function sendAuthToken(sendResponse) {
    chrome.storage.local.get(["access_token", "refresh_token", "token_expires_at"], (result) => {
        const now = Math.floor(Date.now() / 1000);
        console.log("🔄 Current time:", now);
        console.log("🔄 Token expires at:", result.token_expires_at);
        console.log("🔄 Result:", result);

        if (result.access_token && result.token_expires_at > now) {
            console.log("✅ Using valid auth token");
            sendResponse({ success: true, token: result.access_token });
        } else {
            console.warn("⚠️ Token expired. Refreshing...");
            refreshAndSendToken(sendResponse);
        }
    });
    return true;
}

function refreshAndSendToken(sendResponse) {
    chrome.storage.local.get(["refresh_token"], async (result) => {
        if (!result.refresh_token) {
            sendResponse({ success: false, error: "No refresh token available" });
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/auth/refresh_token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: result.refresh_token }),
            });

            if (!response.ok) {
                console.error("❌ Token refresh failed:", await response.text());
                return sendResponse({ success: false, error: "Failed to refresh token" });
            }

            const data = await response.json();
            console.log("🔄 Token refreshed:", data);
            storeAuthSession(data.session);
            sendResponse({ success: true, token: data.session.access_token });
        } catch (error) {
            console.error("❌ Error refreshing access token:", error);
            sendResponse({ success: false, error: error.message });
        }
    });
    return true;
}

/**
 * Stores authentication session.
 */
function storeAuthSession(session) {
    if (!session) return;

    console.log("🔄 Storing auth session:", session.expires_at);
    
    chrome.storage.local.set({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        token_expires_at: session.expires_at,
    });
    console.log("🔄 Stored new auth session.");
}

function storeUserId(userId) {
    if (!userId) return;

    chrome.storage.local.set({ userId: userId });
    console.log("🔄 Stored user ID:", userId);
}







/* ==========================================
 🔹 DEV RELOAD
========================================== */


chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.devReloadTimestamp) {
      // Reload all extension pages
      chrome.runtime.reload();
    }
  });


  // Add this to your existing background.js

/* ==========================================
 🔹 NETWORK TRAFFIC MONITORING
========================================== */

// Track active monitoring tabs
const monitoredTabs = new Set();

// Set up network monitoring for a specific tab
function startNetworkMonitoring(tabId, sendResponse) {
  try {
    if (monitoredTabs.has(tabId)) {
      sendResponse({ success: true, message: "Already monitoring this tab" });
      return;
    }
    
    // Use chrome.debugger API to attach to the tab
    chrome.debugger.attach({ tabId }, "1.0", () => {
      if (chrome.runtime.lastError) {
        console.error("❌ Failed to attach debugger:", chrome.runtime.lastError);
        sendResponse({ 
          success: false, 
          error: chrome.runtime.lastError.message 
        });
        return;
      }
      
      // Enable Network domain to capture requests
      chrome.debugger.sendCommand({ tabId }, "Network.enable", {}, () => {
        if (chrome.runtime.lastError) {
          console.error("❌ Failed to enable network monitoring:", chrome.runtime.lastError);
          chrome.debugger.detach({ tabId });
          sendResponse({ 
            success: false, 
            error: chrome.runtime.lastError.message 
          });
          return;
        }
        
        // Successfully set up monitoring
        monitoredTabs.add(tabId);
        console.log("✅ Network monitoring started for tab", tabId);
        sendResponse({ success: true });
      });
    });
  } catch (error) {
    console.error("❌ Error in startNetworkMonitoring:", error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true; // Keep the message channel open for async response
}

// Stop monitoring a tab
function stopNetworkMonitoring(tabId, sendResponse) {
  try {
    if (!monitoredTabs.has(tabId)) {
      sendResponse({ success: true, message: "Tab not being monitored" });
      return;
    }
    
    chrome.debugger.detach({ tabId }, () => {
      if (chrome.runtime.lastError) {
        console.error("❌ Failed to detach debugger:", chrome.runtime.lastError);
        sendResponse({ 
          success: false, 
          error: chrome.runtime.lastError.message 
        });
        return;
      }
      
      monitoredTabs.delete(tabId);
      console.log("✅ Network monitoring stopped for tab", tabId);
      sendResponse({ success: true });
    });
  } catch (error) {
    console.error("❌ Error in stopNetworkMonitoring:", error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true; // Keep the message channel open for async response
}

// Process captured network events
function handleDebuggerEvent(debuggeeId, message, params) {
  const tabId = debuggeeId.tabId;
  
  // We're only interested in completed responses
  if (message === "Network.responseReceived") {
    const { requestId, response } = params;
    
    // Filter for JSON responses from the backend API
    if (response.url.includes('/backend-api/') && 
        response.mimeType.includes('application/json')) {
      
      // Get the response body
      chrome.debugger.sendCommand(
        { tabId },
        "Network.getResponseBody",
        { requestId },
        (response) => {
          if (chrome.runtime.lastError || !response) {
            console.error("❌ Failed to get response body:", chrome.runtime.lastError);
            return;
          }
          
          try {
            // Parse the response body
            const responseBody = JSON.parse(response.body);
            
            // Forward the captured data to the content script
            chrome.tabs.sendMessage(tabId, {
              action: 'network-request-captured',
              data: {
                url: params.response.url,
                status: params.response.status,
                method: params.response.requestMethod,
                responseBody: responseBody,
                timestamp: Date.now()
              }
            });
          } catch (error) {
            console.error("❌ Error processing response body:", error);
          }
        }
      );
    }
  }
}

// Add network monitoring message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const actions = {
    // Add to existing actions
    'start-network-monitoring': () => {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({ success: false, error: "No tab ID available" });
        return false;
      }
      return startNetworkMonitoring(tabId, sendResponse);
    },
    'stop-network-monitoring': () => {
      const tabId = sender.tab?.id;
      if (!tabId) {
        sendResponse({ success: false, error: "No tab ID available" });
        return false;
      }
      return stopNetworkMonitoring(tabId, sendResponse);
    }
  };

  // Merge with your existing action handlers
  if (actions[request.action]) {
    return actions[request.action]();
  }
  
  // Let your existing handler logic continue if action not found here
  return false;
});

// Set up debugger event listener
chrome.debugger.onEvent.addListener(handleDebuggerEvent);

// Clean up monitored tabs when they're closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (monitoredTabs.has(tabId)) {
    chrome.debugger.detach({ tabId }, () => {
      monitoredTabs.delete(tabId);
      console.log("✅ Cleaned up network monitoring for closed tab", tabId);
    });
  }
});