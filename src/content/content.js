// src/content/content.js
// Immediate self-executing function to inject as early as possible
(function() {
  console.log("🚀 Archimind Extension starting up...");

  if (!window.location.hostname.includes('chatgpt.com')) {
    console.log("⚠️ Not on ChatGPT - Archimind not initializing");
    return;
  }

  // INJECT THE INTERCEPTOR IMMEDIATELY - don't wait for DOMContentLoaded
  try {
    console.log("🔥 Injecting interceptor immediately");
    
    // Create the script element
    const script = document.createElement('script');
    script.id = 'archimind-network-interceptor';
    script.src = chrome.runtime.getURL('injectedInterceptor.js');
    
    // Function to actually inject the script
    const injectScript = () => {
      // Try to inject into head or documentElement or body, whichever is available
      const target = document.head || document.documentElement || document.body;
      if (target) {
        target.appendChild(script);
        console.log("✅ Interceptor script injected into", target.tagName);
      } else {
        console.error("❌ No target element available for script injection");
      }
    };
    
    // Try immediate injection
    injectScript();
    
    // Also set up a fallback for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      console.log("🔄 DOMContentLoaded event fired");
      
      // Initialize the rest of the application
      injectModuleScript();
    });
  } catch (error) {
    console.error("❌ Error injecting interceptor:", error);
  }
  
  // Function to load the main module script
  function injectModuleScript() {
    try {
      // Get the URL for the content-init.js module
      const contentInitUrl = chrome.runtime.getURL("content-init.js");
      console.log("📦 Loading module from:", contentInitUrl);
      
      // Import the module
      import(contentInitUrl)
        .then(module => {
          console.log("📦 Imported module:", module);
          
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

          console.log("✅ Archimind Extension initialized successfully");
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
      console.log('🔄 Content script reloading...');
      window.location.reload();
    }
  });
}