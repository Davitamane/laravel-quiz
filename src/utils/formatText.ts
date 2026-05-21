/** Normalize text that may contain literal escape sequences from bad imports. */
export function formatText(text: string): string {
  return text.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
}
