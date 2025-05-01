// src/extension/content/injectedInterceptor/fetchInterceptor.ts
// Renamed to .ts and refactored to use PlatformManager

import {
  getCurrentPlatformNetworkHandler,
  detectPlatform,
} from "@/platforms/PlatformManager"; // Adjust path as needed
import { sendInjectionComplete } from "./eventsHandler"; // Keep event handler for now

/**
 * Store the original fetch method
 */
let originalFetch: typeof window.fetch | null = null;

/**
 * Initialize the fetch interceptor by overriding the global fetch method
 */
export function initFetchInterceptor(): void {
  if (originalFetch) {
    console.warn("Jaydai: Fetch interceptor already initialized.");
    return;
  }

  // Determine the platform early, but don't fail if unknown yet
  const platform = detectPlatform();
  if (platform === "unknown") {
    console.log("Jaydai: Unknown platform, fetch interceptor will not be active initially.");
    // We might still want to intercept later if the platform becomes known
    // or handle this differently depending on requirements.
  }

  // Store original fetch method
  originalFetch = window.fetch;

  // Override fetch to intercept network requests
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const networkHandler = getCurrentPlatformNetworkHandler();
    console.log('==============networkHandler', networkHandler);

    // If no handler for the current platform, or platform is unknown, bypass interception
    if (!networkHandler) {
      return originalFetch!.apply(this, arguments as any);
    }

    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const eventName = networkHandler.getEndpointEvent(url);
    console.log('==============eventName', eventName);
    console.log('==============url', url);

    // Skip irrelevant endpoints for the current platform
    if (!eventName) {
      return originalFetch!.apply(this, arguments as any);
    }

    // Extract request body using platform-specific logic
    const requestBody = networkHandler.extractRequestBody(init);

    // Call original fetch
    const response = await originalFetch!.apply(this, arguments as any);

    // Skip non-successful responses
    if (!response.ok) {
        // Log or handle non-OK responses if needed
        // console.log(`Jaydai: Non-OK response for ${url}: ${response.status}`);
        return response;
    }

    try {
      // Process the response using platform-specific logic
      // Use response.clone() within the handler if the body needs to be read multiple times
      await networkHandler.processResponse(response.clone(), requestBody, eventName);
    } catch (error) {
      console.error("Jaydai: Error in platform network handler:", error);
    }

    // Return the original response to the caller
    return response;
  };

  console.log(`✅ Jaydai: Fetch interceptor initialized for platform: ${platform}`);
  // Notify that injection is complete (might need rethinking location)
  sendInjectionComplete();
}

/**
 * Restore the original fetch method
 */
export function restoreFetch(): void {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
    console.log("Jaydai: Original fetch method restored.");
  }
}

