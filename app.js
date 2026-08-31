/**
 * YAPPER — Token Compression & Prompt Translation Engine
 * Pure Vanilla JavaScript & Zero-dependency Client-side LLM Architecture
 */

(function () {
  'use strict';

  // --- Constants & System Prompts ---
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


  // --- State ---
  const state = {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    apiKey: '',
    storageStrategy: 'local', // 'local' or 'session'
    customBaseUrl: 'http://localhost:11434/v1',
    isTranslating: false,
    abortController: null,
    history: []
  };

  // --- DOM Elements ---
  const el = {
    // Inputs & Actions
    rawInput: document.getElementById('raw-input'),
    btnSubmit: document.getElementById('btn-submit'),
    btnClearInput: document.getElementById('btn-clear-input'),
    inputTokens: document.getElementById('input-tokens'),
    inputChars: document.getElementById('input-chars'),

    // Output & Actions
    emptyState: document.getElementById('empty-state'),
    outputContent: document.getElementById('output-content'),
    outputText: document.getElementById('output-text'),
    streamingCursor: document.getElementById('streaming-cursor'),
    outputTokens: document.getElementById('output-tokens'),
    compressionBadge: document.getElementById('compression-badge'),
    efficiencyBar: document.getElementById('efficiency-bar'),
    metricSummary: document.getElementById('metric-summary'),
    metricLatency: document.getElementById('metric-latency'),
    btnCopy: document.getElementById('btn-copy'),
    btnDownload: document.getElementById('btn-download'),


    // Status & Key Badges
    connectionStatus: document.getElementById('connection-status'),
    statusText: document.getElementById('status-text'),
    keyBadge: document.getElementById('key-badge'),

    // Settings Modal
    btnSettingsToggle: document.getElementById('btn-settings-toggle'),
    settingsModal: document.getElementById('settings-modal'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    btnCancelSettings: document.getElementById('btn-cancel-settings'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    providerSelect: document.getElementById('provider-select'),
    modelSelect: document.getElementById('model-select'),
    modelInput: document.getElementById('model-input'),
    btnToggleModelMode: document.getElementById('btn-toggle-model-mode'),
    btnFetchModels: document.getElementById('btn-fetch-models'),
    modelCountBadge: document.getElementById('model-count-badge'),
    modelStatusHint: document.getElementById('model-status-hint'),
    modelFetchSpinner: document.getElementById('model-fetch-spinner'),
    baseUrlGroup: document.getElementById('base-url-group'),
    baseUrlInput: document.getElementById('base-url-input'),
    apiKeyInput: document.getElementById('api-key-input'),
    providerKeyGuide: document.getElementById('provider-key-guide'),
    btnToggleKeyVisibility: document.getElementById('btn-toggle-key-visibility'),
    btnPasteKey: document.getElementById('btn-paste-key'),
    btnPurgeKey: document.getElementById('btn-purge-key'),
    storageRadios: document.querySelectorAll('input[name="storage-strategy"]'),

    // History Drawer
    btnHistoryToggle: document.getElementById('btn-history-toggle'),
    historyDrawer: document.getElementById('history-drawer'),
    btnCloseHistory: document.getElementById('btn-close-history'),
    btnClearHistory: document.getElementById('btn-clear-history'),
    historyEmpty: document.getElementById('history-empty'),
    historyList: document.getElementById('history-list'),

    drawerBackdrop: document.getElementById('drawer-backdrop'),
    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  // --- Token Estimator Utilities ---
  /**
   * Fast client-side token estimation:
   * Indonesian words with prefixes/suffixes (meng-, di-, -kan, -nya) typically yield ~1.35 tokens/word.
   * English words average ~1.2 tokens/word.
   */
  function estimateTokens(text, lang = 'id') {
    if (!text || !text.trim()) return 0;
    const words = text.trim().split(/\s+/).filter(Boolean);
    const charCount = text.length;

    if (lang === 'id') {
      // Indonesian heuristic: combination of word count and syllable morphology
      const tokenByWords = words.length * 1.35;
      const tokenByChars = charCount / 3.6;
      return Math.max(1, Math.round((tokenByWords + tokenByChars) / 2));
    } else {
      // English heuristic
      const tokenByWords = words.length * 1.22;
      const tokenByChars = charCount / 4.0;
      return Math.max(1, Math.round((tokenByWords + tokenByChars) / 2));
    }
  }

  function updateInputMetrics() {
    const text = el.rawInput.value;
    const tokens = estimateTokens(text, 'id');
    const chars = text.length;

    el.inputTokens.textContent = `${tokens} tok`;
    el.inputChars.textContent = `${chars} karakter`;
  }

  function updateOutputMetrics(outputText, startTime = null) {
    const inTokens = estimateTokens(el.rawInput.value, 'id');
    const outTokens = estimateTokens(outputText, 'en');

    el.outputTokens.textContent = `${outTokens} tok`;

    if (inTokens > 0 && outTokens > 0) {
      const savedTokens = inTokens - outTokens;
      const savedRatio = Math.round((savedTokens / inTokens) * 100);

      if (savedTokens > 0) {
        el.compressionBadge.textContent = `-${savedRatio}% Saved`;
        el.compressionBadge.className = 'badge-saving';
        el.efficiencyBar.style.width = `${Math.min(100, Math.max(15, savedRatio))}%`;
        el.metricSummary.textContent = `${savedTokens} tokens terpangkas (${savedRatio}% lebih hemat)`;
      } else {
        el.compressionBadge.textContent = `+${Math.abs(savedRatio)}% Density`;
        el.compressionBadge.className = 'badge-saving';
        el.efficiencyBar.style.width = `20%`;
        el.metricSummary.textContent = `Penambahan konteks spesifik`;
      }
    } else {
      el.compressionBadge.textContent = `0% Saved`;
      el.efficiencyBar.style.width = `0%`;
      el.metricSummary.textContent = `0 tokens terpangkas`;
    }

    if (startTime) {
      const elapsedMs = Math.round(performance.now() - startTime);
      el.metricLatency.textContent = `${elapsedMs}ms`;
    }
  }

  // --- Storage & Config Management ---
  function loadConfig() {
    // Check localStorage first
    let stored = localStorage.getItem('yapper_config');
    let strategy = 'local';

    if (!stored) {
      // Check sessionStorage
      stored = sessionStorage.getItem('yapper_config');
      if (stored) strategy = 'session';
    }

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        state.provider = parsed.provider || 'groq';
        state.model = parsed.model || PROVIDER_DEFAULTS[state.provider]?.defaultModel || 'llama-3.3-70b-versatile';
        state.apiKey = parsed.apiKey || '';
        state.customBaseUrl = parsed.customBaseUrl || 'http://localhost:11434/v1';
        state.storageStrategy = strategy;
      } catch (e) {
        console.error('Failed to parse stored config:', e);
      }
    }

    // Load History
    const storedHistory = localStorage.getItem('yapper_history');
    if (storedHistory) {
      try {
        state.history = JSON.parse(storedHistory);
      } catch (e) {
        state.history = [];
      }
    }

    updateConfigUI();
    renderHistory();
  }

  // --- Dynamic Model Fetching ---
  let isFetchingModels = false;
  let fetchDebounceTimer = null;

  async function fetchAvailableModels(provider, apiKey, customUrl = '', force = false) {
    if (!apiKey && provider !== 'custom') {
      populateModelSelectWithFallback(provider);
      return;
    }

    if (isFetchingModels) return;
    isFetchingModels = true;

    if (el.modelFetchSpinner) el.modelFetchSpinner.classList.remove('hidden');
    if (el.btnFetchModels) el.btnFetchModels.classList.add('spinning');
    if (el.modelStatusHint) el.modelStatusHint.textContent = `Mengambil daftar model dari ${PROVIDER_DEFAULTS[provider]?.name || provider}...`;

    try {
      let models = [];

      if (provider === 'gemini') {
        const url = PROVIDER_DEFAULTS.gemini.modelsEndpoint.replace('{key}', encodeURIComponent(apiKey));
        const res = await fetch(url);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data.models && Array.isArray(data.models)) {
          models = data.models
            .filter(m => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
            .map(m => {
              const cleanId = m.name.replace(/^models\//, '');
              return {
                id: cleanId,
                name: m.displayName ? `${m.displayName} (${cleanId})` : cleanId
              };
            });
        }
      } else {
        let url = PROVIDER_DEFAULTS[provider]?.modelsEndpoint;
        if (provider === 'custom') {
          const base = (customUrl || state.customBaseUrl).replace(/\/chat\/completions\/?$/, '').replace(/\/+$/, '');
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

        models = rawList.map(m => {
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
      }

      if (models.length > 0) {
        populateModelOptions(models, state.model);
        if (el.modelCountBadge) {
          el.modelCountBadge.textContent = `${models.length} Model`;
          el.modelCountBadge.classList.remove('hidden');
        }
        if (el.modelStatusHint) {
          el.modelStatusHint.textContent = `✓ ${models.length} model aktif berhasil dimuat dari ${PROVIDER_DEFAULTS[provider]?.name}.`;
        }
        if (force) {
          showToast(`${models.length} model berhasil dimuat dari ${PROVIDER_DEFAULTS[provider]?.name}!`, 'success');
        }
      } else {
        throw new Error('Tidak ada model yang ditemukan untuk akun ini.');
      }

    } catch (err) {
      console.warn('Failed to fetch models dynamically:', err);
      populateModelSelectWithFallback(provider);
      if (el.modelStatusHint) {
        el.modelStatusHint.textContent = `Gagal memuat otomatis: ${err.message}. Menggunakan daftar model rekomendasi.`;
      }
      if (force) {
        showToast(`Gagal memuat model: ${err.message}`, 'error');
      }
    } finally {
      isFetchingModels = false;
      if (el.modelFetchSpinner) el.modelFetchSpinner.classList.add('hidden');
      if (el.btnFetchModels) el.btnFetchModels.classList.remove('spinning');
    }
  }

  function populateModelOptions(models, selectedModel) {
    el.modelSelect.innerHTML = '';
    let found = false;

    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name || m.id;
      if (m.id === selectedModel) {
        opt.selected = true;
        found = true;
      }
      el.modelSelect.appendChild(opt);
    });

    if (!found && models.length > 0) {
      el.modelSelect.selectedIndex = 0;
      state.model = el.modelSelect.value;
      el.modelInput.value = state.model;
    } else {
      state.model = selectedModel;
      el.modelInput.value = selectedModel;
    }
  }

  function populateModelSelectWithFallback(provider) {
    const fallbacks = PROVIDER_DEFAULTS[provider]?.fallbackModels || [];
    el.modelSelect.innerHTML = '';
    fallbacks.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      if (m.id === state.model) opt.selected = true;
      el.modelSelect.appendChild(opt);
    });

    if (el.modelCountBadge) {
      el.modelCountBadge.textContent = `${fallbacks.length} Model (Default)`;
      el.modelCountBadge.classList.remove('hidden');
    }
    if (el.modelStatusHint) {
      el.modelStatusHint.textContent = `Pilih model rekomendasi atau masukkan API Key untuk melihat seluruh model akun Anda.`;
    }
  }

  function saveConfig() {
    const selectedStrategy = Array.from(el.storageRadios).find(r => r.checked)?.value || 'local';
    const activeModel = !el.modelInput.classList.contains('hidden') && el.modelInput.value.trim()
      ? el.modelInput.value.trim()
      : (el.modelSelect.value || state.model || PROVIDER_DEFAULTS[el.providerSelect.value].defaultModel);

    const configData = {
      provider: el.providerSelect.value,
      model: activeModel,
      apiKey: el.apiKeyInput.value.trim(),
      customBaseUrl: el.baseUrlInput.value.trim()
    };

    state.provider = configData.provider;
    state.model = configData.model;
    state.apiKey = configData.apiKey;
    state.customBaseUrl = configData.customBaseUrl;
    state.storageStrategy = selectedStrategy;

    // Remove from other storage to prevent sync issues
    if (selectedStrategy === 'local') {
      localStorage.setItem('yapper_config', JSON.stringify(configData));
      sessionStorage.removeItem('yapper_config');
    } else {
      sessionStorage.setItem('yapper_config', JSON.stringify(configData));
      localStorage.removeItem('yapper_config');
    }

    updateConfigUI();
    closeModal(el.settingsModal);
    showToast('Konfigurasi API berhasil disimpan!', 'success');
  }

  function purgeConfig() {
    localStorage.removeItem('yapper_config');
    sessionStorage.removeItem('yapper_config');
    state.apiKey = '';
    el.apiKeyInput.value = '';
    populateModelSelectWithFallback(state.provider);
    updateConfigUI();
    showToast('API Key dan kredensial berhasil dibersihkan!', 'success');
  }

  function updateConfigUI() {
    // Populate form elements
    el.providerSelect.value = state.provider;
    el.modelInput.value = state.model;
    el.apiKeyInput.value = state.apiKey;
    el.baseUrlInput.value = state.customBaseUrl;

    Array.from(el.storageRadios).forEach(r => {
      r.checked = (r.value === state.storageStrategy);
    });

    // Toggle Custom URL input visibility
    if (state.provider === 'custom') {
      el.baseUrlGroup.classList.remove('hidden');
    } else {
      el.baseUrlGroup.classList.add('hidden');
    }

    // Provider guide
    const guide = PROVIDER_DEFAULTS[state.provider]?.keyGuide || '';
    el.providerKeyGuide.innerHTML = guide;

    // Load or fetch models for active provider
    if (state.apiKey || state.provider === 'custom') {
      fetchAvailableModels(state.provider, state.apiKey, state.customBaseUrl, false);
    } else {
      populateModelSelectWithFallback(state.provider);
    }

    // Header badge
    const provName = PROVIDER_DEFAULTS[state.provider]?.name.split(' ')[0] || 'API';
    if (state.apiKey || state.provider === 'custom') {
      el.keyBadge.textContent = 'Active';
      el.keyBadge.className = 'key-badge configured';
      el.statusText.textContent = `${provName} · Ready`;
      el.connectionStatus.className = 'status-indicator ready';
    } else {
      el.keyBadge.textContent = 'Setup';
      el.keyBadge.className = 'key-badge not-configured';
      el.statusText.textContent = `${provName} · No Key`;
      el.connectionStatus.className = 'status-indicator';
    }
  }

  // --- History Management ---
  function saveToHistory(rawInput, outputText) {
    const item = {
      id: 'hist_' + Date.now(),
      timestamp: new Date().toISOString(),
      rawInput: rawInput.trim(),
      outputText: outputText.trim(),
      inTokens: estimateTokens(rawInput, 'id'),
      outTokens: estimateTokens(outputText, 'en')
    };

    state.history.unshift(item);
    if (state.history.length > 30) state.history.pop();

    try {
      localStorage.setItem('yapper_history', JSON.stringify(state.history));
      renderHistory();
    } catch (e) {
      console.warn('Unable to write history to localStorage:', e);
    }
  }

  function renderHistory() {
    if (!state.history || state.history.length === 0) {
      el.historyEmpty.classList.remove('hidden');
      el.historyList.innerHTML = '';
      return;
    }

    el.historyEmpty.classList.add('hidden');
    el.historyList.innerHTML = state.history.map(item => {
      const date = new Date(item.timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const savings = Math.round(((item.inTokens - item.outTokens) / item.inTokens) * 100);

      return `
        <div class="history-item" data-id="${item.id}" tabindex="0" role="button" aria-label="Pulihkan prompt riwayat">
          <div class="history-item-meta">
            <span>${timeStr} · COMPRESSED</span>
            <span class="badge-saving">${savings > 0 ? `-${savings}%` : '0%'}</span>
          </div>
          <p class="history-item-input">${escapeHtml(item.rawInput)}</p>
          <pre class="history-item-output"><code>${escapeHtml(item.outputText)}</code></pre>
        </div>
      `;
    }).join('');

    // Attach click listeners to restore
    el.historyList.querySelectorAll('.history-item').forEach(itemEl => {
      itemEl.addEventListener('click', () => {
        const id = itemEl.getAttribute('data-id');
        const found = state.history.find(h => h.id === id);
        if (found) {
          el.rawInput.value = found.rawInput;
          displayOutput(found.outputText);
          updateInputMetrics();
          updateOutputMetrics(found.outputText);
          closeDrawer(el.historyDrawer);
          showToast('Prompt dipulihkan dari riwayat', 'success');
        }
      });
    });
  }

  function clearHistory() {
    state.history = [];
    localStorage.removeItem('yapper_history');
    renderHistory();
    showToast('Riwayat berhasil dibersihkan', 'success');
  }

  // --- UI Interactions ---
  function displayOutput(text) {
    el.emptyState.classList.add('hidden');
    el.outputContent.classList.remove('hidden');
    el.outputText.textContent = text;
  }

  function clearAll() {
    el.rawInput.value = '';
    el.outputText.textContent = '';
    el.outputContent.classList.add('hidden');
    el.emptyState.classList.remove('hidden');
    el.streamingCursor.classList.add('hidden');
    updateInputMetrics();
    updateOutputMetrics('');
    el.rawInput.focus();
  }

  function openModal(modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function openDrawer(drawer) {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    if (el.drawerBackdrop) {
      el.drawerBackdrop.classList.add('open');
    }
  }

  function closeDrawer(drawer) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (el.drawerBackdrop) {
      el.drawerBackdrop.classList.remove('open');
    }
  }

  function showToast(message, type = 'normal') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;

    if (type === 'success') {
      iconSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    } else if (type === 'error') {
      iconSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }

  // --- LLM API Client with Streaming SSE ---
  async function executeTranslation() {
    const rawInput = el.rawInput.value.trim();
    if (!rawInput) {
      showToast('Ketikkan input bahasa Indonesia terlebih dahulu!', 'error');
      el.rawInput.focus();
      return;
    }

    // Check if API key is provided
    if (!state.apiKey && state.provider !== 'custom') {
      showToast('Masukkan API Key Anda di Pengaturan untuk memproses prompt!', 'error');
      openModal(el.settingsModal);
      return;
    }

    // Set UI loading state
    state.isTranslating = true;
    el.btnSubmit.classList.add('loading');
    el.connectionStatus.className = 'status-indicator translating';
    el.statusText.textContent = `${PROVIDER_DEFAULTS[state.provider]?.name.split(' ')[0]} · Compressing...`;
    el.emptyState.classList.add('hidden');
    el.outputContent.classList.remove('hidden');
    el.outputText.textContent = '';
    el.streamingCursor.classList.remove('hidden');

    const startTime = performance.now();
    let accumulatedText = '';
    state.abortController = new AbortController();

    // Prepare system & user prompt
    // System instruction: Zero-fluff token compression & translation
    const fullSystemPrompt = BASE_SYSTEM_PROMPT;

    try {
      if (state.provider === 'gemini') {
        // Google Gemini API Stream format
        const endpoint = PROVIDER_DEFAULTS.gemini.endpoint
          .replace('{model}', encodeURIComponent(state.model))
          .replace('{key}', encodeURIComponent(state.apiKey));

        const payload = {
          contents: [
            {
              role: 'user',
              parts: [
                { text: `System Instruction:\n${fullSystemPrompt}\n\nUser Input to Compress and Translate:\n${rawInput}` }
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
          signal: state.abortController.signal
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

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
                  accumulatedText += chunk;
                  el.outputText.textContent = accumulatedText;
                  updateOutputMetrics(accumulatedText, startTime);
                }
              } catch (e) {}
            }
          }
        }

      } else {
        // Standard OpenAI-compatible format (Groq, OpenRouter, OpenAI, Custom/Ollama)
        let endpoint = PROVIDER_DEFAULTS[state.provider]?.endpoint || state.customBaseUrl + '/chat/completions';
        if (state.provider === 'custom') {
          endpoint = state.customBaseUrl.replace(/\/+$/, '') + '/chat/completions';
        }

        const headers = {
          'Content-Type': 'application/json'
        };

        if (state.apiKey) {
          headers['Authorization'] = `Bearer ${state.apiKey}`;
        }

        if (state.provider === 'openrouter') {
          headers['HTTP-Referer'] = window.location.origin || 'http://localhost';
          headers['X-Title'] = 'Yapper Token Compressor';
        }

        const payload = {
          model: state.model,
          messages: [
            { role: 'system', content: fullSystemPrompt },
            { role: 'user', content: rawInput }
          ],
          temperature: 0.2,
          stream: true
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload),
          signal: state.abortController.signal
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

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
                  accumulatedText += chunk;
                  el.outputText.textContent = accumulatedText;
                  updateOutputMetrics(accumulatedText, startTime);
                }
              } catch (e) {}
            }
          }
        }
      }

      // Finalize success
      el.streamingCursor.classList.add('hidden');
      updateOutputMetrics(accumulatedText, startTime);
      saveToHistory(rawInput, accumulatedText);
      showToast('Prompt berhasil dikompresi & diterjemahkan!', 'success');

    } catch (err) {
      if (err.name === 'AbortError') {
        showToast('Proses dibatalkan.', 'normal');
      } else {
        console.error('LLM API Error:', err);
        showToast(`Gagal: ${err.message}`, 'error');
        el.outputText.textContent = `[Error: ${err.message}]\n\nPastikan API Key benar dan memiliki kuota aktif.`;
      }
    } finally {
      state.isTranslating = false;
      el.btnSubmit.classList.remove('loading');
      el.streamingCursor.classList.add('hidden');
      updateConfigUI();
    }
  }


  // --- Clipboard & Download ---
  async function copyToClipboard() {
    const text = el.outputText.textContent.trim();
    if (!text) {
      showToast('Tidak ada hasil prompt untuk disalin.', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      el.btnCopy.classList.add('copied');
      showToast('Prompt berhasil disalin ke clipboard!', 'success');

      setTimeout(() => {
        el.btnCopy.classList.remove('copied');
      }, 2000);
    } catch (e) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      el.btnCopy.classList.add('copied');
      showToast('Prompt disalin!', 'success');
      setTimeout(() => el.btnCopy.classList.remove('copied'), 2000);
    }
  }

  function downloadAsMarkdown() {
    const text = el.outputText.textContent.trim();
    if (!text) {
      showToast('Tidak ada prompt untuk diexport.', 'error');
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
    showToast('File Markdown berhasil didownload', 'success');
  }

  // --- Event Listeners Initialization ---
  function initEvents() {
    // Live Input Counting
    el.rawInput.addEventListener('input', updateInputMetrics);

    // Clear Input
    el.btnClearInput.addEventListener('click', () => {
      el.rawInput.value = '';
      updateInputMetrics();
      el.rawInput.focus();
    });

    // Submit
    el.btnSubmit.addEventListener('click', executeTranslation);

    // Copy & Export
    el.btnCopy.addEventListener('click', copyToClipboard);
    el.btnDownload.addEventListener('click', downloadAsMarkdown);


    // Settings Modal
    el.btnSettingsToggle.addEventListener('click', () => openModal(el.settingsModal));
    el.btnCloseSettings.addEventListener('click', () => closeModal(el.settingsModal));
    el.btnCancelSettings.addEventListener('click', () => closeModal(el.settingsModal));
    el.btnSaveSettings.addEventListener('click', saveConfig);

    el.settingsModal.addEventListener('click', (e) => {
      if (e.target === el.settingsModal) closeModal(el.settingsModal);
    });

    // Model Select change
    el.modelSelect.addEventListener('change', () => {
      state.model = el.modelSelect.value;
      el.modelInput.value = state.model;
    });

    // Model Manual Input change
    el.modelInput.addEventListener('input', () => {
      state.model = el.modelInput.value.trim();
    });

    // Toggle Manual vs Select Mode
    el.btnToggleModelMode.addEventListener('click', () => {
      const isManual = !el.modelInput.classList.contains('hidden');
      if (isManual) {
        el.modelInput.classList.add('hidden');
        el.modelSelect.classList.remove('hidden');
        el.btnToggleModelMode.textContent = 'Ketik Manual';
        if (el.modelSelect.value) {
          state.model = el.modelSelect.value;
          el.modelInput.value = state.model;
        }
      } else {
        el.modelSelect.classList.add('hidden');
        el.modelInput.classList.remove('hidden');
        el.modelInput.value = state.model || el.modelSelect.value;
        el.btnToggleModelMode.textContent = 'Pilih List';
        el.modelInput.focus();
      }
    });

    // Manual Refresh Models button
    el.btnFetchModels.addEventListener('click', () => {
      fetchAvailableModels(el.providerSelect.value, el.apiKeyInput.value.trim(), el.baseUrlInput.value.trim(), true);
    });

    // Provider Change handler
    el.providerSelect.addEventListener('change', () => {
      const selected = el.providerSelect.value;
      const def = PROVIDER_DEFAULTS[selected];
      if (def) {
        state.model = def.defaultModel;
        el.modelInput.value = def.defaultModel;
        el.providerKeyGuide.innerHTML = def.keyGuide;
      }
      if (selected === 'custom') {
        el.baseUrlGroup.classList.remove('hidden');
      } else {
        el.baseUrlGroup.classList.add('hidden');
      }
      // Auto-fetch models for new provider
      fetchAvailableModels(selected, el.apiKeyInput.value.trim(), el.baseUrlInput.value.trim(), false);
    });

    // Auto-fetch models when typing API key (debounced)
    el.apiKeyInput.addEventListener('input', () => {
      clearTimeout(fetchDebounceTimer);
      const val = el.apiKeyInput.value.trim();
      if (val.length >= 8) {
        fetchDebounceTimer = setTimeout(() => {
          fetchAvailableModels(el.providerSelect.value, val, el.baseUrlInput.value.trim(), false);
        }, 500);
      }
    });

    // Auto-fetch models on paste event
    el.apiKeyInput.addEventListener('paste', () => {
      setTimeout(() => {
        const val = el.apiKeyInput.value.trim();
        if (val) {
          fetchAvailableModels(el.providerSelect.value, val, el.baseUrlInput.value.trim(), true);
        }
      }, 100);
    });

    // Toggle Key Visibility
    el.btnToggleKeyVisibility.addEventListener('click', () => {
      if (el.apiKeyInput.type === 'password') {
        el.apiKeyInput.type = 'text';
        el.btnToggleKeyVisibility.textContent = 'Sembunyikan';
      } else {
        el.apiKeyInput.type = 'password';
        el.btnToggleKeyVisibility.textContent = 'Lihat Key';
      }
    });

    // Paste Key from Clipboard button
    el.btnPasteKey.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          el.apiKeyInput.value = text.trim();
          showToast('API Key ditempel dari clipboard!', 'success');
          fetchAvailableModels(el.providerSelect.value, text.trim(), el.baseUrlInput.value.trim(), true);
        }
      } catch (e) {
        showToast('Izin akses clipboard ditolak browser.', 'error');
      }
    });

    // Purge Key
    el.btnPurgeKey.addEventListener('click', () => {
      if (confirm('Yakin ingin menghapus API key dan konfigurasi dari browser Anda?')) {
        purgeConfig();
      }
    });

    // History Drawer
    el.btnHistoryToggle.addEventListener('click', () => openDrawer(el.historyDrawer));
    el.btnCloseHistory.addEventListener('click', () => closeDrawer(el.historyDrawer));
    if (el.drawerBackdrop) {
      el.drawerBackdrop.addEventListener('click', () => closeDrawer(el.historyDrawer));
    }
    el.btnClearHistory.addEventListener('click', () => {
      if (confirm('Hapus seluruh riwayat prompt lokal?')) {
        clearHistory();
      }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Submit: Cmd/Ctrl + Enter
      if (cmdKey && e.key === 'Enter') {
        e.preventDefault();
        executeTranslation();
      }

      // Settings: Cmd/Ctrl + K
      if (cmdKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (el.settingsModal.classList.contains('open')) {
          closeModal(el.settingsModal);
        } else {
          openModal(el.settingsModal);
        }
      }

      // History: Cmd/Ctrl + H
      if (cmdKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        if (el.historyDrawer.classList.contains('open')) {
          closeDrawer(el.historyDrawer);
        } else {
          openDrawer(el.historyDrawer);
        }
      }

      // Copy: Cmd/Ctrl + Shift + C
      if (cmdKey && e.shiftKey && e.key.toLowerCase() === 'c') {
        if (!el.outputContent.classList.contains('hidden')) {
          e.preventDefault();
          copyToClipboard();
        }
      }

      // Escape: close modal/drawer or clear input
      if (e.key === 'Escape') {
        if (el.settingsModal.classList.contains('open')) {
          closeModal(el.settingsModal);
        } else if (el.historyDrawer.classList.contains('open')) {
          closeDrawer(el.historyDrawer);
        }
      }
    });
  }

  // --- Bootstrap ---
  function init() {
    loadConfig();
    initEvents();
    updateInputMetrics();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
