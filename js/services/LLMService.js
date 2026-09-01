/**
 * LLMService
 * Transport layer: SSE streaming compression and model catalog fetching
 * across multi-provider APIs (Gemini, OpenAI-compatible, OpenRouter, Groq, Custom).
 */

import { BASE_SYSTEM_PROMPT, PROVIDER_DEFAULTS } from '../config/constants.js';
import { parseSSEStream } from '../utils/sseParser.js';

export class LLMService {
  /**
   * Fetch active model catalog from provider API.
   * @returns {Promise<Array<{id: string, name: string}>>}
   */
  static async fetchModels(provider, apiKey, customUrl = '') {
    if (provider === 'gemini') {
      const url = PROVIDER_DEFAULTS.gemini.modelsEndpoint.replace('{key}', encodeURIComponent(apiKey));
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        return data.models
          .filter(m => m.name && m.supportedGenerationMethods?.includes('generateContent'))
          .map(m => ({
            id: m.name.replace('models/', ''),
            name: m.displayName || m.name.replace('models/', '')
          }));
      }
      return [];
    }

    let url = PROVIDER_DEFAULTS[provider]?.modelsEndpoint;
    if (provider === 'custom') {
      url = customUrl.replace(/\/+$/, '') + '/models';
    }

    const headers = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const rawList = Array.isArray(data.data) ? data.data
      : Array.isArray(data.models) ? data.models
      : [];

    let models = rawList.map(m => ({
      id: m.id || m.name,
      name: m.id || m.name
    }));

    if (provider === 'groq') {
      models = models.filter(m =>
        !m.id.includes('whisper') &&
        !m.id.includes('distil') &&
        !m.id.includes('guard')
      );
    } else if (provider === 'openai') {
      models = models.filter(m => m.id.startsWith('gpt-'));
    }

    return models;
  }

  /**
   * Execute SSE streaming translation+compression against provider API.
   * @returns {Promise<string>} Full accumulated output text
   */
  static async streamCompression({ provider, model, apiKey, customBaseUrl, rawInput, onChunk, signal }) {
    if (provider === 'gemini') {
      return LLMService._streamGemini({ model, apiKey, rawInput, onChunk, signal });
    }
    return LLMService._streamOpenAICompat({ provider, model, apiKey, customBaseUrl, rawInput, onChunk, signal });
  }

  // ---------------------------------------------------------------------------
  // Private: provider-specific transports
  // ---------------------------------------------------------------------------

  static async _streamGemini({ model, apiKey, rawInput, onChunk, signal }) {
    const endpoint = PROVIDER_DEFAULTS.gemini.endpoint
      .replace('{model}', encodeURIComponent(model))
      .replace('{key}', encodeURIComponent(apiKey));

    const payload = {
      contents: [{
        role: 'user',
        parts: [{ text: `System Instruction:\n${BASE_SYSTEM_PROMPT}\n\nUser Input to Compress and Translate:\n${rawInput}` }]
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return parseSSEStream(
      response,
      parsed => parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? null,
      onChunk
    );
  }

  static async _streamOpenAICompat({ provider, model, apiKey, customBaseUrl, rawInput, onChunk, signal }) {
    let endpoint = PROVIDER_DEFAULTS[provider]?.endpoint;
    if (provider === 'custom') {
      endpoint = customBaseUrl.replace(/\/+$/, '') + '/chat/completions';
    }

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
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
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return parseSSEStream(
      response,
      parsed => parsed.choices?.[0]?.delta?.content ?? null,
      onChunk
    );
  }
}
