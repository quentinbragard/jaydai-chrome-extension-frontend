export function getCursorPosition(el: HTMLTextAreaElement | HTMLInputElement): { start: number; end: number } {
  return { start: el.selectionStart || 0, end: el.selectionEnd || 0 };
}
