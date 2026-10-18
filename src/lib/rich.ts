const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** `*x*`, where x neither starts nor ends with whitespace. The tests use it to read content the same way. */
export const EMPHASIS = /\*([^*\s](?:[^*]*[^*\s])?)\*/g;

/**
 * Renders a content string as safe inline HTML: escapes `& < > " '`, turns
 * `*x*` into `<em>x</em>` and newlines into `<br>`. An asterisk only opens
 * emphasis when the next character is not whitespace, so `a * b` is untouched.
 */
export function renderEm(text: string): string {
  return text
    .replace(/[&<>"']/g, (ch) => ESCAPES[ch])
    .replace(EMPHASIS, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}
