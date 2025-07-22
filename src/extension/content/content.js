// src/content/content.js
// Immediate self-executing function to inject as early as possible
(function() {

  if (!window.location.hostname.includes('chatgpt.com') &&
      !window.location.hostname.includes('claude.ai') &&
      !window.location.hostname.includes('mistral.ai') &&
      !window.location.hostname.includes('copilot.microsoft.com')) {
    return;
  }

  // INJECT THE INTERCEPTOR IMMEDIATELY - don't wait for DOMContentLoaded
  try {

    // Create the script element
    const script = document.createElement('script');
    script.id = 'jaydai:network-interceptor';
    script.type = 'module';
    script.src = chrome.runtime.getURL('networkInterceptor.js');

    // Function to actually inject the script
    const injectScript = () => {
      const target = document.head || document.documentElement || document.body;
      if (target) {
        target.appendChild(script);
      } else {
        console.error("❌ No target element available for script injection");
      }
    };

    chrome.storage.local.get(['data_collection_enabled'], (result) => {
      if (result.data_collection_enabled !== false) {
        // Try immediate injection
        injectScript();
      } else {
        console.log('Data collection disabled - skipping network interceptor');
      }
    });
    
    // Also set up a fallback for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      
      // Initialize the rest of the application
      injectModuleScript();
    });
  } catch (error) {
    console.error("❌ Error injecting interceptor:", error);
  }
  
  // Function to load the main module script
  function injectModuleScript() {
    try {
      // Get the URL for the applicationInitializer.js module
      const applicationInitializerUrl = chrome.runtime.getURL("applicationInitializer.js");
      
      // Import the module
      import(applicationInitializerUrl)
        .then(module => {
          
          // Try to find the initialize and cleanup functions
          const initialize = module.initialize || (module.default && module.default.initialize);
          const cleanup = module.cleanup || (module.default && module.default.cleanup);
          
          if (!initialize || typeof initialize !== "function") {
            throw new Error("❌ 'initialize' is not a function. Check module exports.");
          }

          // Initialize the application
          initialize().catch(err => console.error("❌ Error during initialization:", err));
          
          // Setup cleanup
          if (cleanup && typeof cleanup === "function") {
            window.addEventListener('beforeunload', () => {
              cleanup();
            });
            
            chrome.runtime.onMessage.addListener((message) => {
              if (message.action === 'reinitialize') {
                cleanup();
                initialize().catch(err => console.error("❌ Error during reinitialization:", err));
              }
            });
          }

        })
        .catch(importError => {
          console.error("❌ Failed to import module:", importError);
        });
    } catch (error) {
      console.error("❌ Error in content script:", error);
    }
  }
})();

if (process.env.NODE_ENV === 'development') {
  chrome.storage.local.onChanged.addListener((changes) => {
    if (changes.devReloadTimestamp) {
      window.location.reload();
    }
  });
}

// Listen for background messages to open dialogs
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openCreateBlockDialog') {
    const content = message.content || '';
    if (window.dialogManager?.openDialog) {
      window.dialogManager.openDialog('createBlock', { initialContent: content });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
  }
  if (message.action === 'openInsertBlockDialog') {
    if (window.dialogManager?.openDialog) {
      window.dialogManager.openDialog('insertBlock');
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
  }
  return true;
});
