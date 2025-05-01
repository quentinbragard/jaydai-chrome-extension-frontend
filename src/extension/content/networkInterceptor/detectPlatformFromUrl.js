export function detectPlatformFromUrl(url) {
  if (url.includes('chatgpt.com')) {
    return 'chatgpt';
  }
  if (url.includes('claude.ai')) {
    return 'claude';
  }
  return 'unknown';
}
