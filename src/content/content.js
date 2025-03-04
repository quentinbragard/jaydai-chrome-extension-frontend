(async function main() {
  console.log("🚀 Archimind Extension starting up...");

  if (!window.location.hostname.includes('chatgpt.com')) {
    console.log("⚠️ Not on ChatGPT - Archimind not initializing");
    return;
  }

  try {
    const contentInitUrl = chrome.runtime.getURL("content-init.js");
    const module = await import(contentInitUrl);
    
    console.log("📦 Imported module:", module);
    console.log("📦 Imported module.initialize:", module.initialize);
    console.log("📦 Imported module.cleanup:", module.cleanup);

    const { initialize, cleanup } = module;

    if (!initialize || typeof initialize !== "function") {
      throw new Error("❌ 'initialize' is not a function. Check module exports.");
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initialize();
      });
    } else {
      await initialize();
    }

    window.addEventListener('beforeunload', () => {
      if (cleanup) cleanup();
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'reinitialize') {
        cleanup();
        initialize();
      }
    });

    console.log("✅ Archimind Extension initialized successfully");
  } catch (error) {
    console.error("❌ Error in content script:", error);
  }
})();
