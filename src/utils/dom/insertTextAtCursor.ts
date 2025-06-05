export function insertTextAtCursor(target: HTMLElement, text: string) {
  if (!target) return;
  if (target instanceof HTMLTextAreaElement) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const before = target.value.slice(0, start);
    const after = target.value.slice(end);
    target.value = before + text + after;
    const newPos = start + text.length;
    target.selectionStart = target.selectionEnd = newPos;
    target.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    target.focus();
    return;
  }

  if (target.isContentEditable) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    selection.removeAllRanges();
    selection.addRange(range);
    (target as HTMLElement).dispatchEvent(new Event('input', { bubbles: true }));
    target.focus();
  }
}
