/**
 * Retrieves the current authentication token with improved error handling.
 */
export function getAuthToken() {
  return new Promise((resolve, reject) => {
      try {
          chrome.runtime.sendMessage({ action: "getAuthToken" }, function(response) {
              // Check for Chrome runtime errors
              if (chrome.runtime.lastError) {
                  console.error("❌ Chrome runtime error:", chrome.runtime.lastError.message);
                  return reject("Failed to retrieve token due to runtime error.");
              }
              
              // Check for missing or invalid response
              if (!response) {
                  console.error("❌ No response received for auth token request");
                  return reject("No response received for token request.");
              }
              
              // Check for unsuccessful response
              if (!response.success) {
                  console.error("❌ Token request unsuccessful:", response.error || "Unknown error");
                  return reject(response.error || "Failed to retrieve token.");
              }
              
              // Check if token exists in response
              if (!response.token) {
                  console.error("❌ No token in response");
                  return reject("Token missing in response.");
              }
              
              console.log("🔑 Auth token received successfully");
              resolve(response.token);
          });
      } catch (error) {
          console.error("❌ Unexpected error in getAuthToken:", error);
          reject("Unexpected error retrieving token: " + error.message);
      }
  });
}

/**
* Refreshes the authentication token when expired.
*/
export function refreshAuthToken() {
  return new Promise((resolve, reject) => {
      try {
          chrome.runtime.sendMessage({ action: "refreshAuthToken" }, function(response) {
              if (chrome.runtime.lastError) {
                  console.error("❌ Failed to refresh token:", chrome.runtime.lastError.message);
                  return reject("Failed to refresh token due to runtime error.");
              }
              
              if (!response || !response.success) {
                  console.error("❌ Token refresh unsuccessful:", response?.error || "Unknown error");
                  return reject(response?.error || "Failed to refresh token.");
              }
              
              if (!response.token) {
                  console.error("❌ No token in refresh response");
                  return reject("Token missing in refresh response.");
              }
              
              console.log("🔄 New auth token received");
              resolve(response.token);
          });
      } catch (error) {
          console.error("❌ Unexpected error in refreshAuthToken:", error);
          reject("Unexpected error refreshing token: " + error.message);
      }
  });
}

/**
* Gets the currently authenticated user ID with better error handling
* @returns {Promise<string|null>} The user ID or null if not authenticated
*/
export async function getUserId() {
  console.log("Getting User Id");

  try {
      // Use promise-based chrome API call with improved error handling
      return new Promise((resolve) => {
          try {
              chrome.storage.local.get(['userId'], (result) => {
                  // Handle missing or undefined result
                  if (!result || typeof result !== 'object') {
                      console.warn("⚠️ Storage result is invalid:", result);
                      resolve(null);
                      return;
                  }
                  
                  const userId = result.userId || null;
                  console.log("Retrieved userId:", userId);
                  resolve(userId);
              });
          } catch (storageError) {
              console.error("❌ Chrome storage error:", storageError);
              resolve(null);
          }
      });
  } catch (error) {
      console.error("❌ Error getting user ID:", error);
      return null;
  }
}