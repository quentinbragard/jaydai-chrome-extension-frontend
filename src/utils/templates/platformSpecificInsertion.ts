
// src/utils/templates/platformSpecificInsertion.ts
// Platform-specific text insertion helpers

/**
 * Get the appropriate text insertion strategy based on the current platform
 */
function getPlatformInsertionStrategy(): 'chatgpt' | 'claude' | 'generic' {
    const hostname = window.location.hostname;
    
    if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      return 'chatgpt';
    } else if (hostname.includes('claude.ai')) {
      return 'claude';
    } else {
      return 'generic';
    }
  }
  
  /**
   * Claude-specific text insertion
   */
  function insertTextClaude(targetElement: HTMLElement, text: string, cursorPos?: number): boolean {
    if (!targetElement.isContentEditable) return false;
  
    console.log('Attempting Claude-specific insertion');
    
    // Claude uses a complex contenteditable structure
    // Try to insert using document.execCommand first
    targetElement.focus();
    
    // Try to restore cursor position for Claude
    if (typeof cursorPos === 'number') {
      const selection = window.getSelection();
      const range = document.createRange();
      
      // For Claude, we need to be more careful about text nodes
      const textContent = targetElement.textContent || '';
      if (cursorPos <= textContent.length) {
        // Find the right text node and position
        const walker = document.createTreeWalker(
          targetElement,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let currentPos = 0;
        let targetNode = walker.nextNode();
        
        while (targetNode && currentPos + (targetNode.textContent?.length || 0) < cursorPos) {
          currentPos += targetNode.textContent?.length || 0;
          targetNode = walker.nextNode();
        }
        
        if (targetNode) {
          const offsetInNode = cursorPos - currentPos;
          range.setStart(targetNode, Math.min(offsetInNode, targetNode.textContent?.length || 0));
          range.setEnd(targetNode, Math.min(offsetInNode, targetNode.textContent?.length || 0));
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    }
  
    // Try execCommand first (works well with Claude)
    try {
      if (document.execCommand) {
        const success = document.execCommand('insertText', false, text);
        if (success) {
          console.log('Claude insertion successful via execCommand');
          return true;
        }
      }
    } catch (e) {
      console.log('execCommand failed, trying manual insertion');
    }
  
    // Fallback to manual insertion
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      
      // Move cursor after inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('Claude insertion successful via manual method');
      return true;
    }
  
    return false;
  }
  
  /**
   * ChatGPT-specific text insertion
   */
  function insertTextChatGPT(targetElement: HTMLElement, text: string, cursorPos?: number): boolean {
    if (!(targetElement instanceof HTMLTextAreaElement)) return false;
  
    console.log('Attempting ChatGPT-specific insertion');
    
    const start = cursorPos !== undefined ? cursorPos : (targetElement.selectionStart || 0);
    const end = cursorPos !== undefined ? cursorPos : (targetElement.selectionEnd || 0);
    const value = targetElement.value;
    
    // ChatGPT textareas work well with standard insertion
    const newValue = value.substring(0, start) + text + value.substring(end);
    targetElement.value = newValue;
    
    const newCursorPos = start + text.length;
    targetElement.setSelectionRange(newCursorPos, newCursorPos);
    
    // Important: ChatGPT needs both 'input' and 'change' events
    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
    targetElement.dispatchEvent(new Event('change', { bubbles: true }));
    targetElement.focus();
    
    console.log('ChatGPT insertion successful');
    return true;
  }
  
  /**
   * Enhanced insertTextAtCursor with platform-specific strategies
   */
  export function insertTextAtCursorPlatformAware(
    targetElement: HTMLElement, 
    text: string, 
    savedCursorPos?: number
  ): boolean {
    console.log('Platform-aware insertion:', { 
      platform: getPlatformInsertionStrategy(),
      element: targetElement.tagName,
      text: text.substring(0, 50) + '...'
    });
  
    const strategy = getPlatformInsertionStrategy();
    
    // Try platform-specific insertion first
    switch (strategy) {
      case 'claude':
        if (insertTextClaude(targetElement, text, savedCursorPos)) {
          return true;
        }
        break;
        
      case 'chatgpt':
        if (insertTextChatGPT(targetElement, text, savedCursorPos)) {
          return true;
        }
        break;
    }
    
    // Fallback to generic insertion
    return insertTextGeneric(targetElement, text, savedCursorPos);
  }
  
  /**
   * Generic text insertion for any platform
   */
  function insertTextGeneric(targetElement: HTMLElement, text: string, savedCursorPos?: number): boolean {
    console.log('Attempting generic insertion');
    
    // Handle textarea elements
    if (targetElement instanceof HTMLTextAreaElement) {
      const start = savedCursorPos !== undefined ? savedCursorPos : (targetElement.selectionStart || 0);
      const end = savedCursorPos !== undefined ? savedCursorPos : (targetElement.selectionEnd || 0);
      const value = targetElement.value;
      
      const newValue = value.substring(0, start) + text + value.substring(end);
      targetElement.value = newValue;
      
      const newCursorPos = start + text.length;
      targetElement.setSelectionRange(newCursorPos, newCursorPos);
      
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      targetElement.focus();
      
      console.log('Generic textarea insertion successful');
      return true;
    }
  
    // Handle contenteditable elements
    if (targetElement.isContentEditable) {
      targetElement.focus();
      
      // Try to restore cursor position
      if (savedCursorPos !== undefined) {
        const selection = window.getSelection();
        const range = document.createRange();
        
        const textContent = targetElement.textContent || '';
        const walker = document.createTreeWalker(
          targetElement,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let currentPos = 0;
        let targetNode = walker.nextNode();
        
        while (targetNode && currentPos + (targetNode.textContent?.length || 0) < savedCursorPos) {
          currentPos += targetNode.textContent?.length || 0;
          targetNode = walker.nextNode();
        }
        
        if (targetNode) {
          const offsetInNode = savedCursorPos - currentPos;
          range.setStart(targetNode, Math.min(offsetInNode, targetNode.textContent?.length || 0));
          range.setEnd(targetNode, Math.min(offsetInNode, targetNode.textContent?.length || 0));
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
  
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        
        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        
        console.log('Generic contenteditable insertion successful');
        return true;
      }
    }
  
    // Handle input elements
    if (targetElement instanceof HTMLInputElement) {
      const start = savedCursorPos !== undefined ? savedCursorPos : (targetElement.selectionStart || 0);
      const end = savedCursorPos !== undefined ? savedCursorPos : (targetElement.selectionEnd || 0);
      const value = targetElement.value;
      
      const newValue = value.substring(0, start) + text + value.substring(end);
      targetElement.value = newValue;
      
      const newCursorPos = start + text.length;
      targetElement.setSelectionRange(newCursorPos, newCursorPos);
      
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      targetElement.focus();
      
      console.log('Generic input insertion successful');
      return true;
    }
  
    console.warn('Generic insertion failed: unsupported element type');
    return false;
  }