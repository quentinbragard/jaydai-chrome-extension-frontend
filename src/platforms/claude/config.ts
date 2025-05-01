// src/platforms/claude/config.ts

export const CLAUDE_SELECTORS = {
  // Based on detectPlatform and claude/insertPrompt.ts, but might need verification
  promptTextarea: '[aria-label="Write your prompt to Claude"]', // Or potentially a more stable selector
  // Add other relevant selectors here as needed
};

// Note: Claude endpoint detection might rely more on observing fetch patterns
// than specific static paths, especially for chat completions.
// These are placeholders and will need refinement during networkHandler implementation.
export const CLAUDE_ENDPOINTS = {
  // Placeholder - Claude endpoints need investigation
  CHAT_COMPLETION: "/api/append_message", // Example, needs verification
  // Add other relevant endpoints here
};

export const CLAUDE_EVENTS = {
  CHAT_COMPLETION: "claude:chat-completion",
  STREAMING_CHUNK: "claude:streaming-chunk",
  STREAMING_COMPLETE: "claude:streaming-complete",
  // Add other relevant events here
};

