// src/platforms/claude/index.ts

// Export config directly
export * from "./config";

// Import functions and export them grouped
import { insertPrompt as claudeInsertPrompt } from "./domUtils";
import {
  getEndpointEvent as claudeGetEndpointEvent,
  extractRequestBody as claudeExtractRequestBody,
  processResponse as claudeProcessResponse,
} from "./networkHandler";

// Group DOM utilities
export const CLAUDE_DOM_UTILS = {
  insertPrompt: claudeInsertPrompt,
  // Add other DOM utils here if needed
};

// Group Network utilities
export const CLAUDE_NETWORK_HANDLER = {
  getEndpointEvent: claudeGetEndpointEvent,
  extractRequestBody: claudeExtractRequestBody,
  processResponse: claudeProcessResponse,
};

// Export Claude-specific stream processor if/when created
// export const CLAUDE_STREAM_PROCESSOR = { ... };

