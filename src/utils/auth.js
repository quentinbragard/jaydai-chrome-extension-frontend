/**
 * Retrieves the current authentication token.
 */
export function getAuthToken() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getAuthToken" }, function(response) {
            if (chrome.runtime.lastError || !response.success) {
                console.error("❌ Error getting auth token:", response.error);
                return reject("Failed to retrieve token.");
            }

            console.log("🔄 Auth token received:", response.token);
            resolve(response.token);
        });
    });
}

/**
 * Refreshes the authentication token when expired.
 */
export function refreshAuthToken() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "refreshAuthToken" }, function(response) {
            if (chrome.runtime.lastError || !response.success) {
                console.error("❌ Failed to refresh token:", response.error);
                return reject("Failed to refresh token.");
            }

            console.log("🔄 New auth token received:", response.token);
            resolve(response.token);
        });
    });
}

/**
 * Gets the currently authenticated user ID
 * @returns {Promise<string|null>} The user ID or null if not authenticated
 */
export async function getUserId() {
  console.log("===========Get User Id");
  
  try {
    // Use promise-based chrome API call
    return new Promise((resolve) => {
      chrome.storage.local.get(['userId'], (result) => {
        const userId = result.userId || null;
        console.log("Retrieved userId:", userId);
        resolve(userId);
      });
    });
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
}