// src/platforms/chatgpt/streamProcessor.ts
// Logic moved from src/extension/content/injectedInterceptor/streamProcessor.js and converted to TS

import { eventBus } from "@/core/events/EventBus";
import { CHATGPT_EVENTS } from "./config";

// Interfaces for structured data (can be refined based on actual API)
interface ChatGPTMessageMetadata {
  model_slug?: string;
  parent_id?: string;
  initial_text?: string;
  finished_text?: string;
  [key: string]: any; // Allow other metadata fields
}

interface ChatGPTMessageAuthor {
  role: "user" | "assistant" | "tool" | string; // Allow other roles
}

interface ChatGPTMessage {
  id: string;
  author?: ChatGPTMessageAuthor;
  create_time?: number;
  content?: { content_type: string; parts?: string[] };
  metadata?: ChatGPTMessageMetadata;
  status?: string;
  [key: string]: any; // Allow other message fields
}

interface ChatGPTStreamChunk {
  o?: "add" | "append" | "patch";
  p?: string; // Path for append/patch
  v?: any; // Value for add/append/patch
  message?: ChatGPTMessage; // Sometimes the message is nested
  conversation_id?: string;
  type?: string; // e.g., "message_stream_complete"
  [key: string]: any; // Allow other chunk fields
}

interface ThinkingStep {
  id: string;
  role: string;
  content: string;
  createTime?: number;
  parentMessageId?: string;
  initialText?: string;
  finishedText?: string;
}

interface AssistantResponseData {
  messageId: string | null;
  conversationId: string | null;
  model: string | null;
  content: string;
  isComplete: boolean;
  createTime: number | null;
  parentMessageId: string | null;
  currentThinkingStepIndex: number | null; // Track the index of the current step
}

/**
 * Process individual stream data chunks from ChatGPT and update response state.
 * @param data The parsed data chunk from the stream.
 * @param assistantData Current accumulated assistant response data.
 * @param thinkingSteps Array of thinking steps.
 * @returns Updated assistantData and thinkingSteps.
 */
function processStreamChunk(
  data: ChatGPTStreamChunk,
  assistantData: AssistantResponseData,
  thinkingSteps: ThinkingStep[]
): { assistantData: AssistantResponseData; thinkingSteps: ThinkingStep[] } {
  // Handle message stream complete marker
  if (data.type === "message_stream_complete") {
    assistantData.isComplete = true;
    assistantData.conversationId = data.conversation_id || assistantData.conversationId;
    return { assistantData, thinkingSteps };
  }

  // Determine the message object, potentially nested
  const message = data.message || data.v?.message;

  // Handle initial message creation with 'add' operation or directly in data
  if (message && (data.o === "add" || !data.o)) {
    // Extract message metadata
    assistantData.messageId = message.id;
    assistantData.conversationId = data.conversation_id || assistantData.conversationId;
    assistantData.model = message.metadata?.model_slug || assistantData.model || null;
    assistantData.createTime = message.create_time || assistantData.createTime || null;
    assistantData.parentMessageId = message.metadata?.parent_id || assistantData.parentMessageId || null;

    const role = message.author?.role || "unknown";

    // Create a new thinking step entry
    const newStep: ThinkingStep = {
      id: message.id,
      role: role,
      content: message.content?.parts?.[0] || "", // Initial content part if available
      createTime: message.create_time,
      parentMessageId: message.metadata?.parent_id,
      initialText: message.metadata?.initial_text || "",
      finishedText: message.metadata?.finished_text || "",
    };

    thinkingSteps.push(newStep);
    assistantData.currentThinkingStepIndex = thinkingSteps.length - 1;

    // If this is the assistant's final message, initialize its main content
    if (role === "assistant") {
      assistantData.content = newStep.content; // Start with initial content
    }

    return { assistantData, thinkingSteps };
  }

  // Handle content append operations
  if (data.o === "append" && data.p === "/message/content/parts/0" && typeof data.v === "string") {
    if (assistantData.currentThinkingStepIndex !== null) {
      const currentStep = thinkingSteps[assistantData.currentThinkingStepIndex];
      currentStep.content += data.v;

      // If this is the assistant's message, also update the main content
      if (currentStep.role === "assistant") {
        assistantData.content += data.v;
      }
    }
    return { assistantData, thinkingSteps };
  }

  // Handle patch operations (can update status, metadata, or append content)
  if (data.o === "patch" && Array.isArray(data.v)) {
    for (const patch of data.v) {
      if (assistantData.currentThinkingStepIndex !== null) {
          const currentStep = thinkingSteps[assistantData.currentThinkingStepIndex];
          // Check for metadata changes like finished_text
          if (patch.p === "/message/metadata/finished_text") {
            currentStep.finishedText = patch.v;
          }
          // Check for content append within a patch
          if (patch.p === "/message/content/parts/0" && patch.o === "append" && typeof patch.v === "string") {
            currentStep.content += patch.v;
            if (currentStep.role === "assistant") {
              assistantData.content += patch.v;
            }
          }
          // Check for message status changes (e.g., "finished_successfully")
          if (patch.p === "/message/status") {
              // Can potentially use this to mark a step as finished
          }
      }
    }
    return { assistantData, thinkingSteps };
  }

  // Return current state unchanged for any unhandled data format
  return { assistantData, thinkingSteps };
}

