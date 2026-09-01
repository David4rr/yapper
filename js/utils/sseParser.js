/**
 * SSE Stream Parser Utility
 * Parses a ReadableStream of Server-Sent Events, accumulates text chunks.
 *
 * @param {Response} response - Fetch response with a readable body
 * @param {(parsed: object) => string|null} extractChunk - Provider-specific chunk extractor
 * @param {(chunk: string, accumulated: string) => void} onChunk - Called on each text delta
 * @returns {Promise<string>} Full accumulated output
 */
export async function parseSSEStream(response, extractChunk, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const clean = line.trim();
      if (!clean || clean === 'data: [DONE]') continue;
      if (clean.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(clean.slice(6));
          const chunk = extractChunk(parsed);
          if (chunk) {
            accumulated += chunk;
            onChunk(chunk, accumulated);
          }
        } catch (_) {}
      }
    }
  }

  return accumulated;
}
