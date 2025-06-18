import {
  removeTriggerFromContentEditable,
  getCursorCoordinates,
  getCursorTextPosition,
} from './slashUtils';
import { quickSelectorManager } from './QuickSelectorManager';

export function handleSlashCommand(target: HTMLTextAreaElement | HTMLElement) {
  let value = '';
  let originalCursorPos = 0;

  if (target instanceof HTMLTextAreaElement) {
    value = target.value;
    originalCursorPos = target.selectionStart || 0;
  } else if (target instanceof HTMLElement && target.isContentEditable) {
    value = target.innerText || target.textContent || '';
    originalCursorPos = getCursorTextPosition(target);
  }

  const triggerRegex = /\/\/j\s?$/i;
  if (!triggerRegex.test(value)) {
    return;
  }

  quickSelectorManager.setInserting(true);

  const triggerMatch = value.match(triggerRegex);
  const triggerLength = triggerMatch ? triggerMatch[0].length : 0;
  const newCursorPos = Math.max(0, originalCursorPos - triggerLength);
  const newValue = value.replace(triggerRegex, '');

  if (target instanceof HTMLTextAreaElement) {
    target.value = newValue;
    const safeCursorPos = Math.min(newCursorPos, newValue.length);
    target.setSelectionRange(safeCursorPos, safeCursorPos);
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (target instanceof HTMLElement && target.isContentEditable) {
    removeTriggerFromContentEditable(target, triggerLength);
  }

  setTimeout(() => {
    try {
      target.focus();
      const position = getCursorCoordinates(target);
      const safeCursorPos = target instanceof HTMLTextAreaElement
        ? Math.min(newCursorPos, target.value.length)
        : Math.min(newCursorPos, (target.textContent || '').length);
      quickSelectorManager.show(position, target, safeCursorPos);
    } catch (error) {
      console.error('Error showing quick selector:', error);
    }
  }, 50);
}
