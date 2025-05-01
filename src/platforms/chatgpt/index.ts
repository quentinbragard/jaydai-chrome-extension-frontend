// src/platforms/chatgpt/index.ts

// Export config directly
export * from "./config";

// Import functions/classes and export them, potentially grouped
import { insertPrompt as chatGPTInsertPrompt } from "./domUtils";
import {
  getEndpointEvent as chatGPTGetEndpointEvent,
  extractRequestBody as chatGPTExtractRequestBody,
  processResponse as chatGPTProcessResponse,
} from "./networkHandler";
import { processChatGPTStreamingResponse } from "./streamProcessor"; // Import the function

// Group DOM utilities
export const CHATGPT_DOM_UTILS = {
  insertPrompt: chatGPTInsertPrompt,
  // Add other DOM utils here if needed
};

// Group Network utilities
export const CHATGPT_NETWORK_HANDLER = {
  getEndpointEvent: chatGPTGetEndpointEvent,
  extractRequestBody: chatGPTExtractRequestBody,
  processResponse: chatGPTProcessResponse,
};

// Group Stream Processing utilities (if needed, or export function directly)
// Exporting as an object for consistency with other handlers
export const CHATGPT_STREAM_PROCESSOR = {
  processStreamingResponse: processChatGPTStreamingResponse,
};

