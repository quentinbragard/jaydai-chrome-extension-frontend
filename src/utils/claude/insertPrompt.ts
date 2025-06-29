
// src/utils/claude/insertPrompt.ts

/**
 * Utility function to insert content into Claude's input area
 * Preserves formatting, line breaks, and special characters
 * 
 * @param content The text content to insert
 * @returns True if insertion was successful, false otherwise
 */
export function insertPrompt(content: string): boolean {
    if (!content) {
      console.error('No content to insert into Claude');
      return false;
    }
    
    console.log(`Attempting to insert content into Claude (${content.length} chars)`);
    
    try {
      // Find Claude's input area
      // Claude uses a contenteditable div inside the input area
      const inputArea = document.querySelector('[aria-label="Write your prompt to Claude"]');
      
      if (!inputArea) {
        console.error('Could not find Claude input area');
        return false;
      }
      
      // Find the contentEditable div within the input area
      const contentEditableDiv = inputArea.querySelector('[contenteditable="true"]');
      
      if (!contentEditableDiv) {
        console.error('Could not find contentEditable element in Claude input area');
        return false;
      }
      
      // Normalize the content - preserve all newlines and formatting
      const normalizedContent = content.replace(/\r\n/g, '\n');
      
      // Method 1: Try setting innerHTML with paragraph tags for each line
      try {
        // Focus the contentEditable area
        contentEditableDiv.focus();
        
        // Convert content to HTML paragraphs
        const paragraphs = normalizedContent.split('\n');
        const htmlContent = paragraphs.map(paragraph => {
          // Escape HTML entities in the paragraph
          const escapedParagraph = paragraph
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
            
          return paragraph ? `<p>${escapedParagraph}</p>` : '<p><br></p>';
        }).join('');
        
        // Set the innerHTML
        contentEditableDiv.innerHTML = htmlContent;
        
        // Dispatch input event to notify Claude
        contentEditableDiv.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Position cursor at the end
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(contentEditableDiv);
        range.collapse(false); // Collapse to the end
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        return true;
      } catch (error) {
        console.warn('Method 1 (innerHTML) failed:', error);
        // Continue to next method
      }
      
      // Method 2: Use document.execCommand
      try {
        contentEditableDiv.focus();
        
        // Clear existing content
        contentEditableDiv.innerHTML = '';
        
        // Insert text using execCommand
        document.execCommand('insertText', false, normalizedContent);
        
        return true;
      } catch (error) {
        console.warn('Method 2 (execCommand) failed:', error);
        // Continue to next method
      }
      
      // Method 3: Try clipboard approach
      try {
        contentEditableDiv.focus();
        
        // Use clipboard API
        return navigator.clipboard.writeText(normalizedContent)
          .then(() => {
            document.execCommand('paste');
            console.log('Content pasted via Clipboard API');
            return true;
          })
          .catch(err => {
            console.warn('Clipboard API failed:', err);
            throw err;
          });
      } catch (error) {
        console.warn('Method 3 (clipboard) failed:', error);
      }
      
      // Method 4: Final fallback - direct textContent manipulation
      try {
        contentEditableDiv.textContent = normalizedContent;
        contentEditableDiv.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      } catch (error) {
        console.error('All insertion methods failed for Claude:', error);
        return false;
      }
    } catch (error) {
      console.error('Error inserting content into Claude:', error);
      return false;
    }
  }