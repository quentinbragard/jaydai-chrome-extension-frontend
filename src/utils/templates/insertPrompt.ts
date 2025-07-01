
// src/utils/templates/insertPrompt.ts
import { getAdapterByHostname } from '@/platforms/adapters';

export function insertContentIntoChat(content: string): boolean {
  if (!content) {
    console.error('No content to insert');
    return false;
  }
  
  const hostname = window.location.hostname;
  const adapter = getAdapterByHostname(hostname);
  
  if (adapter) {
    return adapter.insertPrompt(formatContentForInsertion(content));
  }
  
  console.error('Unknown platform, cannot insert content');
  return false;
}

export function formatContentForInsertion(content: string): string {
  if (!content) return '';

  return content
    .replace(/\r\n/g, '\n')  // Convert Windows newlines to Unix newlines
    .replace(/\n{3,}/g, '\n\n');  // Normalize excessive newlines
}

export function removePlaceholderBrackets(content: string): string {
  if (!content) return '';
  return content.replace(/\[(.*?)\]/g, '$1');
}