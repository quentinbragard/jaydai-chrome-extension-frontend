export function calculateDropdownPosition(
  position: { x: number; y: number },
  maxWidth = 400,
  maxHeight = 480,
  padding = 10
) {
  let x = position.x;
  let y = position.y + 25;

  if (x + maxWidth > window.innerWidth - padding) {
    x = window.innerWidth - maxWidth - padding;
  }

  if (y + maxHeight > window.innerHeight - padding) {
    y = position.y - maxHeight - 10;
  }

  x = Math.max(padding, x);
  y = Math.max(padding, y);

  return { x, y };
}
