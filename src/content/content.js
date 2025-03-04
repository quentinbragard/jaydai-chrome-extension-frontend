(async function main() {
  console.log("🚀 Archimind Extension starting up...");

  if (!window.location.hostname.includes('chatgpt.com')) {
    console.log("⚠️ Not on ChatGPT - Archimind not initializing");
    return;
  }

  try {
    // Get the URL for the content-init.js module
    const contentInitUrl = chrome.runtime.getURL("content-init.js");
    console.log("📦 Loading module from:", contentInitUrl);
    
    // Import the module
    let module;
    try {
      module = await import(contentInitUrl);
      console.log("📦 Imported module:", module);
    } catch (importError) {
      console.error("❌ Failed to import module:", importError);
      return;
    }
    
    // Try to find the initialize and cleanup functions
    // Check both named exports and default export
    const initialize = module.initialize || (module.default && module.default.initialize);
    const cleanup = module.cleanup || (module.default && module.default.cleanup);
    
    console.log("📦 Found initialize function:", typeof initialize);
    console.log("📦 Found cleanup function:", typeof cleanup);

    if (!initialize || typeof initialize !== "function") {
      throw new Error("❌ 'initialize' is not a function. Check module exports.");
    }

    // Initialize based on document ready state
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initialize().catch(err => console.error("❌ Error during initialization:", err));
      });
    } else {
      await initialize().catch(err => console.error("❌ Error during initialization:", err));
    }

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
  } catch (error) {
    console.error("❌ Error in content script:", error);
  }
})();