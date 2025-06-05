export function getCursorPosition(el: HTMLTextAreaElement | HTMLInputElement): { start: number; end: number } {
  return { start: el.selectionStart || 0, end: el.selectionEnd || 0 };
}

export function setCursorPosition(el: HTMLTextAreaElement | HTMLInputElement, pos: number | { start: number; end: number }): void {
  if (typeof pos === 'number') {
    el.setSelectionRange(pos, pos);
  } else {
    el.setSelectionRange(pos.start, pos.end);
  }
  el.focus();
}
