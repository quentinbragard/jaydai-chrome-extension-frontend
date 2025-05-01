// src/extension/content/applicationInitializer.ts

import { serviceManager } from "@/core/managers/ServiceManager";
import { registerServices } from "@/services";
import { componentInjector } from "@/core/utils/componentInjector";
import { eventManager } from "@/core/events/EventManager";
import { errorReporter } from "@/core/errors/ErrorReporter";
import { AppError, ErrorCode } from "@/core/errors/AppError";
import Main from "@/components/Main";
import { detectPlatform } from "@/platforms/PlatformManager"; // Import platform detection

/**
 * Main application initializer
 * Coordinates the initialization of all services and components
 */
export class AppInitializer {
  private static instance: AppInitializer;
  private isInitialized: boolean = false;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  /**
   * Initialize the application
   */
  public async initialize(): Promise<boolean> {
    // Skip if already initialized
    if (this.isInitialized) {
      console.log("Jaydai: Already initialized, skipping.");
      return true;
    }

    // Detect the current platform
    const platform = detectPlatform();

    // Skip if the platform is unknown or unsupported
    if (platform === "unknown") {
      console.log("Jaydai: Unknown platform, skipping application initialization.");
      return false;
    }

    try {
      console.log(`🚀 Initializing Jaydai application for platform: ${platform}...`);

      // Inject UI components - Main component will set up the dialog system
      // Adding a slight delay might help ensure the target page's structure is stable
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.injectUIComponents();

      // Register all services
      registerServices();

      // Initialize event manager first
      eventManager.initialize();

      // Initialize services
      const servicesInitialized = await serviceManager.initializeAll();
      if (!servicesInitialized) {
        throw new Error("Failed to initialize services");
      }

      this.isInitialized = true;
      console.log("✅ Jaydai application initialized successfully");
      return true;
    } catch (error) {
      errorReporter.captureError(
        new AppError("Failed to initialize application", ErrorCode.EXTENSION_ERROR, error)
      );
      console.error("❌ Error initializing application:", error);
      return false;
    }
  }

  // Removed isChatGPTSite and isClaudeSite methods as detectPlatform is now used

  /**
   * Inject UI components
   */
  private injectUIComponents(): void {
    console.log("Jaydai: Injecting UI components..."); // Updated log message

    // Inject the Main component which includes DialogProvider
    componentInjector.inject(Main, {}, {
      id: "jaydai-main-component",
      position: {
        type: "fixed",
        zIndex: "9999",
      },
    });

    console.log("Jaydai: UI components injected."); // Updated log message
  }

  /**
   * Clean up all resources
   */
  public cleanup(): void {
    if (!this.isInitialized) return;

    console.log("🧹 Cleaning up Jaydai application..."); // Updated log message

    // Remove UI components
    componentInjector.removeAll();

    // Clean up services
    serviceManager.cleanupAll();

    // Clean up event manager
    eventManager.cleanup();

    this.isInitialized = false;
    console.log("✅ Jaydai application cleaned up"); // Updated log message
  }
}

// Export a singleton instance
export const appInitializer = AppInitializer.getInstance();

// Default export for module imports
export default {
  initialize: () => appInitializer.initialize(),
  cleanup: () => appInitializer.cleanup(),
};