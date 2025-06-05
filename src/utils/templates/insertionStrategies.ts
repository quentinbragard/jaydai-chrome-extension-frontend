export function sanitizeCursorPosition(targetElement: HTMLElement, savedCursorPos?: number): number | undefined {
  if (savedCursorPos === undefined) return undefined;
  if (savedCursorPos < 0 || savedCursorPos > 1_000_000) return undefined;

  let length = 0;
  if (targetElement instanceof HTMLTextAreaElement || targetElement instanceof HTMLInputElement) {
    length = targetElement.value.length;
  } else if (targetElement.isContentEditable) {
    length = (targetElement.textContent || '').length;
  }

  return Math.max(0, Math.min(savedCursorPos, length));
}

export function insertIntoTextarea(textarea: HTMLTextAreaElement, text: string, cursorPos?: number): void {
  const start = cursorPos !== undefined ? cursorPos : textarea.selectionStart || 0;
  const end = cursorPos !== undefined ? cursorPos : textarea.selectionEnd || 0;
  const safeStart = Math.max(0, Math.min(start, textarea.value.length));
  const safeEnd = Math.max(0, Math.min(end, textarea.value.length));

  textarea.value = textarea.value.substring(0, safeStart) + text + textarea.value.substring(safeEnd);
  const newCursor = safeStart + text.length;
  textarea.setSelectionRange(newCursor, newCursor);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

export function insertIntoInput(input: HTMLInputElement, text: string, cursorPos?: number): void {
  const start = cursorPos !== undefined ? cursorPos : input.selectionStart || 0;
  const end = cursorPos !== undefined ? cursorPos : input.selectionEnd || 0;
  const safeStart = Math.max(0, Math.min(start, input.value.length));
  const safeEnd = Math.max(0, Math.min(end, input.value.length));

  input.value = input.value.substring(0, safeStart) + text + input.value.substring(safeEnd);
  const newCursor = safeStart + text.length;
  input.setSelectionRange(newCursor, newCursor);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
}

export function insertIntoContentEditable(element: HTMLElement, text: string, cursorPos?: number): void {
  element.focus();
  if (cursorPos !== undefined) restoreCursorPositionSafely(element, cursorPos);

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();

    if (text.includes('\n')) {
      const fragment = document.createDocumentFragment();
      const lines = text.split('\n');
      lines.forEach((line, i) => {
        if (line) fragment.appendChild(document.createTextNode(line));
        if (i < lines.length - 1) fragment.appendChild(document.createElement('br'));
      });

      const lastNode = fragment.lastChild as ChildNode | null;
      range.insertNode(fragment);

      if (lastNode && lastNode.parentNode) {
        range.setStartAfter(lastNode);
        range.setEndAfter(lastNode);
      } else {
        range.collapse(false);
      }
    } else {
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.setEndAfter(node);
    }

    selection.removeAllRanges();
    selection.addRange(range);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.focus();
    return;
  }

  // Fallback append
  if (text.includes('\n')) {
    const html = text.split('\n').join('<br>');
    element.innerHTML += html;
  } else {
    element.textContent = (element.textContent || '') + text;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.focus();
}

export function restoreCursorPositionSafely(element: HTMLElement, pos: number): boolean {
  try {
    const text = element.textContent || '';
    const safePos = Math.max(0, Math.min(pos, text.length));
    const selection = window.getSelection();
    if (!selection) return false;

    const range = document.createRange();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    let accumulated = 0;
    while (current && accumulated + (current.textContent?.length || 0) < safePos) {
      accumulated += current.textContent?.length || 0;
      current = walker.nextNode();
    }

    if (current) {
      const offset = safePos - accumulated;
      range.setStart(current, Math.min(offset, current.textContent?.length || 0));
      range.collapse(true);
    } else {
      range.selectNodeContents(element);
      range.collapse(false);
    }

    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  } catch {
    return false;
  }
}

export function tryPlatformSpecificInsertion(targetElement: HTMLElement, text: string, pos?: number): boolean {
  const host = window.location.hostname;

  if (host.includes('claude.ai') && targetElement.isContentEditable) {
    targetElement.focus();
    if (typeof pos === 'number') restoreCursorPositionSafely(targetElement, pos);
    try {
      if (document.execCommand && !text.includes('\n')) {
        if (document.execCommand('insertText', false, text)) return true;
      }
    } catch {}
    insertIntoContentEditable(targetElement, text, pos);
    return true;
  }

  if ((host.includes('chatgpt.com') || host.includes('chat.openai.com')) && targetElement instanceof HTMLTextAreaElement) {
    insertIntoTextarea(targetElement, text, pos);
    targetElement.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  return false;
}

export function tryFallbackInsertion(text: string): void {
  const selectors = ['textarea:focus','input[type="text"]:focus','[contenteditable="true"]:focus','textarea','input[type="text"]','[contenteditable="true"]'];
  for (const sel of selectors) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el && isElementVisible(el)) {
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        el.value += text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.focus();
        return;
      }
      if (el.isContentEditable) {
        el.textContent = (el.textContent || '') + text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.focus();
        return;
      }
    }
  }
}

export function isElementVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && el.offsetParent !== null;
}
