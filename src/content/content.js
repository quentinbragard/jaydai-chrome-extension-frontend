(async function main() {
  console.log("🚀 Archimind Extension starting up...");

  try {
    const initModuleUrl = chrome.runtime.getURL("content-init.js");
    const module = await import(initModuleUrl);

    console.log("📦 Imported module:", module);

    if (!module.initialize || typeof module.initialize !== "function") {
      throw new Error("❌ 'initialize' is not a function. Check module exports.");
    }

    await module.initialize();
    console.log("✅ Archimind Extension initialized successfully");
  } catch (error) {
    console.error("❌ Error in content script:", error);
  }
})();
