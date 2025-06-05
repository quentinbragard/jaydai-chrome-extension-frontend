export function highlightPlaceholders(content: string): string {
  if (!content) return content;
  return content.replace(/\[(.*?)\]/g, '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>');
}

export function extractPlaceholders(content: string): string[] {
  if (!content) return [];
  const matches = [...content.matchAll(/\[(.*?)\]/g)];
  return Array.from(new Set(matches.map(m => m[0])));
}

export function replacePlaceholders(content: string, values: Record<string, string>): string {
  if (!content) return content;
  let result = content;
  Object.entries(values).forEach(([key, value]) => {
    const normalized = key.startsWith('[') && key.endsWith(']') ? key : `[${key}]`;
    const regex = new RegExp(escapeRegExp(normalized), 'g');
    result = result.replace(regex, value);
  });
  return result;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