/**
 * Process the entire streaming response from ChatGPT.
 * Reads the stream, parses events, processes chunks, and dispatches events.
 * @param response The fetch Response object.
 * @param requestBody The original request body.
 */
export async function processChatGPTStreamingResponse(
  response: Response,
  requestBody: any
): Promise<void> {
  console.log("Jaydai: Processing ChatGPT streaming response...");
  const reader = response.body?.getReader();
  if (!reader) {
    console.error("Jaydai: Failed to get reader from response body.");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  let assistantData: AssistantResponseData = {
    messageId: null,
    conversationId: null,
    model: null,
    content: "",
    isComplete: false,
    createTime: null,
    parentMessageId: requestBody?.parent_message_id || null, // Pre-fill from request if possible
    currentThinkingStepIndex: null,
  };

  let thinkingSteps: ThinkingStep[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("Jaydai: Stream reader finished.");
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete Server-Sent Events (SSE)
      let eventEndIndex;
      while ((eventEndIndex = buffer.indexOf("\n\n")) !== -1) {
        const eventString = buffer.substring(0, eventEndIndex);
        buffer = buffer.substring(eventEndIndex + 2);

        const dataMatch = eventString.match(/data: (.*)/);
        if (!dataMatch || !dataMatch[1]) continue;

        const dataString = dataMatch[1];

        // Handle special "[DONE]" message
        if (dataString === "[DONE]") {
          console.log("Jaydai: Received [DONE] marker.");
          assistantData.isComplete = true;
          // Dispatch final event below, outside the loop
          continue;
        }

        try {
          const chunkData: ChatGPTStreamChunk = JSON.parse(dataString);

          // Dispatch raw chunk event (optional, for debugging or advanced use)
          eventBus.emit(CHATGPT_EVENTS.STREAMING_CHUNK, { rawChunk: chunkData });

          // Process the chunk to update state
          const result = processStreamChunk(chunkData, assistantData, thinkingSteps);
          assistantData = result.assistantData;
          thinkingSteps = result.thinkingSteps;

          // Dispatch interim update event (e.g., for UI feedback)
          // Consider debouncing or throttling this if performance is an issue
          eventBus.emit(CHATGPT_EVENTS.STREAMING_CHUNK + ":processed", {
            ...assistantData,
            thinkingSteps: [...thinkingSteps], // Send copy
            isComplete: false, // Mark as interim
          });

        } catch (error) {
          console.error("Jaydai: Error parsing stream data chunk:", error, "Raw data:", dataString);
        }
      }
    }

    // Final dispatch after stream ends or [DONE] is received
    if (assistantData.messageId) {
      assistantData.isComplete = true; // Ensure marked as complete
      console.log("Jaydai: Stream processing complete. Dispatching final event.");
      eventBus.emit(CHATGPT_EVENTS.STREAMING_COMPLETE, {
        ...assistantData,
        thinkingSteps: [...thinkingSteps], // Send final copy
      });
    } else {
        console.warn("Jaydai: Stream ended but no message ID was captured.");
    }

  } catch (error) {
    console.error("Jaydai: Error processing stream:", error);
    // Attempt to dispatch partial data if an error occurred mid-stream
    if (assistantData.messageId && !assistantData.isComplete) {
        console.warn("Jaydai: Dispatching potentially incomplete data due to stream error.");
        assistantData.isComplete = true; // Mark as complete despite error
        eventBus.emit(CHATGPT_EVENTS.STREAMING_COMPLETE, {
            ...assistantData,
            thinkingSteps: [...thinkingSteps],
        });
    }
  } finally {
    // Ensure reader is cancelled if it exists and stream is done/errored
    if (reader) {
        reader.cancel().catch(e => console.error("Jaydai: Error cancelling stream reader:", e));
    }
  }
}

