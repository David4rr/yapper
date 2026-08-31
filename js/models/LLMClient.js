/**
 * LLMClient Model
 * Direct client-side SSE streaming transport & model querying across multi-providers
 */

import { BASE_SYSTEM_PROMPT, PROVIDER_DEFAULTS } from '../config/constants.js';

export class LLMClient {
  /**
   * Fetch active model catalog from provider API
   */
  static async fetchModels(provider, apiKey, customUrl = '') {
    if (provider === 'gemini') {
      const url = PROVIDER_DEFAULTS.gemini.modelsEndpoint.replace('{key}', encodeURIComponent(apiKey));
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        return data.models
          .filter(m => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
          .map(m => {
            const cleanId = m.name.replace(/^models\//, '');
            return {
              id: cleanId,
              name: m.displayName ? `${m.displayName} (${cleanId})` : cleanId
            };
          });
      }
      return [];
    } else {
      let url = PROVIDER_DEFAULTS[provider]?.modelsEndpoint;
      if (provider === 'custom') {
        const base = (customUrl || 'http://localhost:11434/v1').replace(/\/chat\/completions\/?$/, '').replace(/\/+$/, '');
        url = base.endsWith('/v1') ? `${base}/models` : `${base}/v1/models`;
      }

      const headers = {};
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}: Gagal otentikasi`);
      }

      const data = await res.json();
      const rawList = Array.isArray(data.data) ? data.data : (Array.isArray(data.models) ? data.models : []);

      let models = rawList.map(m => {
        const id = m.id || m.name;
        const name = m.name && m.name !== id ? `${m.name} (${id})` : id;
        return { id, name };
      });

      if (provider === 'groq') {
        models = models.filter(m => !m.id.includes('whisper') && !m.id.includes('distil-whisper'));
        models.sort((a, b) => {
          const isRecA = a.id.includes('3.3') || a.id.includes('70b') || a.id.includes('instant');
          const isRecB = b.id.includes('3.3') || b.id.includes('70b') || b.id.includes('instant');
          if (isRecA && !isRecB) return -1;
          if (!isRecA && isRecB) return 1;
          return a.id.localeCompare(b.id);
        });
      } else if (provider === 'openai') {
        models = models.filter(m => m.id.startsWith('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3'));
        models.sort((a, b) => a.id.localeCompare(b.id));
      }

      return models;
    }
  }

  /**
   * Execute SSE streaming translation and compression
   */
  static async streamCompression({
    provider,
    model,
    apiKey,
    customBaseUrl,
    rawInput,
    onChunk,
    signal
  }) {
    if (provider === 'gemini') {
      const endpoint = PROVIDER_DEFAULTS.gemini.endpoint
        .replace('{model}', encodeURIComponent(model))
        .replace('{key}', encodeURIComponent(apiKey));

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `System Instruction:\n${BASE_SYSTEM_PROMPT}\n\nUser Input to Compress and Translate:\n${rawInput}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

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
          if (clean.startsWith('data: ')) {
            const jsonStr = clean.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (chunk) {
                accumulated += chunk;
                onChunk(chunk, accumulated);
              }
            } catch (e) {}
          }
        }
      }

      return accumulated;

    } else {
      // OpenAI-compatible SSE endpoints
      let endpoint = PROVIDER_DEFAULTS[provider]?.endpoint || `${customBaseUrl}/chat/completions`;
      if (provider === 'custom') {
        endpoint = customBaseUrl.replace(/\/+$/, '') + '/chat/completions';
      }

      const headers = {
        'Content-Type': 'application/json'
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin || 'http://localhost';
        headers['X-Title'] = 'Yapper Token Compressor';
      }

      const payload = {
        model,
        messages: [
          { role: 'system', content: BASE_SYSTEM_PROMPT },
          { role: 'user', content: rawInput }
        ],
        temperature: 0.2,
        stream: true
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

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
          if (clean === 'data: [DONE]') continue;
          if (clean.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(clean.slice(6));
              const chunk = parsed.choices?.[0]?.delta?.content;
              if (chunk) {
                accumulated += chunk;
                onChunk(chunk, accumulated);
              }
            } catch (e) {}
          }
        }
      }

      return accumulated;
    }
  }
}
