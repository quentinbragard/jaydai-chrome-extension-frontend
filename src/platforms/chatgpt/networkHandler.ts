// src/platforms/chatgpt/networkHandler.ts
import { eventBus } from "@/core/events/EventBus"; // Use the eventBus instance
import { processChatGPTStreamingResponse } from "./streamProcessor"; // Use the new stream processor
import { CHATGPT_ENDPOINTS, CHATGPT_EVENTS } from "./config";

/**
 * Determines the event to dispatch based on a URL for ChatGPT.
 * @param {string} url - The URL to analyze
 * @returns {string|null} - The event name to dispatch or null if not recognized
 */
export function getEndpointEvent(url: string): string | null {
  if (!url) return null;

  // Extract pathname from full URL or relative path
  const pathname = url.startsWith("http")
    ? new URL(url).pathname
    : url.split("?")[0];

  // Check against specific conversation pattern (RegExp)
  if (CHATGPT_ENDPOINTS.SPECIFIC_CONVERSATION_REGEX.test(pathname)) {
    return CHATGPT_EVENTS.SPECIFIC_CONVERSATION;
  }

  // Check against other endpoints (direct string matches)
  if (pathname === CHATGPT_ENDPOINTS.USER_INFO) {
    return CHATGPT_EVENTS.USER_INFO;
  }

  if (pathname.startsWith(CHATGPT_ENDPOINTS.CONVERSATIONS_LIST)) {
    return CHATGPT_EVENTS.CONVERSATIONS_LIST;
  }

  if (pathname.startsWith(CHATGPT_ENDPOINTS.CHAT_COMPLETION)) {
    return CHATGPT_EVENTS.CHAT_COMPLETION;
  }

  return null;
}

/**
 * Extracts request body data from fetch init parameter.
 * @param {Object} init - The init parameter from fetch
 * @returns {Object|null} - Parsed body or null if not parseable
 */
export function extractRequestBody(init?: RequestInit): any | null {
  if (!init || !init.body) return null;

  try {
    const bodyText =
      typeof init.body === "string"
        ? init.body
        : new TextDecoder().decode(init.body);

    if (bodyText.trim().startsWith("{")) {
      return JSON.parse(bodyText);
    }
  } catch (e) {
    // Silent fail on parse errors
    console.error("Jaydai: Error parsing request body:", e);
  }

  return null;
}

/**
 * Processes the response from a fetch call for ChatGPT.
 * @param response The fetch Response object.
 * @param requestBody The parsed request body.
 * @param eventName The detected event name for this endpoint.
 */
export async function processResponse(
  response: Response,
  requestBody: any,
  eventName: string
): Promise<void> {
  const isStreaming =
    response.headers.get("content-type")?.includes("text/event-stream") || false;

  if (eventName === CHATGPT_EVENTS.CHAT_COMPLETION) {
    // Dispatch chat completion event (request part)
    eventBus.emit(CHATGPT_EVENTS.CHAT_COMPLETION, { requestBody });

    // Process streaming responses
    if (isStreaming && requestBody?.messages?.[0]?.author?.role === "user") {
      // Call the dedicated stream processor
      await processChatGPTStreamingResponse(response, requestBody);
    }
  } else if (!isStreaming) {
    // For non-streaming endpoints, clone and process response
    const responseData = await response.clone().json().catch(() => null);
    if (responseData) {
      // Dispatch specialized event
      eventBus.emit(eventName, {
        requestBody,
        responseBody: responseData,
      });
    }
  }
}

// Placeholder for stream processing logic - needs to be moved/created
// import { processStreamingResponse } from './streamProcessor';

