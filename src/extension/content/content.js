// src/content/content.js
// Immediate self-executing function to inject scripts as early as possible
(function() {
  // Basic check to avoid injecting on completely unrelated sites.
  // More specific platform detection happens within the injected/initialized scripts.
  const host = window.location.hostname;
  const isPotentiallySupported = host.includes('chatgpt.com') || host.includes('chat.openai.com') || host.includes('claude.ai');

  if (!isPotentiallySupported) {
    // console.log("Jaydai: Hostname not recognized as potentially supported, skipping injection.");
    return;
  }
  console.log(`Jaydai: Hostname ${host} potentially supported, proceeding with injection.`);

  // INJECT THE INTERCEPTOR SCRIPT (runs in page context)
  try {
    const interceptorScript = document.createElement('script');
    interceptorScript.id = 'jaydai:network-interceptor-script'; // Use a more specific ID
    // Ensure the correct entry point name from vite.config.ts is used
    interceptorScript.src = chrome.runtime.getURL('injectedInterceptor.js');

    // Inject into head or documentElement as early as possible
    (document.head || document.documentElement).appendChild(interceptorScript);
    // Clean up the script element after adding it
    interceptorScript.onload = () => interceptorScript.remove();
    console.log("Jaydai: Injected network interceptor script.");

  } catch (error) {
    console.error("Jaydai: Error injecting network interceptor script:", error);
  }

  // INJECT THE APPLICATION INITIALIZER SCRIPT (runs in page context)
  // This script sets up things needed by the main content script, if any.
  try {
    const appInitScript = document.createElement('script');
    appInitScript.id = 'jaydai:app-initializer-script';
    // Ensure the correct entry point name from vite.config.ts is used
    appInitScript.src = chrome.runtime.getURL('applicationInitializer.js');

    (document.head || document.documentElement).appendChild(appInitScript);
    appInitScript.onload = () => appInitScript.remove();
    console.log("Jaydai: Injected application initializer script.");

  } catch (error) {
    console.error("Jaydai: Error injecting application initializer script:", error);
  }

  // LOAD THE MAIN CONTENT SCRIPT MODULE (runs in isolated content script context)
  // This runs after the DOM is ready to ensure UI elements can be targeted if needed.
  function loadContentModule() {
      try {
          // Get the URL for the content-init.js module (main content script logic)
          const contentInitUrl = chrome.runtime.getURL("content-init.js");

          import(contentInitUrl)
              .then(module => {
                  console.log("Jaydai: Imported content-init module.");
                  const initialize = module.initialize || (module.default && module.default.initialize);
                  const cleanup = module.cleanup || (module.default && module.default.cleanup);

                  if (typeof initialize !== "function") {
                      throw new Error("Jaydai: 'initialize' function not found or not a function in content-init module.");
                  }

                  // Initialize the main content script logic
                  initialize().catch(err => console.error("Jaydai: Error during content-init initialization:", err));

                  // Setup cleanup logic
                  if (typeof cleanup === "function") {
                      window.addEventListener('beforeunload', cleanup);
                      // Consider if reinitialization logic is still needed or handled differently
                      chrome.runtime.onMessage.addListener((message) => {
                          if (message.action === 'reinitialize') {
                              console.log("Jaydai: Received reinitialize message.");
                              cleanup();
                              initialize().catch(err => console.error("Jaydai: Error during reinitialization:", err));
                          }
                      });
                  } else {
                      console.warn("Jaydai: No cleanup function found in content-init module.");
                  }
              })
              .catch(importError => {
                  console.error("Jaydai: Failed to import content-init module:", importError);
              });
      } catch (error) {
          console.error("Jaydai: Error in loadContentModule:", error);
      }
  }

  // Wait for the DOM to be ready before loading the main content script module
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadContentModule);
  } else {
      loadContentModule();
  }

})();

// Development HMR Reload Logic (Keep as is)
if (process.env.NODE_ENV === 'development') {
  chrome.storage.local.onChanged.addListener((changes) => {
    if (changes.devReloadTimestamp) {
      window.location.reload();
    }
  });
}