export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>')
    .replace(/<div><br><\/div>/gi, '<br>')
    .replace(/<p><br><\/p>/gi, '<br>')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div\s*\/?>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<p\s*\/?>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/?span[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n\n+/g, '\n');
}
