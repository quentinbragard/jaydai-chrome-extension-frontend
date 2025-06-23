import { useRef } from 'react';
import { Block } from '@/types/prompts/blocks';
import { toast } from 'sonner';
import {
  buildPromptPart,
  getLocalizedContent,
} from '@/utils/prompts/blockUtils';
import { insertTextAtCursor } from '@/utils/templates/placeholderUtils';

export function useBlockInsertion(
  targetElement: HTMLElement,
  cursorPosition?: number,
  onClose?: () => void,
  triggerLength?: number
) {
  const insertingRef = useRef(false);

  const insertBlock = (block: Block) => {
    if (insertingRef.current) return;
    insertingRef.current = true;
    const content = getLocalizedContent(block.content);
    let text = buildPromptPart(block.type || 'custom', content);

    if (onClose) onClose();

    setTimeout(() => {
      try {
        targetElement.focus();

        // Remove the //j trigger if present
        if (typeof cursorPosition === 'number' && typeof triggerLength === 'number' && triggerLength > 0) {
          if (targetElement instanceof HTMLTextAreaElement) {
            const value = targetElement.value;
            const before = value.slice(0, cursorPosition);
            const after = value.slice(cursorPosition + triggerLength);
            targetElement.value = before + after;
            targetElement.setSelectionRange(cursorPosition, cursorPosition);
            targetElement.dispatchEvent(new Event('input', { bubbles: true }));
            targetElement.dispatchEvent(new Event('change', { bubbles: true }));
          } else if (targetElement.isContentEditable) {
            const textContent = targetElement.textContent || '';
            const before = textContent.slice(0, cursorPosition);
            const after = textContent.slice(cursorPosition + triggerLength);
            targetElement.textContent = before + after;
            // place cursor
            try {
              const selection = window.getSelection();
              if (selection) {
                const range = document.createRange();
                const walker = document.createTreeWalker(targetElement, NodeFilter.SHOW_TEXT, null);
                let currentPos = 0;
                let targetNode = walker.nextNode();
                while (targetNode && currentPos + (targetNode.textContent?.length || 0) < cursorPosition) {
                  currentPos += targetNode.textContent?.length || 0;
                  targetNode = walker.nextNode();
                }
                if (targetNode) {
                  const offset = cursorPosition - currentPos;
                  const nodeLength = targetNode.textContent?.length || 0;
                  const safeOffset = Math.max(0, Math.min(offset, nodeLength));
                  range.setStart(targetNode, safeOffset);
                  range.setEnd(targetNode, safeOffset);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
              }
            } catch (error) {
              console.warn('Failed to adjust cursor in contenteditable:', error);
            }
            targetElement.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }

        let currentContent = '';
        if (targetElement instanceof HTMLTextAreaElement) {
          currentContent = targetElement.value;
        } else if (targetElement.isContentEditable) {
          currentContent = targetElement.textContent || '';
        }

        if (typeof cursorPosition === 'number' && currentContent.length > 0) {
          const beforeCursorRaw = currentContent.substring(0, cursorPosition);
          const afterCursorRaw = currentContent.substring(cursorPosition);

          const beforeCursor = beforeCursorRaw.trim();
          const afterCursor = afterCursorRaw.trim();

          if (beforeCursor.length > 0 && !beforeCursorRaw.endsWith('\n')) {
            text = '\n\n' + text;
          }

          if (afterCursor.length > 0 && !text.endsWith('\n')) {
            text = text + '\n\n';
          } else if (afterCursor.length === 0 && !text.endsWith('\n')) {
            text = text + '\n';
          }
        } else if (currentContent.length > 0) {
          text = text + '\n';
        }

        if (
          targetElement instanceof HTMLTextAreaElement &&
          typeof cursorPosition === 'number'
        ) {
          const safePosition = Math.max(0, Math.min(cursorPosition, targetElement.value.length));
          targetElement.setSelectionRange(safePosition, safePosition);
        }

        if (targetElement.isContentEditable && typeof cursorPosition === 'number') {
          const textContent = targetElement.textContent || '';
          const safePosition = Math.max(0, Math.min(cursorPosition, textContent.length));

          try {
            const selection = window.getSelection();
            if (selection) {
              const range = document.createRange();
              const walker = document.createTreeWalker(targetElement, NodeFilter.SHOW_TEXT, null);

              let currentPos = 0;
              let targetNode = walker.nextNode();

              while (targetNode && currentPos + (targetNode.textContent?.length || 0) < safePosition) {
                currentPos += targetNode.textContent?.length || 0;
                targetNode = walker.nextNode();
              }

              if (targetNode) {
                const offsetInNode = safePosition - currentPos;
                const nodeLength = targetNode.textContent?.length || 0;
                const safeOffset = Math.max(0, Math.min(offsetInNode, nodeLength));

                range.setStart(targetNode, safeOffset);
                range.setEnd(targetNode, safeOffset);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          } catch (error) {
            console.warn('Failed to restore cursor position in contenteditable:', error);
          }
        }

        insertTextAtCursor(targetElement, text, cursorPosition);
        toast.success(`Inserted ${getLocalizedContent(block.title)} block`);

        setTimeout(() => {
          if (
            (window as any).slashCommandService &&
            typeof (window as any).slashCommandService.refreshListener === 'function'
          ) {
            (window as any).slashCommandService.refreshListener();
          }
        }, 300);
      } catch (error) {
        console.error('Error inserting text:', error);
        toast.error('Failed to insert block');
      } finally {
        setTimeout(() => {
          insertingRef.current = false;
        }, 50);
      }
    }, 100);
  };

  return { insertBlock };
}
