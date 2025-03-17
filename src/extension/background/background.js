// 🔹 Open welcome page when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: 'welcome.html' });
});

// Track active monitoring tabs (if still needed)
const monitoredTabs = new Set();

// Main message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const actions = {
        // Auth actions
        googleSignIn: () => googleSignIn(sendResponse),
        emailSignIn: () => emailSignIn(request.email, request.password, sendResponse),
        getAuthToken: () => sendAuthToken(sendResponse),
        refreshAuthToken: () => refreshAndSendToken(sendResponse),
        
        // Locale actions
        getUserLocale: () => {
            // Get user's preferred locale
            const locale = chrome.i18n.getUILanguage();
            sendResponse({ success: true, locale });
            return false;
        },
        
        // Network monitoring actions - simplified
        'start-network-monitoring': () => {
            console.log('🔍 Starting network monitoring (simplified version)...');
            // Just return success since the injected interceptor will handle actual monitoring
            sendResponse({ success: true });
            return false;
        },
        'stop-network-monitoring': () => {
            console.log('🔍 Stopping network monitoring (simplified version)...');
            // Just return success
            sendResponse({ success: true }); 
            return false;
        },
        'network-request-captured': () => {
            // Pass through the captured request to content script if needed
            if (sender.tab?.id) {
                chrome.tabs.sendMessage(sender.tab.id, {
                    action: 'network-request-captured',
                    data: request.data
                });
            }
            sendResponse({ success: true });
            return false;
        }
    };

    if (actions[request.action]) {
        if (typeof actions[request.action] === 'function') {
            return actions[request.action]();
        }
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
    
    return true; // Keep channel open for async response
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
            storeUser(data.user);
            sendResponse({ success: true, user: data.user, access_token: data.session.access_token });
        } else {
            sendResponse({ success: false, error: data.error });
        }
    } catch (error) {
        console.error("❌ Error in email sign-in:", error);
        sendResponse({ success: false, error: error.message });
    }
    
    return true; // Keep channel open for async response
}

/* ==========================================
 🔹 AUTH TOKEN MANAGEMENT
========================================== */
function sendAuthToken(sendResponse) {
    chrome.storage.local.get(["access_token", "refresh_token", "token_expires_at"], (result) => {
        const now = Math.floor(Date.now() / 1000);
        console.log("🔄 Current time:", now);
        console.log("🔄 Token expires at:", result.token_expires_at);

        if (result.access_token && result.token_expires_at > now) {
            console.log("✅ Using valid auth token");
            sendResponse({ success: true, token: result.access_token });
        } else {
            console.warn("⚠️ Token expired. Refreshing...");
            refreshAndSendToken(sendResponse);
        }
    });
    return true; // Keep channel open for async response
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
    return true; // Keep channel open for async response
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

function storeUser(user) {
    if (!user) return;

    chrome.storage.local.set({ user: user });
    console.log("🔄 Stored user:", user.id);
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