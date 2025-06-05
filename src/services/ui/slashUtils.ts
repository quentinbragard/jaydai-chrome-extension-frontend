export function removeTriggerFromContentEditable(element: HTMLElement, triggerLength: number) {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    try {
      const triggerRange = document.createRange();
      const currentNode = range.startContainer;
      const currentOffset = range.startOffset;
      if (currentNode.nodeType === Node.TEXT_NODE) {
        const startOffset = Math.max(0, currentOffset - triggerLength);
        triggerRange.setStart(currentNode, startOffset);
        triggerRange.setEnd(currentNode, currentOffset);
        triggerRange.deleteContents();
        const newRange = document.createRange();
        newRange.setStart(currentNode, startOffset);
        newRange.setEnd(currentNode, startOffset);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        const textContent = element.textContent || '';
        const newText = textContent.replace(/\/\/j\s?$/i, '');
        element.textContent = newText;
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } catch {
      const textContent = element.textContent || '';
      const newText = textContent.replace(/\/\/j\s?$/i, '');
      element.textContent = newText;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } else {
    const textContent = element.textContent || '';
    const newText = textContent.replace(/\/\/j\s?$/i, '');
    element.textContent = newText;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

export function createTextareaMirror(textarea: HTMLTextAreaElement): HTMLDivElement {
  const mirrorDiv = document.createElement('div');
  const computedStyle = window.getComputedStyle(textarea);
  const stylesToCopy = [
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
    'textTransform', 'wordSpacing', 'textIndent', 'textAlign',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
    'whiteSpace', 'wordWrap', 'overflowWrap'
  ];
  stylesToCopy.forEach(prop => {
    (mirrorDiv.style as any)[prop] = computedStyle.getPropertyValue(prop);
  });
  mirrorDiv.style.position = 'absolute';
  mirrorDiv.style.top = '0';
  mirrorDiv.style.left = '0';
  mirrorDiv.style.visibility = 'hidden';
  mirrorDiv.style.height = 'auto';
  mirrorDiv.style.width = textarea.offsetWidth + 'px';
  mirrorDiv.style.minHeight = textarea.offsetHeight + 'px';
  mirrorDiv.style.overflow = 'hidden';
  return mirrorDiv;
}

export function getCursorCoordinates(element: HTMLElement): { x: number; y: number } {
  if (element instanceof HTMLTextAreaElement) {
    const selectionStart = element.selectionStart || 0;
    const mirrorDiv = createTextareaMirror(element);
    const textBeforeCursor = element.value.substring(0, selectionStart);
    mirrorDiv.textContent = textBeforeCursor;
    const cursorSpan = document.createElement('span');
    cursorSpan.textContent = '|';
    mirrorDiv.appendChild(cursorSpan);
    document.body.appendChild(mirrorDiv);
    const spanRect = cursorSpan.getBoundingClientRect();
    const x = spanRect.left;
    const y = spanRect.top - element.scrollTop;
    document.body.removeChild(mirrorDiv);
    return { x, y };
  }
  if (element.isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const tempSpan = document.createElement('span');
      tempSpan.style.position = 'absolute';
      tempSpan.textContent = '|';
      try {
        range.insertNode(tempSpan);
        const rect = tempSpan.getBoundingClientRect();
        const x = rect.left;
        const y = rect.top;
        tempSpan.remove();
        return { x, y };
      } catch {
        tempSpan.remove();
        const rect = element.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      }
    }
  }
  if (element instanceof HTMLInputElement) {
    const selectionStart = element.selectionStart || 0;
    const tempElement = document.createElement('span');
    const computedStyle = window.getComputedStyle(element);
    tempElement.style.font = computedStyle.font;
    tempElement.style.fontSize = computedStyle.fontSize;
    tempElement.style.fontFamily = computedStyle.fontFamily;
    tempElement.style.fontWeight = computedStyle.fontWeight;
    tempElement.style.letterSpacing = computedStyle.letterSpacing;
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.whiteSpace = 'pre';
    const textBeforeCursor = element.value.substring(0, selectionStart);
    tempElement.textContent = textBeforeCursor;
    document.body.appendChild(tempElement);
    const rect = element.getBoundingClientRect();
    const textWidth = tempElement.offsetWidth;
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const x = rect.left + paddingLeft + textWidth;
    const y = rect.top;
    document.body.removeChild(tempElement);
    return { x, y };
  }
  const rect = element.getBoundingClientRect();
  return { x: rect.left, y: rect.top };
}

export function getCursorTextPosition(element: HTMLElement): number {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    return element.selectionStart || 0;
  }
  if (element.isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
      let position = 0;
      let currentNode = walker.nextNode();
      while (currentNode && currentNode !== range.startContainer) {
        position += currentNode.textContent?.length || 0;
        currentNode = walker.nextNode();
      }
      if (currentNode === range.startContainer) {
        position += range.startOffset;
      }
      return position;
    }
  }
  return 0;
}
