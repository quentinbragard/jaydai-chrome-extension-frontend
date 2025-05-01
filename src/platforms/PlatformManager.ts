// src/platforms/PlatformManager.ts
import {
  CHATGPT_SELECTORS,
  CHATGPT_ENDPOINTS,
  CHATGPT_EVENTS,
  CHATGPT_DOM_UTILS,
  CHATGPT_NETWORK_HANDLER,
} from "./chatgpt";
import {
  CLAUDE_SELECTORS,
  CLAUDE_ENDPOINTS,
  CLAUDE_EVENTS,
  CLAUDE_DOM_UTILS,
  CLAUDE_NETWORK_HANDLER,
} from "./claude";

export type Platform = "chatgpt" | "claude" | "unknown";

// Interfaces for the parts of the platform configuration/handlers
export interface PlatformSelectors {
  promptTextarea: string;
  // Add other common selector keys if needed, or use Record<string, string>
}

export interface PlatformEndpoints {
  // Define common endpoint keys or use Record<string, string | RegExp>
  CHAT_COMPLETION: string | RegExp;
  [key: string]: string | RegExp; // Allow other platform-specific endpoints
}

export interface PlatformEvents {
  // Define common event keys or use Record<string, string>
  CHAT_COMPLETION: string;
  STREAMING_CHUNK: string;
  STREAMING_COMPLETE: string;
  [key: string]: string; // Allow other platform-specific events
}

export interface PlatformNetworkHandler {
  getEndpointEvent(url: string): string | null;
  extractRequestBody(init?: RequestInit): any | null;
  processResponse(
    response: Response,
    requestBody: any,
    eventName: string
  ): Promise<void>;
  // Add other network-related methods if needed
}

export interface PlatformDOMUtils {
  insertPrompt(content: string): boolean;
  // Add other DOM-related methods if needed
}

// Combined strategy interface
export interface PlatformStrategy {
  selectors: PlatformSelectors;
  endpoints: PlatformEndpoints;
  events: PlatformEvents;
  networkHandler: PlatformNetworkHandler;
  domUtils: PlatformDOMUtils;
}

let currentPlatform: Platform | null = null;

/**
 * Detect which AI platform is currently active based on URL and DOM elements.
 * Caches the result after the first detection.
 * @returns Platform identifier ("chatgpt", "claude", or "unknown")
 */
export function detectPlatform(): Platform {
  if (currentPlatform) {
    return currentPlatform;
  }

  const hostname = window.location.hostname;

  // Check for Claude
  if (
    hostname.includes("claude.ai") ||
    document.querySelector(CLAUDE_SELECTORS.promptTextarea) // Use imported selectors
  ) {
    currentPlatform = "claude";
    return currentPlatform;
  }

  // Check for ChatGPT
  if (
    hostname.includes("chatgpt.com") ||
    hostname.includes("chat.openai.com") ||
    document.querySelector(CHATGPT_SELECTORS.promptTextarea) // Use imported selectors
  ) {
    currentPlatform = "chatgpt";
    return currentPlatform;
  }

  currentPlatform = "unknown";
  return currentPlatform;
}

/**
 * Get the strategy object (config, handlers) for the currently detected platform.
 * @returns The PlatformStrategy object or null if the platform is unknown.
 */
export function getCurrentPlatformStrategy(): PlatformStrategy | null {
  const platform = detectPlatform();

  switch (platform) {
    case "chatgpt":
      return {
        selectors: CHATGPT_SELECTORS,
        endpoints: CHATGPT_ENDPOINTS,
        events: CHATGPT_EVENTS,
        networkHandler: CHATGPT_NETWORK_HANDLER,
        domUtils: CHATGPT_DOM_UTILS,
      };
    case "claude":
      return {
        selectors: CLAUDE_SELECTORS,
        endpoints: CLAUDE_ENDPOINTS,
        events: CLAUDE_EVENTS,
        networkHandler: CLAUDE_NETWORK_HANDLER,
        domUtils: CLAUDE_DOM_UTILS,
      };
    default:
      console.warn("Jaydai: Unknown platform detected.");
      return null;
  }
}

// Helper function to get just the selectors
export function getCurrentPlatformSelectors(): PlatformSelectors | null {
  return getCurrentPlatformStrategy()?.selectors ?? null;
}

// Helper function to get just the endpoints
export function getCurrentPlatformEndpoints(): PlatformEndpoints | null {
  return getCurrentPlatformStrategy()?.endpoints ?? null;
}

// Helper function to get just the events
export function getCurrentPlatformEvents(): PlatformEvents | null {
  return getCurrentPlatformStrategy()?.events ?? null;
}

// Helper function to get just the network handler
export function getCurrentPlatformNetworkHandler(): PlatformNetworkHandler | null {
  return getCurrentPlatformStrategy()?.networkHandler ?? null;
}

// Helper function to get just the DOM utils
export function getCurrentPlatformDOMUtils(): PlatformDOMUtils | null {
  return getCurrentPlatformStrategy()?.domUtils ?? null;
}

