/**
 * YAPPER — Token Compression & Prompt Translation Engine
 * Architecture: Model-View-Controller (MVC)
 * Zero-dependency, 100% Client-Side Private, Compatible with both file:// and http(s):// protocols.
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. CONFIG & CONSTANTS
  // ==========================================================================

  const BASE_SYSTEM_PROMPT = `You are a high-precision Prompt Compression and Translation Engine.
Convert raw, informal, or conversational user input (Indonesian or casual slang) into dense, highly effective, natural English prompts with MINIMAL token usage.

Core Principles:
1. Maximum Token Compression: Eliminate all conversational filler, pleasantries, greetings, polite requests ("tolong dong", "bro", "bisa gak", "makasih"), and rhetorical clutter.
2. Strict Technical Fidelity: Retain 100% of the original technical intent, specific requirements, entity names, file types, framework names, and constraints. Do NOT invent project context, hypothetical steps, or unprompted assumptions.
3. Crisp Imperative Phrasing: Use direct, unambiguous action verbs and precise technical vocabulary.
4. Less Tokens, High Signal: Express complex requests in the fewest possible English tokens without ambiguity.
5. Strict Output Requirement: Output ONLY the final English prompt. Absolutely NO meta-commentary, NO preamble, NO explanations, and NO surrounding quotes.`;

  const PROVIDER_DEFAULTS = {
    groq: {
      name: 'Groq Cloud',
      defaultModel: 'llama-3.3-70b-versatile',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      modelsEndpoint: 'https://api.groq.com/openai/v1/models',
      keyGuide: 'Dapatkan API key gratis di <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a>.',
      fallbackModels: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Rekomendasi)' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra Cepat)' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B 32k' },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT' }
      ]
    },
    openrouter: {
      name: 'OpenRouter',
      defaultModel: 'meta-llama/llama-3.3-70b-instruct',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      modelsEndpoint: 'https://openrouter.ai/api/v1/models',
      keyGuide: 'Dapatkan API key di <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a>.',
      fallbackModels: [
        { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
        { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' }
      ]
    },
    gemini: {
      name: 'Google Gemini',
      defaultModel: 'gemini-1.5-flash',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={key}',
      modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models?key={key}',
      keyGuide: 'Dapatkan API key gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">aistudio.google.com</a>.',
      fallbackModels: [
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Default)' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
      ]
    },
    openai: {
      name: 'OpenAI',
      defaultModel: 'gpt-4o-mini',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      modelsEndpoint: 'https://api.openai.com/v1/models',
      keyGuide: 'Dapatkan API key di <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">platform.openai.com/api-keys</a>.',
      fallbackModels: [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Hemat & Cepat)' },
        { id: 'gpt-4o', name: 'GPT-4o (Akurasi Tinggi)' }
      ]
    },
    custom: {
      name: 'Custom / Local (Ollama)',
      defaultModel: 'llama3.2',
      endpoint: 'http://localhost:11434/v1/chat/completions',
      modelsEndpoint: 'http://localhost:11434/v1/models',
      keyGuide: 'Pastikan endpoint lokal Anda (misal Ollama/vLLM) mengizinkan CORS browser origin.',
      fallbackModels: [
        { id: 'llama3.2', name: 'llama3.2' },
        { id: 'qwen2.5-coder', name: 'qwen2.5-coder' },
        { id: 'mistral', name: 'mistral' }
      ]
    }
  };

  const STORAGE_KEYS = {
    CONFIG: 'yapper_config',
    HISTORY: 'yapper_history'
  };


  // ==========================================================================
  // 2. UTILS
  // ==========================================================================

  const TokenEstimator = {
    estimate(text, lang = 'id') {
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
  };

  const DomUtils = {
    escapeHtml(str) {
      return (str || '').replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      })[m]);
    }
  };


  // ==========================================================================
  // 3. MODELS
  // ==========================================================================

  class AppState {
    constructor(initialState = {}) {
      this._state = {
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        apiKey: '',
        storageStrategy: 'local',
        customBaseUrl: 'http://localhost:11434/v1',
        isTranslating: false,
        abortController: null,
        ...initialState
      };
      this._listeners = new Set();
    }

    get(key) {
      return this._state[key];
    }

    getAll() {
      return { ...this._state };
    }

    set(key, value) {
      if (this._state[key] !== value) {
        this._state[key] = value;
        this._notify(key, value);
      }
    }

    update(partialState) {
      let changed = false;
      for (const [key, value] of Object.entries(partialState)) {
        if (this._state[key] !== value) {
          this._state[key] = value;
          changed = true;
        }
      }
      if (changed) {
        this._notify('*', this.getAll());
      }
    }

    subscribe(listener) {
      this._listeners.add(listener);
      return () => this._listeners.delete(listener);
    }

    _notify(key, value) {
      this._listeners.forEach(listener => {
        try {
          listener(key, value, this.getAll());
        } catch (err) {
          console.error('AppState listener error:', err);
        }
      });
    }
  }

  class StorageModel {
    static loadConfig() {
      let stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      let strategy = 'local';

      if (!stored) {
        stored = sessionStorage.getItem(STORAGE_KEYS.CONFIG);
        if (stored) strategy = 'session';
      }

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return {
            provider: parsed.provider || 'groq',
            model: parsed.model || 'llama-3.3-70b-versatile',
            apiKey: parsed.apiKey || '',
            customBaseUrl: parsed.customBaseUrl || 'http://localhost:11434/v1',
            storageStrategy: strategy
          };
        } catch (err) {
          console.error('Failed to parse stored configuration:', err);
        }
      }

      return null;
    }

    static saveConfig(configData, strategy = 'local') {
      const serialized = JSON.stringify({
        provider: configData.provider,
        model: configData.model,
        apiKey: configData.apiKey,
        customBaseUrl: configData.customBaseUrl
      });

      if (strategy === 'local') {
        localStorage.setItem(STORAGE_KEYS.CONFIG, serialized);
        sessionStorage.removeItem(STORAGE_KEYS.CONFIG);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.CONFIG, serialized);
        localStorage.removeItem(STORAGE_KEYS.CONFIG);
      }
    }

    static purgeConfig() {
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      sessionStorage.removeItem(STORAGE_KEYS.CONFIG);
    }
  }

  class HistoryModel {
    constructor(maxItems = 30) {
      this.maxItems = maxItems;
      this.history = [];
      this.load();
    }

    load() {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
        if (stored) {
          this.history = JSON.parse(stored);
        } else {
          this.history = [];
        }
      } catch (e) {
        console.warn('Failed to parse history from localStorage:', e);
        this.history = [];
      }
      return this.history;
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
      } catch (e) {
        console.warn('Failed to persist history to localStorage:', e);
      }
    }

    add({ rawInput, outputText, inTokens, outTokens }) {
      const item = {
        id: 'hist_' + Date.now(),
        timestamp: new Date().toISOString(),
        rawInput: rawInput.trim(),
        outputText: outputText.trim(),
        inTokens,
        outTokens
      };

      this.history.unshift(item);
      if (this.history.length > this.maxItems) {
        this.history.pop();
      }

      this.save();
      return item;
    }

    getAll() {
      return [...this.history];
    }

    findById(id) {
      return this.history.find(h => h.id === id) || null;
    }

    clear() {
      this.history = [];
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    }
  }

  class LLMClient {
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


  // ==========================================================================
  // 4. VIEWS
  // ==========================================================================

  class ToastView {
    constructor(containerId = 'toast-container') {
      this.container = document.getElementById(containerId);
    }

    show(message, type = 'normal', duration = 3200) {
      if (!this.container) return;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;

      let iconSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      `;

      if (type === 'success') {
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        `;
      } else if (type === 'error') {
        iconSvg = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        `;
      }

      toast.innerHTML = `${iconSvg}<span>${DomUtils.escapeHtml(message)}</span>`;
      this.container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        setTimeout(() => toast.remove(), 250);
      }, duration);
    }
  }

  class StudioView {
    constructor() {
      // Inputs & Metrics
      this.rawInput = document.getElementById('raw-input');
      this.btnSubmit = document.getElementById('btn-submit');
      this.btnClearInput = document.getElementById('btn-clear-input');
      this.inputTokens = document.getElementById('input-tokens');
      this.inputChars = document.getElementById('input-chars');

      // Output & Metrics
      this.emptyState = document.getElementById('empty-state');
      this.outputContent = document.getElementById('output-content');
      this.outputText = document.getElementById('output-text');
      this.streamingCursor = document.getElementById('streaming-cursor');
      this.outputTokens = document.getElementById('output-tokens');
      this.compressionBadge = document.getElementById('compression-badge');
      this.efficiencyBar = document.getElementById('efficiency-bar');
      this.metricSummary = document.getElementById('metric-summary');
      this.metricLatency = document.getElementById('metric-latency');
      this.btnCopy = document.getElementById('btn-copy');
      this.btnDownload = document.getElementById('btn-download');
    }

    getRawInput() {
      return this.rawInput ? this.rawInput.value : '';
    }

    setRawInput(value) {
      if (this.rawInput) {
        this.rawInput.value = value;
      }
    }

    focusInput() {
      if (this.rawInput) {
        this.rawInput.focus();
      }
    }

    getOutputText() {
      return this.outputText ? this.outputText.textContent.trim() : '';
    }

    renderInputMetrics(tokens, chars) {
      if (this.inputTokens) this.inputTokens.textContent = `${tokens} tok`;
      if (this.inputChars) this.inputChars.textContent = `${chars} chars`;
    }

    renderOutputMetrics(inTokens, outTokens, elapsedMs = null) {
      if (this.outputTokens) this.outputTokens.textContent = `${outTokens} tok`;

      if (inTokens > 0 && outTokens > 0) {
        const savedTokens = inTokens - outTokens;
        const savedRatio = Math.round((savedTokens / inTokens) * 100);

        if (savedTokens > 0) {
          if (this.compressionBadge) {
            this.compressionBadge.textContent = `-${savedRatio}% Saved`;
            this.compressionBadge.className = 'badge-saving';
          }
          if (this.efficiencyBar) {
            this.efficiencyBar.style.width = `${Math.min(100, Math.max(15, savedRatio))}%`;
          }
          if (this.metricSummary) {
            this.metricSummary.textContent = `${savedTokens} tokens trimmed (${savedRatio}% savings)`;
          }
        } else {
          if (this.compressionBadge) {
            this.compressionBadge.textContent = `+${Math.abs(savedRatio)}% Density`;
            this.compressionBadge.className = 'badge-saving';
          }
          if (this.efficiencyBar) {
            this.efficiencyBar.style.width = `20%`;
          }
          if (this.metricSummary) {
            this.metricSummary.textContent = `Specific context expansion`;
          }
        }
      } else {
        if (this.compressionBadge) this.compressionBadge.textContent = `0% Saved`;
        if (this.efficiencyBar) this.efficiencyBar.style.width = `0%`;
        if (this.metricSummary) this.metricSummary.textContent = `0 tokens trimmed`;
      }

      if (elapsedMs !== null && this.metricLatency) {
        this.metricLatency.textContent = `${elapsedMs}ms`;
      }
    }

    showOutput(text) {
      if (this.emptyState) this.emptyState.classList.add('hidden');
      if (this.outputContent) this.outputContent.classList.remove('hidden');
      if (this.outputText) this.outputText.textContent = text;
    }

    clearOutput() {
      if (this.outputText) this.outputText.textContent = '';
      if (this.outputContent) this.outputContent.classList.add('hidden');
      if (this.emptyState) this.emptyState.classList.remove('hidden');
      if (this.streamingCursor) this.streamingCursor.classList.add('hidden');
      if (this.metricLatency) this.metricLatency.textContent = '—';
      this.renderOutputMetrics(0, 0);
    }

    clearAll() {
      this.setRawInput('');
      this.renderInputMetrics(0, 0);
      this.clearOutput();
      this.focusInput();
    }

    setStreaming(isStreaming) {
      if (isStreaming) {
        if (this.emptyState) this.emptyState.classList.add('hidden');
        if (this.outputContent) this.outputContent.classList.remove('hidden');
        if (this.outputText) this.outputText.textContent = '';
        if (this.streamingCursor) this.streamingCursor.classList.remove('hidden');
        if (this.btnSubmit) this.btnSubmit.classList.add('loading');
      } else {
        if (this.streamingCursor) this.streamingCursor.classList.add('hidden');
        if (this.btnSubmit) this.btnSubmit.classList.remove('loading');
      }
    }

    setCopied(isCopied) {
      if (!this.btnCopy) return;
      if (isCopied) {
        this.btnCopy.classList.add('copied');
      } else {
        this.btnCopy.classList.remove('copied');
      }
    }

    bindInput(handler) {
      if (this.rawInput) {
        this.rawInput.addEventListener('input', () => handler(this.getRawInput()));
      }
    }

    bindClear(handler) {
      if (this.btnClearInput) {
        this.btnClearInput.addEventListener('click', handler);
      }
    }

    bindSubmit(handler) {
      if (this.btnSubmit) {
        this.btnSubmit.addEventListener('click', handler);
      }
    }

    bindCopy(handler) {
      if (this.btnCopy) {
        this.btnCopy.addEventListener('click', handler);
      }
    }

    bindDownload(handler) {
      if (this.btnDownload) {
        this.btnDownload.addEventListener('click', handler);
      }
    }
  }

  class SettingsView {
    constructor() {
      this.modal = document.getElementById('settings-modal');
      this.btnToggle = document.getElementById('btn-settings-toggle');
      this.btnClose = document.getElementById('btn-close-settings');
      this.btnCancel = document.getElementById('btn-cancel-settings');
      this.btnSave = document.getElementById('btn-save-settings');
      this.btnPurge = document.getElementById('btn-purge-key');

      this.providerSelect = document.getElementById('provider-select');
      this.apiKeyInput = document.getElementById('api-key-input');
      this.btnToggleKeyVisibility = document.getElementById('btn-toggle-key-visibility');
      this.btnPasteKey = document.getElementById('btn-paste-key');
      this.providerKeyGuide = document.getElementById('provider-key-guide');

      this.modelSelect = document.getElementById('model-select');
      this.modelInput = document.getElementById('model-input');
      this.btnToggleModelMode = document.getElementById('btn-toggle-model-mode');
      this.btnFetchModels = document.getElementById('btn-fetch-models');
      this.modelCountBadge = document.getElementById('model-count-badge');
      this.modelStatusHint = document.getElementById('model-status-hint');
      this.modelFetchSpinner = document.getElementById('model-fetch-spinner');

      this.baseUrlGroup = document.getElementById('base-url-group');
      this.baseUrlInput = document.getElementById('base-url-input');
      this.storageRadios = document.querySelectorAll('input[name="storage-strategy"]');

      this.keyBadge = document.getElementById('key-badge');
      this.connectionStatus = document.getElementById('connection-status');
      this.statusText = document.getElementById('status-text');
    }

    open() {
      if (this.modal) {
        this.modal.classList.add('open');
        this.modal.setAttribute('aria-hidden', 'false');
      }
    }

    close() {
      if (this.modal) {
        this.modal.classList.remove('open');
        this.modal.setAttribute('aria-hidden', 'true');
      }
    }

    isOpen() {
      return this.modal ? this.modal.classList.contains('open') : false;
    }

    renderConfig(config, isTranslating = false) {
      if (this.providerSelect) this.providerSelect.value = config.provider;
      if (this.apiKeyInput) this.apiKeyInput.value = config.apiKey;
      if (this.modelInput) this.modelInput.value = config.model;
      if (this.baseUrlInput) this.baseUrlInput.value = config.customBaseUrl;

      if (this.storageRadios) {
        this.storageRadios.forEach(radio => {
          radio.checked = (radio.value === config.storageStrategy);
        });
      }

      if (config.provider === 'custom') {
        if (this.baseUrlGroup) this.baseUrlGroup.classList.remove('hidden');
      } else {
        if (this.baseUrlGroup) this.baseUrlGroup.classList.add('hidden');
      }

      const guide = PROVIDER_DEFAULTS[config.provider]?.keyGuide || '';
      if (this.providerKeyGuide) this.providerKeyGuide.innerHTML = guide;

      const provName = PROVIDER_DEFAULTS[config.provider]?.name?.split(' ')[0] || 'API';
      const isConfigured = Boolean(config.apiKey || config.provider === 'custom');

      if (this.keyBadge) {
        if (isConfigured) {
          this.keyBadge.textContent = 'Active';
          this.keyBadge.className = 'key-status-badge configured';
        } else {
          this.keyBadge.textContent = 'Setup';
          this.keyBadge.className = 'key-status-badge not-configured';
        }
      }

      if (this.connectionStatus && this.statusText) {
        if (isTranslating) {
          this.connectionStatus.className = 'status-badge translating';
          this.statusText.textContent = `${provName} · Compressing...`;
        } else if (isConfigured) {
          this.connectionStatus.className = 'status-badge ready';
          this.statusText.textContent = `${provName} · Ready`;
        } else {
          this.connectionStatus.className = 'status-badge';
          this.statusText.textContent = `${provName} · No Key`;
        }
      }
    }

    renderModels(models, selectedModel, countText = '', hintText = '') {
      if (!this.modelSelect) return;
      this.modelSelect.innerHTML = '';

      let found = false;
      models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name || m.id;
        if (m.id === selectedModel) {
          opt.selected = true;
          found = true;
        }
        this.modelSelect.appendChild(opt);
      });

      if (!found && models.length > 0) {
        this.modelSelect.selectedIndex = 0;
        if (this.modelInput) this.modelInput.value = this.modelSelect.value;
      } else {
        if (this.modelInput) this.modelInput.value = selectedModel;
      }

      if (this.modelCountBadge) {
        if (countText) {
          this.modelCountBadge.textContent = countText;
          this.modelCountBadge.classList.remove('hidden');
        } else {
          this.modelCountBadge.classList.add('hidden');
        }
      }

      if (this.modelStatusHint && hintText) {
        this.modelStatusHint.textContent = hintText;
      }
    }

    setFetchingModels(isFetching) {
      if (this.modelFetchSpinner) {
        if (isFetching) this.modelFetchSpinner.classList.remove('hidden');
        else this.modelFetchSpinner.classList.add('hidden');
      }
      if (this.btnFetchModels) {
        if (isFetching) this.btnFetchModels.classList.add('spinning');
        else this.btnFetchModels.classList.remove('spinning');
      }
    }

    toggleKeyVisibility() {
      if (!this.apiKeyInput || !this.btnToggleKeyVisibility) return;
      if (this.apiKeyInput.type === 'password') {
        this.apiKeyInput.type = 'text';
        this.btnToggleKeyVisibility.textContent = 'Hide Key';
      } else {
        this.apiKeyInput.type = 'password';
        this.btnToggleKeyVisibility.textContent = 'Show Key';
      }
    }

    toggleModelMode() {
      if (!this.modelInput || !this.modelSelect || !this.btnToggleModelMode) return;
      const isManual = !this.modelInput.classList.contains('hidden');

      if (isManual) {
        this.modelInput.classList.add('hidden');
        this.modelSelect.classList.remove('hidden');
        this.btnToggleModelMode.textContent = 'Manual Input';
        if (this.modelSelect.value) {
          this.modelInput.value = this.modelSelect.value;
        }
      } else {
        this.modelSelect.classList.add('hidden');
        this.modelInput.classList.remove('hidden');
        this.modelInput.value = this.modelInput.value || this.modelSelect.value;
        this.btnToggleModelMode.textContent = 'Select List';
        this.modelInput.focus();
      }
    }

    getFormData() {
      const selectedStrategy = Array.from(this.storageRadios).find(r => r.checked)?.value || 'local';
      const isManual = !this.modelInput.classList.contains('hidden');
      const activeModel = isManual && this.modelInput.value.trim()
        ? this.modelInput.value.trim()
        : (this.modelSelect.value || this.modelInput.value.trim() || 'llama-3.3-70b-versatile');

      return {
        provider: this.providerSelect.value,
        model: activeModel,
        apiKey: this.apiKeyInput.value.trim(),
        customBaseUrl: this.baseUrlInput.value.trim(),
        storageStrategy: selectedStrategy
      };
    }

    bindToggle(handler) {
      if (this.btnToggle) this.btnToggle.addEventListener('click', handler);
    }

    bindClose(handler) {
      if (this.btnClose) this.btnClose.addEventListener('click', handler);
      if (this.btnCancel) this.btnCancel.addEventListener('click', handler);
      if (this.modal) {
        this.modal.addEventListener('click', (e) => {
          if (e.target === this.modal) handler();
        });
      }
    }

    bindSave(handler) {
      if (this.btnSave) this.btnSave.addEventListener('click', () => handler(this.getFormData()));
    }

    bindPurge(handler) {
      if (this.btnPurge) this.btnPurge.addEventListener('click', handler);
    }

    bindProviderChange(handler) {
      if (this.providerSelect) {
        this.providerSelect.addEventListener('change', (e) => handler(e.target.value));
      }
    }

    bindApiKeyInput(handler) {
      if (this.apiKeyInput) {
        this.apiKeyInput.addEventListener('input', (e) => handler(e.target.value));
      }
    }

    bindApiKeyPaste(handler) {
      if (this.apiKeyInput) {
        this.apiKeyInput.addEventListener('paste', () => {
          setTimeout(() => handler(this.apiKeyInput.value.trim()), 100);
        });
      }
      if (this.btnPasteKey) {
        this.btnPasteKey.addEventListener('click', async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text) {
              this.apiKeyInput.value = text.trim();
              handler(text.trim(), true);
            }
          } catch (e) {}
        });
      }
    }

    bindToggleKeyVisibility(handler) {
      if (this.btnToggleKeyVisibility) {
        this.btnToggleKeyVisibility.addEventListener('click', () => {
          this.toggleKeyVisibility();
          if (handler) handler();
        });
      }
    }

    bindToggleModelMode(handler) {
      if (this.btnToggleModelMode) {
        this.btnToggleModelMode.addEventListener('click', () => {
          this.toggleModelMode();
          if (handler) handler();
        });
      }
    }

    bindFetchModels(handler) {
      if (this.btnFetchModels) {
        this.btnFetchModels.addEventListener('click', handler);
      }
    }

    bindModelSelectChange(handler) {
      if (this.modelSelect) {
        this.modelSelect.addEventListener('change', (e) => {
          if (this.modelInput) this.modelInput.value = e.target.value;
          handler(e.target.value);
        });
      }
    }

    bindModelInputChange(handler) {
      if (this.modelInput) {
        this.modelInput.addEventListener('input', (e) => handler(e.target.value.trim()));
      }
    }
  }

  class HistoryView {
    constructor() {
      this.drawer = document.getElementById('history-drawer');
      this.backdrop = document.getElementById('drawer-backdrop');
      this.btnToggle = document.getElementById('btn-history-toggle');
      this.btnClose = document.getElementById('btn-close-history');
      this.btnClear = document.getElementById('btn-clear-history');
      this.emptyState = document.getElementById('history-empty');
      this.list = document.getElementById('history-list');
    }

    open() {
      if (this.drawer) {
        this.drawer.classList.add('open');
        this.drawer.setAttribute('aria-hidden', 'false');
      }
      if (this.backdrop) {
        this.backdrop.classList.add('open');
      }
    }

    close() {
      if (this.drawer) {
        this.drawer.classList.remove('open');
        this.drawer.setAttribute('aria-hidden', 'true');
      }
      if (this.backdrop) {
        this.backdrop.classList.remove('open');
      }
    }

    isOpen() {
      return this.drawer ? this.drawer.classList.contains('open') : false;
    }

    render(items = []) {
      if (!this.emptyState || !this.list) return;

      if (!items || items.length === 0) {
        this.emptyState.classList.remove('hidden');
        this.list.innerHTML = '';
        return;
      }

      this.emptyState.classList.add('hidden');
      this.list.innerHTML = items.map(item => {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const savings = item.inTokens > 0 ? Math.round(((item.inTokens - item.outTokens) / item.inTokens) * 100) : 0;

        return `
          <div class="history-item" data-id="${item.id}" tabindex="0" role="button" aria-label="Restore prompt history">
            <div class="history-item-meta">
              <span>${timeStr} · COMPRESSED</span>
              <span class="badge-saving">${savings > 0 ? `-${savings}%` : '0%'}</span>
            </div>
            <p class="history-item-input">${DomUtils.escapeHtml(item.rawInput)}</p>
            <pre class="history-item-output"><code>${DomUtils.escapeHtml(item.outputText)}</code></pre>
          </div>
        `;
      }).join('');
    }

    bindToggle(handler) {
      if (this.btnToggle) this.btnToggle.addEventListener('click', handler);
    }

    bindClose(handler) {
      if (this.btnClose) this.btnClose.addEventListener('click', handler);
      if (this.backdrop) this.backdrop.addEventListener('click', handler);
    }

    bindClear(handler) {
      if (this.btnClear) this.btnClear.addEventListener('click', handler);
    }

    bindRestore(handler) {
      if (this.list) {
        this.list.addEventListener('click', (e) => {
          const itemEl = e.target.closest('.history-item');
          if (itemEl) {
            const id = itemEl.getAttribute('data-id');
            handler(id);
          }
        });
      }
    }
  }


  // ==========================================================================
  // 5. CONTROLLER
  // ==========================================================================

  class AppController {
    constructor({ state, historyModel, studioView, settingsView, historyView, toastView }) {
      this.state = state;
      this.historyModel = historyModel;
      this.studioView = studioView;
      this.settingsView = settingsView;
      this.historyView = historyView;
      this.toastView = toastView;

      this.isFetchingModels = false;
      this.fetchDebounceTimer = null;
    }

    init() {
      this.loadSavedConfig();
      this.renderInitialUI();
      this.bindEvents();
    }

    loadSavedConfig() {
      const saved = StorageModel.loadConfig();
      if (saved) {
        this.state.update({
          provider: saved.provider,
          model: saved.model,
          apiKey: saved.apiKey,
          customBaseUrl: saved.customBaseUrl,
          storageStrategy: saved.storageStrategy
        });
      }
    }

    renderInitialUI() {
      this.settingsView.renderConfig(this.state.getAll(), this.state.get('isTranslating'));
      this.historyView.render(this.historyModel.getAll());

      const apiKey = this.state.get('apiKey');
      const provider = this.state.get('provider');
      const customUrl = this.state.get('customBaseUrl');

      if (apiKey || provider === 'custom') {
        this.fetchModels(provider, apiKey, customUrl, false);
      } else {
        this.populateFallbackModels(provider);
      }

      this.updateInputMetrics(this.studioView.getRawInput());
    }

    bindEvents() {
      // Studio View Binds
      this.studioView.bindInput(text => this.updateInputMetrics(text));
      this.studioView.bindClear(() => this.studioView.clearAll());
      this.studioView.bindSubmit(() => this.executeTranslation());
      this.studioView.bindCopy(() => this.handleCopy());
      this.studioView.bindDownload(() => this.handleExport());

      // Settings View Binds
      this.settingsView.bindToggle(() => this.settingsView.open());
      this.settingsView.bindClose(() => this.settingsView.close());
      this.settingsView.bindSave(formData => this.handleSaveSettings(formData));
      this.settingsView.bindPurge(() => this.handlePurgeSettings());
      this.settingsView.bindProviderChange(provider => this.handleProviderChange(provider));
      this.settingsView.bindApiKeyInput(key => this.handleApiKeyChange(key, false));
      this.settingsView.bindApiKeyPaste((key, isPaste) => this.handleApiKeyChange(key, isPaste));
      this.settingsView.bindToggleKeyVisibility();
      this.settingsView.bindToggleModelMode();
      this.settingsView.bindFetchModels(() => {
        this.fetchModels(
          this.state.get('provider'),
          this.settingsView.apiKeyInput.value.trim(),
          this.settingsView.baseUrlInput.value.trim(),
          true
        );
      });
      this.settingsView.bindModelSelectChange(model => this.state.set('model', model));
      this.settingsView.bindModelInputChange(model => this.state.set('model', model));

      // History View Binds
      this.historyView.bindToggle(() => this.historyView.open());
      this.historyView.bindClose(() => this.historyView.close());
      this.historyView.bindClear(() => this.handleClearHistory());
      this.historyView.bindRestore(id => this.handleRestoreHistory(id));

      // Global Shortcuts
      document.addEventListener('keydown', e => this.handleKeyboardShortcuts(e));
    }

    updateInputMetrics(text) {
      const tokens = TokenEstimator.estimate(text, 'id');
      const chars = text ? text.length : 0;
      this.studioView.renderInputMetrics(tokens, chars);
    }

    updateOutputMetrics(outputText, startTime = null) {
      const inTokens = TokenEstimator.estimate(this.studioView.getRawInput(), 'id');
      const outTokens = TokenEstimator.estimate(outputText, 'en');
      const elapsed = startTime ? Math.round(performance.now() - startTime) : null;
      this.studioView.renderOutputMetrics(inTokens, outTokens, elapsed);
    }

    async fetchModels(provider, apiKey, customUrl = '', force = false) {
      if (!apiKey && provider !== 'custom') {
        this.populateFallbackModels(provider);
        return;
      }

      if (this.isFetchingModels) return;
      this.isFetchingModels = true;
      this.settingsView.setFetchingModels(true);

      const providerName = PROVIDER_DEFAULTS[provider]?.name || provider;

      try {
        const models = await LLMClient.fetchModels(provider, apiKey, customUrl);
        if (models.length > 0) {
          this.settingsView.renderModels(
            models,
            this.state.get('model'),
            `${models.length} Models`,
            `✓ ${models.length} active models loaded from ${providerName}.`
          );
          if (force) {
            this.toastView.show(`${models.length} model aktif berhasil dimuat dari ${providerName}!`, 'success');
          }
        } else {
          throw new Error('Tidak ada model yang ditemukan untuk akun ini.');
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic models:', err);
        this.populateFallbackModels(provider);
        if (force) {
          this.toastView.show(`Gagal memuat model: ${err.message}`, 'error');
        }
      } finally {
        this.isFetchingModels = false;
        this.settingsView.setFetchingModels(false);
      }
    }

    populateFallbackModels(provider) {
      const fallbacks = PROVIDER_DEFAULTS[provider]?.fallbackModels || [];
      this.settingsView.renderModels(
        fallbacks,
        this.state.get('model'),
        `${fallbacks.length} Model (Default)`,
        `Pilih model rekomendasi atau masukkan API Key untuk melihat seluruh model akun Anda.`
      );
    }

    handleProviderChange(newProvider) {
      const def = PROVIDER_DEFAULTS[newProvider];
      if (def) {
        this.state.set('provider', newProvider);
        this.state.set('model', def.defaultModel);
      }

      this.settingsView.renderConfig(this.state.getAll());
      this.fetchModels(
        newProvider,
        this.settingsView.apiKeyInput.value.trim(),
        this.settingsView.baseUrlInput.value.trim(),
        false
      );
    }

    handleApiKeyChange(val, isPaste = false) {
      if (isPaste) {
        this.fetchModels(
          this.state.get('provider'),
          val,
          this.settingsView.baseUrlInput.value.trim(),
          true
        );
      } else {
        clearTimeout(this.fetchDebounceTimer);
        if (val.length >= 8) {
          this.fetchDebounceTimer = setTimeout(() => {
            this.fetchModels(
              this.state.get('provider'),
              val,
              this.settingsView.baseUrlInput.value.trim(),
              false
            );
          }, 500);
        }
      }
    }

    handleSaveSettings(formData) {
      this.state.update({
        provider: formData.provider,
        model: formData.model,
        apiKey: formData.apiKey,
        customBaseUrl: formData.customBaseUrl,
        storageStrategy: formData.storageStrategy
      });

      StorageModel.saveConfig(formData, formData.storageStrategy);
      this.settingsView.renderConfig(this.state.getAll());
      this.settingsView.close();
      this.toastView.show('Konfigurasi API berhasil disimpan!', 'success');
    }

    handlePurgeSettings() {
      if (confirm('Yakin ingin menghapus API key dan konfigurasi dari browser Anda?')) {
        StorageModel.purgeConfig();
        this.state.update({
          apiKey: ''
        });
        this.populateFallbackModels(this.state.get('provider'));
        this.settingsView.renderConfig(this.state.getAll());
        this.toastView.show('API Key dan kredensial berhasil dibersihkan!', 'success');
      }
    }

    handleClearHistory() {
      if (confirm('Hapus seluruh riwayat prompt lokal?')) {
        this.historyModel.clear();
        this.historyView.render([]);
        this.toastView.show('Riwayat berhasil dibersihkan', 'success');
      }
    }

    handleRestoreHistory(id) {
      const item = this.historyModel.findById(id);
      if (item) {
        this.studioView.setRawInput(item.rawInput);
        this.studioView.showOutput(item.outputText);
        this.updateInputMetrics(item.rawInput);
        this.updateOutputMetrics(item.outputText);
        this.historyView.close();
        this.toastView.show('Prompt dipulihkan dari riwayat', 'success');
      }
    }

    async handleCopy() {
      const text = this.studioView.getOutputText();
      if (!text) {
        this.toastView.show('Tidak ada hasil prompt untuk disalin.', 'error');
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        this.studioView.setCopied(true);
        this.toastView.show('Prompt berhasil disalin ke clipboard!', 'success');
        setTimeout(() => this.studioView.setCopied(false), 2000);
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        this.studioView.setCopied(true);
        this.toastView.show('Prompt disalin!', 'success');
        setTimeout(() => this.studioView.setCopied(false), 2000);
      }
    }

    handleExport() {
      const text = this.studioView.getOutputText();
      if (!text) {
        this.toastView.show('Tidak ada prompt untuk diexport.', 'error');
        return;
      }

      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt_${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.toastView.show('File Markdown berhasil didownload', 'success');
    }

    async executeTranslation() {
      const rawInput = this.studioView.getRawInput().trim();
      if (!rawInput) {
        this.toastView.show('Ketikkan input bahasa Indonesia terlebih dahulu!', 'error');
        this.studioView.focusInput();
        return;
      }

      const provider = this.state.get('provider');
      const apiKey = this.state.get('apiKey');
      const model = this.state.get('model');
      const customBaseUrl = this.state.get('customBaseUrl');

      if (!apiKey && provider !== 'custom') {
        this.toastView.show('Masukkan API Key Anda di Pengaturan untuk memproses prompt!', 'error');
        this.settingsView.open();
        return;
      }

      this.state.set('isTranslating', true);
      this.settingsView.renderConfig(this.state.getAll(), true);
      this.studioView.setStreaming(true);

      const startTime = performance.now();
      const abortController = new AbortController();
      this.state.set('abortController', abortController);

      try {
        const finalResult = await LLMClient.streamCompression({
          provider,
          model,
          apiKey,
          customBaseUrl,
          rawInput,
          onChunk: (_chunk, accumulated) => {
            this.studioView.showOutput(accumulated);
            this.updateOutputMetrics(accumulated, startTime);
          },
          signal: abortController.signal
        });

        const inTokens = TokenEstimator.estimate(rawInput, 'id');
        const outTokens = TokenEstimator.estimate(finalResult, 'en');

        this.historyModel.add({ rawInput, outputText: finalResult, inTokens, outTokens });
        this.historyView.render(this.historyModel.getAll());
        this.updateOutputMetrics(finalResult, startTime);
        this.toastView.show('Prompt berhasil dikompresi & diterjemahkan!', 'success');

      } catch (err) {
        if (err.name === 'AbortError') {
          this.toastView.show('Proses dibatalkan.', 'normal');
        } else {
          console.error('LLM API Error:', err);
          this.toastView.show(`Gagal: ${err.message}`, 'error');
          this.studioView.showOutput(`[Error: ${err.message}]\n\nPastikan API Key benar dan memiliki kuota aktif.`);
        }
      } finally {
        this.state.set('isTranslating', false);
        this.studioView.setStreaming(false);
        this.settingsView.renderConfig(this.state.getAll(), false);
      }
    }

    handleKeyboardShortcuts(e) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Submit: Cmd/Ctrl + Enter
      if (cmdKey && e.key === 'Enter') {
        e.preventDefault();
        this.executeTranslation();
      }

      // Settings: Cmd/Ctrl + K
      if (cmdKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (this.settingsView.isOpen()) {
          this.settingsView.close();
        } else {
          this.settingsView.open();
        }
      }

      // History: Cmd/Ctrl + H
      if (cmdKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        if (this.historyView.isOpen()) {
          this.historyView.close();
        } else {
          this.historyView.open();
        }
      }

      // Copy: Cmd/Ctrl + Shift + C
      if (cmdKey && e.shiftKey && e.key.toLowerCase() === 'c') {
        if (this.studioView.getOutputText()) {
          e.preventDefault();
          this.handleCopy();
        }
      }

      // Escape: close modal/drawer
      if (e.key === 'Escape') {
        if (this.settingsView.isOpen()) {
          this.settingsView.close();
        } else if (this.historyView.isOpen()) {
          this.historyView.close();
        }
      }
    }
  }


  // ==========================================================================
  // 6. BOOTSTRAP & INITIALIZATION
  // ==========================================================================

  function bootstrap() {
    const state = new AppState();
    const historyModel = new HistoryModel();

    const studioView = new StudioView();
    const settingsView = new SettingsView();
    const historyView = new HistoryView();
    const toastView = new ToastView();

    const app = new AppController({
      state,
      historyModel,
      studioView,
      settingsView,
      historyView,
      toastView
    });

    app.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
