// src/utils/templates/insertPrompt.ts

import { insertPrompt } from '../claude/insertPrompt';

/**
 * Detect which AI platform is currently active
 * @returns Platform identifier ('chatgpt', 'claude', or 'unknown')
 */
export function detectPlatform(): 'chatgpt' | 'claude' | 'unknown' {
  // Check for Claude
  if (
    window.location.hostname.includes('claude.ai') ||
    document.querySelector('[aria-label="Write your prompt to Claude"]')
  ) {
    return 'claude';
  }
  
  // Check for ChatGPT
  if (
    window.location.hostname.includes('chatgpt.com') ||
    window.location.hostname.includes('chat.openai.com') ||
    document.querySelector('#prompt-textarea')
  ) {
    return 'chatgpt';
  }
  
  return 'unknown';
}

/**
 * Insert content into ChatGPT textarea
 * @param content Content to insert
 * @returns True if successful, false otherwise
 */
export function insertContentIntoChatGPT(content: string): boolean {
  if (!content) {
    console.error('No content to insert into ChatGPT');
    return false;
  }
  
  try {
    // Find the textarea
    const textarea = document.querySelector('#prompt-textarea');
    if (!textarea) {
      console.error('Could not find ChatGPT textarea element');
      return false;
    }
    
    // Normalize content (preserve all characters including quotes)
    const normalizedContent = content.replace(/\r\n/g, '\n');
    
    // Method 1: Standard textarea approach
    try {
      textarea.focus();
      
      if (textarea instanceof HTMLTextAreaElement) {
        // Set the value directly
        textarea.value = normalizedContent;
        
        // Trigger input event to notify React/ChatGPT of the change
        textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        
        // Position cursor at the end
        textarea.selectionStart = textarea.selectionEnd = normalizedContent.length;
        
        return true;
      }
      
      // For contenteditable divs
      if (textarea instanceof HTMLElement && textarea.isContentEditable) {
        // Properly escape HTML entities
        const escapeHTML = (str: string) => {
          return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        };
        
        // Generate HTML paragraphs with proper escaping
        const paragraphs = normalizedContent.split('\n');
        const paragraphsHTML = paragraphs.map(p => 
          `<p>${escapeHTML(p) || '<br>'}</p>`
        ).join('');
        
        // Set content directly
        textarea.innerHTML = paragraphsHTML;
        
        // Trigger input event
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        
        return true;
      }
    } catch (e) {
      console.warn('Primary method failed for ChatGPT:', e);
      // Continue to fallback methods
    }
    
    // Method 2: document.execCommand approach
    try {
      textarea.focus();
      document.execCommand('insertText', false, normalizedContent);
      return true;
    } catch (e) {
      console.warn('Fallback method failed for ChatGPT:', e);
    }
    
    console.error('All insertion methods failed for ChatGPT');
    return false;
  } catch (error) {
    console.error('Error inserting content into ChatGPT:', error);
    return false;
  }
}

/**
 * Insert content into current AI chat platform
 * Detects platform and routes to appropriate handler
 * 
 * @param content The content to insert
 * @returns True if successful, false otherwise
 */
export function insertContentIntoChat(content: string): boolean {
  if (!content) {
    console.error('No content to insert');
    return false;
  }
  
  const platform = detectPlatform();
  console.log(`Detected platform: ${platform}`);
  
  switch (platform) {
    case 'claude':
      return insertPrompt(content);
    
    case 'chatgpt':
      return insertContentIntoChatGPT(content);
    
    default:
      console.error('Unknown platform, cannot insert content');
      return false;
  }
}

/**
 * Format content for insertion, normalizing line breaks
 * @param content Raw content to format
 * @returns Formatted content
 */
export function formatContentForInsertion(content: string): string {
  if (!content) return '';
  
  return content
    .replace(/\r\n/g, '\n')  // Convert Windows newlines to Unix newlines
    .replace(/\n{3,}/g, '\n\n');  // Normalize excessive newlines (more than 2) to double newlines
}