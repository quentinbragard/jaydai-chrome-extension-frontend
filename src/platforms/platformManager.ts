// src/platforms/platformManager.ts
import { getAdapterByName, getAdapterByHostname } from './adapters';

export function detectPlatform(): string {
  const hostname = window.location.hostname;
  const adapter = getAdapterByHostname(hostname);
  return adapter ? adapter.name : 'unknown';
}

export function handleConversationList(event: CustomEvent): Promise<void> {
  const platform = event.detail.platform;
  const responseBody = event.detail.responseBody;
  const adapter = getAdapterByName(platform);
  
  if (adapter) {
    return adapter.handleConversationList(responseBody);
  }
  
  return Promise.resolve();
}

export function handleSpecificConversation(event: CustomEvent): Promise<void> {
  const platform = event.detail.platform;
  const responseBody = event.detail.responseBody;
  const adapter = getAdapterByName(platform);
  
  if (adapter) {
    return adapter.handleSpecificConversation(responseBody);
  }
  
  return Promise.resolve();
}

export function handleChatCompletion(event: CustomEvent): void {
  console.log('handleChatCompletion❤️❤️❤️:', event);
  const platform = event.detail.platform;
  const adapter = getAdapterByName(platform);
  
  if (adapter) {
    adapter.handleChatCompletion(event);
  }
}

export function handleAssistantResponse(event: CustomEvent): void {
  const platform = event.detail.platform;
  const adapter = getAdapterByName(platform);
  
  if (adapter) {
    adapter.handleAssistantResponse(event);
  }
}

export function insertContentIntoChat(content: string): boolean {
  const hostname = window.location.hostname;
  const adapter = getAdapterByHostname(hostname);
  
  if (adapter) {
    return adapter.insertPrompt(content);
  }
  
  console.error('Unknown platform, cannot insert content');
  return false;
}