/**
 * Fast client-side token estimation heuristics
 * Indonesian morphology with prefixes/suffixes averages ~1.35 tokens/word.
 * English technical text averages ~1.2 tokens/word.
 */
export function estimateTokens(text, lang = 'id') {
  if (!text || !text.trim()) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const charCount = text.length;

  if (lang === 'id') {
    const tokenByWords = words.length * 1.35;
    const tokenByChars = charCount / 3.6;
    return Math.max(1, Math.round((tokenByWords + tokenByChars) / 2));
  } else {
    const tokenByWords = words.length * 1.22;
    const tokenByChars = charCount / 4.0;
    return Math.max(1, Math.round((tokenByWords + tokenByChars) / 2));
  }
}
