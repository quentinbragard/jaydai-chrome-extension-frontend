export function detectPlatform() {
    const hostname = window.location.hostname;
  if (hostname.includes('chatgpt.com')) {
    return 'chatgpt';
  }
  if (hostname.includes('claude.ai')) {
    return 'claude';
  }
  return 'unknown';
}
