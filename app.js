// js/models/AppState.js
class AppState {
  constructor(initialState = {}) {
    this._state = {
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      apiKey: "",
      storageStrategy: "local",
      customBaseUrl: "http://localhost:11434/v1",
      isTranslating: false,
      ...initialState
    };
    this._listeners = new Set;
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
      this._notify("*", this.getAll());
    }
  }
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
  _notify(key, value) {
    this._listeners.forEach((listener) => {
      try {
        listener(key, value, this.getAll());
      } catch (err) {
        console.error("AppState listener error:", err);
      }
    });
  }
}

// js/config/constants.js
var BASE_SYSTEM_PROMPT = `You are a high-precision Telegraphic Prompt Optimization Engine.
Convert raw, informal, or unstructured inputs (Indonesian or casual English) into ultra-dense, token-minimized, production-grade English prompt directives.

Core Directives:
1. Maximum Semantic Density: Eliminate all rhetorical fluff, academic prose, and verbose padding (BAN phrases like "Implement a feature allowing users to...", "Ensure that...", "In order to...").
2. Telegraphic Imperative Style: Use compact, direct action verbs ("Add...", "Replace X with Y...", "Enforce...", "Refactor...", "Support..."). Express complete technical specifications in the fewest possible tokens.
3. 100% Technical Fidelity: Retain every constraint, negative requirement, framework/library, and edge case. Resolve typos and slang into precise technical concepts.
4. Concise Structure: Single tasks -> 1–2 crisp imperative sentences. Multi-requirement tasks -> tight bulleted directives.
5. Strict Output Only: Output ONLY the compiled English prompt. Absolutely NO intro, NO explanations, and NO surrounding quotation marks.`;
var PROVIDER_DEFAULTS = {
  groq: {
    name: "Groq Cloud",
    defaultModel: "llama-3.3-70b-versatile",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelsEndpoint: "https://api.groq.com/openai/v1/models",
    keyGuide: 'Dapatkan API key gratis di <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a>.',
    fallbackModels: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile (Rekomendasi)" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant (Ultra Cepat)" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B 32k" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B IT" }
    ]
  },
  openrouter: {
    name: "OpenRouter",
    defaultModel: "meta-llama/llama-3.3-70b-instruct",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    modelsEndpoint: "https://openrouter.ai/api/v1/models",
    keyGuide: 'Dapatkan API key di <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a>.',
    fallbackModels: [
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct" },
      { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
      { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash" },
      { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" }
    ]
  },
  gemini: {
    name: "Google Gemini",
    defaultModel: "gemini-1.5-flash",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={key}",
    modelsEndpoint: "https://generativelanguage.googleapis.com/v1beta/models?key={key}",
    keyGuide: 'Dapatkan API key gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">aistudio.google.com</a>.',
    fallbackModels: [
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Default)" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" }
    ]
  },
  openai: {
    name: "OpenAI",
    defaultModel: "gpt-4o-mini",
    endpoint: "https://api.openai.com/v1/chat/completions",
    modelsEndpoint: "https://api.openai.com/v1/models",
    keyGuide: 'Dapatkan API key di <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">platform.openai.com/api-keys</a>.',
    fallbackModels: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Hemat & Cepat)" },
      { id: "gpt-4o", name: "GPT-4o (Akurasi Tinggi)" }
    ]
  },
  custom: {
    name: "Custom / Local (Ollama)",
    defaultModel: "llama3.2",
    endpoint: "http://localhost:11434/v1/chat/completions",
    modelsEndpoint: "http://localhost:11434/v1/models",
    keyGuide: "Pastikan endpoint lokal Anda (misal Ollama/vLLM) mengizinkan CORS browser origin.",
    fallbackModels: [
      { id: "llama3.2", name: "llama3.2" },
      { id: "qwen2.5-coder", name: "qwen2.5-coder" },
      { id: "mistral", name: "mistral" }
    ]
  }
};
var STORAGE_KEYS = {
  CONFIG: "yapper_config",
  HISTORY: "yapper_history"
};

// js/models/StorageModel.js
class StorageModel {
  static loadConfig() {
    let stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
    let strategy = "local";
    if (!stored) {
      stored = sessionStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored)
        strategy = "session";
    }
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          provider: parsed.provider || "groq",
          model: parsed.model || "llama-3.3-70b-versatile",
          apiKey: parsed.apiKey || "",
          customBaseUrl: parsed.customBaseUrl || "http://localhost:11434/v1",
          storageStrategy: strategy
        };
      } catch (err) {
        console.error("Failed to parse stored configuration:", err);
      }
    }
    return null;
  }
  static saveConfig(configData, strategy = "local") {
    const serialized = JSON.stringify({
      provider: configData.provider,
      model: configData.model,
      apiKey: configData.apiKey,
      customBaseUrl: configData.customBaseUrl
    });
    if (strategy === "local") {
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

// js/models/HistoryModel.js
class HistoryModel {
  constructor(maxItems = 30, storageStrategy = "local") {
    this.maxItems = maxItems;
    this._strategy = storageStrategy;
    this.history = [];
    this.load();
  }
  setStrategy(strategy) {
    if (strategy !== this._strategy) {
      const current = JSON.stringify(this.history);
      this._getStorage(strategy).setItem(STORAGE_KEYS.HISTORY, current);
      this._getStorage(this._strategy).removeItem(STORAGE_KEYS.HISTORY);
      this._strategy = strategy;
    }
  }
  load() {
    let stored = localStorage.getItem(STORAGE_KEYS.HISTORY) || sessionStorage.getItem(STORAGE_KEYS.HISTORY);
    try {
      this.history = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("Failed to parse history from storage:", e);
      this.history = [];
    }
    return this.history;
  }
  save() {
    try {
      this._getStorage(this._strategy).setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    } catch (e) {
      console.warn("Failed to persist history to storage:", e);
    }
  }
  add({ rawInput, outputText, inTokens, outTokens }) {
    const item = {
      id: "hist_" + Date.now(),
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
    return this.history.find((h) => h.id === id) || null;
  }
  deleteById(id) {
    this.history = this.history.filter((h) => h.id !== id);
    this.save();
    return this.history;
  }
  clear() {
    this.history = [];
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    sessionStorage.removeItem(STORAGE_KEYS.HISTORY);
  }
  _getStorage(strategy) {
    return strategy === "session" ? sessionStorage : localStorage;
  }
}

// js/views/StudioView.js
class StudioView {
  constructor() {
    this.rawInput = document.getElementById("raw-input");
    this.btnSubmit = document.getElementById("btn-submit");
    this.btnClearInput = document.getElementById("btn-clear-input");
    this.inputTokens = document.getElementById("input-tokens");
    this.inputChars = document.getElementById("input-chars");
    this.emptyState = document.getElementById("empty-state");
    this.outputContent = document.getElementById("output-content");
    this.outputText = document.getElementById("output-text");
    this.streamingCursor = document.getElementById("streaming-cursor");
    this.outputTokens = document.getElementById("output-tokens");
    this.compressionBadge = document.getElementById("compression-badge");
    this.efficiencyBar = document.getElementById("efficiency-bar");
    this.metricSummary = document.getElementById("metric-summary");
    this.metricLatency = document.getElementById("metric-latency");
    this.btnCopy = document.getElementById("btn-copy");
    this.btnDownload = document.getElementById("btn-download");
  }
  getRawInput() {
    return this.rawInput ? this.rawInput.value : "";
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
    return this.outputText ? this.outputText.textContent.trim() : "";
  }
  renderInputMetrics(tokens, chars) {
    if (this.inputTokens)
      this.inputTokens.textContent = `${tokens} tok`;
    if (this.inputChars)
      this.inputChars.textContent = `${chars} chars`;
  }
  renderOutputMetrics(inTokens, outTokens, elapsedMs = null) {
    if (this.outputTokens)
      this.outputTokens.textContent = `${outTokens} tok`;
    if (inTokens > 0 && outTokens > 0) {
      const savedTokens = inTokens - outTokens;
      const savedRatio = Math.round(savedTokens / inTokens * 100);
      if (savedTokens > 0) {
        if (this.compressionBadge) {
          this.compressionBadge.textContent = `-${savedRatio}% Saved`;
          this.compressionBadge.className = "badge-saving";
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
          this.compressionBadge.className = "badge-saving";
        }
        if (this.efficiencyBar) {
          this.efficiencyBar.style.width = `20%`;
        }
        if (this.metricSummary) {
          this.metricSummary.textContent = `Specific context expansion`;
        }
      }
    } else {
      if (this.compressionBadge)
        this.compressionBadge.textContent = `0% Saved`;
      if (this.efficiencyBar)
        this.efficiencyBar.style.width = `0%`;
      if (this.metricSummary)
        this.metricSummary.textContent = `0 tokens trimmed`;
    }
    if (elapsedMs !== null && this.metricLatency) {
      this.metricLatency.textContent = `${elapsedMs}ms`;
    }
  }
  showOutput(text) {
    if (this.emptyState)
      this.emptyState.classList.add("hidden");
    if (this.outputContent)
      this.outputContent.classList.remove("hidden");
    if (this.outputText)
      this.outputText.textContent = text;
  }
  clearOutput() {
    if (this.outputText)
      this.outputText.textContent = "";
    if (this.outputContent)
      this.outputContent.classList.add("hidden");
    if (this.emptyState)
      this.emptyState.classList.remove("hidden");
    if (this.streamingCursor)
      this.streamingCursor.classList.add("hidden");
    if (this.metricLatency)
      this.metricLatency.textContent = "—";
    this.renderOutputMetrics(0, 0);
  }
  clearAll() {
    this.setRawInput("");
    this.renderInputMetrics(0, 0);
    this.clearOutput();
    this.focusInput();
  }
  setStreaming(isStreaming) {
    if (isStreaming) {
      if (this.emptyState)
        this.emptyState.classList.add("hidden");
      if (this.outputContent)
        this.outputContent.classList.remove("hidden");
      if (this.outputText)
        this.outputText.textContent = "";
      if (this.streamingCursor)
        this.streamingCursor.classList.remove("hidden");
      if (this.btnSubmit)
        this.btnSubmit.classList.add("loading");
    } else {
      if (this.streamingCursor)
        this.streamingCursor.classList.add("hidden");
      if (this.btnSubmit)
        this.btnSubmit.classList.remove("loading");
    }
  }
  setCopied(isCopied) {
    if (!this.btnCopy)
      return;
    if (isCopied) {
      this.btnCopy.classList.add("copied");
    } else {
      this.btnCopy.classList.remove("copied");
    }
  }
  async copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }
  downloadAsMarkdown(text) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  bindInput(handler) {
    if (this.rawInput) {
      this.rawInput.addEventListener("input", () => handler(this.getRawInput()));
    }
  }
  bindClear(handler) {
    if (this.btnClearInput) {
      this.btnClearInput.addEventListener("click", handler);
    }
  }
  bindSubmit(handler) {
    if (this.btnSubmit) {
      this.btnSubmit.addEventListener("click", handler);
    }
  }
  bindCopy(handler) {
    if (this.btnCopy) {
      this.btnCopy.addEventListener("click", handler);
    }
  }
  bindDownload(handler) {
    if (this.btnDownload) {
      this.btnDownload.addEventListener("click", handler);
    }
  }
}

// js/views/SettingsView.js
class SettingsView {
  constructor() {
    this.modal = document.getElementById("settings-modal");
    this.btnToggle = document.getElementById("btn-settings-toggle");
    this.btnClose = document.getElementById("btn-close-settings");
    this.btnCancel = document.getElementById("btn-cancel-settings");
    this.btnSave = document.getElementById("btn-save-settings");
    this.btnPurge = document.getElementById("btn-purge-key");
    this.providerSelect = document.getElementById("provider-select");
    this.apiKeyInput = document.getElementById("api-key-input");
    this.btnToggleKeyVisibility = document.getElementById("btn-toggle-key-visibility");
    this.btnPasteKey = document.getElementById("btn-paste-key");
    this.providerKeyGuide = document.getElementById("provider-key-guide");
    this.modelSelect = document.getElementById("model-select");
    this.modelInput = document.getElementById("model-input");
    this.btnToggleModelMode = document.getElementById("btn-toggle-model-mode");
    this.btnFetchModels = document.getElementById("btn-fetch-models");
    this.modelCountBadge = document.getElementById("model-count-badge");
    this.modelStatusHint = document.getElementById("model-status-hint");
    this.modelFetchSpinner = document.getElementById("model-fetch-spinner");
    this.baseUrlGroup = document.getElementById("base-url-group");
    this.baseUrlInput = document.getElementById("base-url-input");
    this.storageRadios = document.querySelectorAll('input[name="storage-strategy"]');
    this.keyBadge = document.getElementById("key-badge");
    this.connectionStatus = document.getElementById("connection-status");
    this.statusText = document.getElementById("status-text");
  }
  open() {
    if (this.modal) {
      this.modal.classList.add("open");
      this.modal.setAttribute("aria-hidden", "false");
    }
  }
  close() {
    if (this.modal) {
      this.modal.classList.remove("open");
      this.modal.setAttribute("aria-hidden", "true");
    }
  }
  isOpen() {
    return this.modal ? this.modal.classList.contains("open") : false;
  }
  renderConfig(config, isTranslating = false) {
    if (this.providerSelect)
      this.providerSelect.value = config.provider;
    if (this.apiKeyInput)
      this.apiKeyInput.value = config.apiKey;
    if (this.modelInput)
      this.modelInput.value = config.model;
    if (this.baseUrlInput)
      this.baseUrlInput.value = config.customBaseUrl;
    if (this.storageRadios) {
      this.storageRadios.forEach((radio) => {
        radio.checked = radio.value === config.storageStrategy;
      });
    }
    if (config.provider === "custom") {
      if (this.baseUrlGroup)
        this.baseUrlGroup.classList.remove("hidden");
    } else {
      if (this.baseUrlGroup)
        this.baseUrlGroup.classList.add("hidden");
    }
    const guide = PROVIDER_DEFAULTS[config.provider]?.keyGuide || "";
    if (this.providerKeyGuide)
      this.providerKeyGuide.innerHTML = guide;
    const provName = PROVIDER_DEFAULTS[config.provider]?.name?.split(" ")[0] || "API";
    const isConfigured = Boolean(config.apiKey || config.provider === "custom");
    if (this.keyBadge) {
      if (isConfigured) {
        this.keyBadge.textContent = "Active";
        this.keyBadge.className = "key-status-badge configured";
      } else {
        this.keyBadge.textContent = "Setup";
        this.keyBadge.className = "key-status-badge not-configured";
      }
    }
    if (this.connectionStatus && this.statusText) {
      if (isTranslating) {
        this.connectionStatus.className = "status-badge translating";
        this.statusText.textContent = `${provName} · Compressing...`;
      } else if (isConfigured) {
        this.connectionStatus.className = "status-badge ready";
        this.statusText.textContent = `${provName} · Ready`;
      } else {
        this.connectionStatus.className = "status-badge";
        this.statusText.textContent = `${provName} · No Key`;
      }
    }
  }
  renderModels(models, selectedModel, countText = "", hintText = "") {
    if (!this.modelSelect)
      return;
    this.modelSelect.innerHTML = "";
    let found = false;
    models.forEach((m) => {
      const opt = document.createElement("option");
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
      if (this.modelInput)
        this.modelInput.value = this.modelSelect.value;
    } else {
      if (this.modelInput)
        this.modelInput.value = selectedModel;
    }
    if (this.modelCountBadge) {
      if (countText) {
        this.modelCountBadge.textContent = countText;
        this.modelCountBadge.classList.remove("hidden");
      } else {
        this.modelCountBadge.classList.add("hidden");
      }
    }
    if (this.modelStatusHint && hintText) {
      this.modelStatusHint.textContent = hintText;
    }
  }
  setFetchingModels(isFetching) {
    if (this.modelFetchSpinner) {
      if (isFetching)
        this.modelFetchSpinner.classList.remove("hidden");
      else
        this.modelFetchSpinner.classList.add("hidden");
    }
    if (this.btnFetchModels) {
      if (isFetching)
        this.btnFetchModels.classList.add("spinning");
      else
        this.btnFetchModels.classList.remove("spinning");
    }
  }
  toggleKeyVisibility() {
    if (!this.apiKeyInput || !this.btnToggleKeyVisibility)
      return;
    if (this.apiKeyInput.type === "password") {
      this.apiKeyInput.type = "text";
      this.btnToggleKeyVisibility.textContent = "Hide Key";
    } else {
      this.apiKeyInput.type = "password";
      this.btnToggleKeyVisibility.textContent = "Show Key";
    }
  }
  toggleModelMode() {
    if (!this.modelInput || !this.modelSelect || !this.btnToggleModelMode)
      return;
    const isManual = !this.modelInput.classList.contains("hidden");
    if (isManual) {
      this.modelInput.classList.add("hidden");
      this.modelSelect.classList.remove("hidden");
      this.btnToggleModelMode.textContent = "Manual Input";
      if (this.modelSelect.value) {
        this.modelInput.value = this.modelSelect.value;
      }
    } else {
      this.modelSelect.classList.add("hidden");
      this.modelInput.classList.remove("hidden");
      this.modelInput.value = this.modelInput.value || this.modelSelect.value;
      this.btnToggleModelMode.textContent = "Select List";
      this.modelInput.focus();
    }
  }
  getFormData() {
    const selectedStrategy = Array.from(this.storageRadios).find((r) => r.checked)?.value || "local";
    const isManual = !this.modelInput.classList.contains("hidden");
    const activeModel = isManual && this.modelInput.value.trim() ? this.modelInput.value.trim() : this.modelSelect.value || this.modelInput.value.trim() || "llama-3.3-70b-versatile";
    return {
      provider: this.providerSelect.value,
      model: activeModel,
      apiKey: this.apiKeyInput.value.trim(),
      customBaseUrl: this.baseUrlInput.value.trim(),
      storageStrategy: selectedStrategy
    };
  }
  getCurrentApiKey() {
    return this.apiKeyInput?.value.trim() ?? "";
  }
  getCurrentBaseUrl() {
    return this.baseUrlInput?.value.trim() ?? "";
  }
  bindToggle(handler) {
    if (this.btnToggle)
      this.btnToggle.addEventListener("click", handler);
  }
  bindClose(handler) {
    if (this.btnClose)
      this.btnClose.addEventListener("click", handler);
    if (this.btnCancel)
      this.btnCancel.addEventListener("click", handler);
    if (this.modal) {
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal)
          handler();
      });
    }
  }
  bindSave(handler) {
    if (this.btnSave)
      this.btnSave.addEventListener("click", () => handler(this.getFormData()));
  }
  bindPurge(handler) {
    if (this.btnPurge)
      this.btnPurge.addEventListener("click", handler);
  }
  bindProviderChange(handler) {
    if (this.providerSelect) {
      this.providerSelect.addEventListener("change", (e) => handler(e.target.value));
    }
  }
  bindApiKeyInput(handler) {
    if (this.apiKeyInput) {
      this.apiKeyInput.addEventListener("input", (e) => handler(e.target.value));
    }
  }
  bindApiKeyPaste(handler) {
    if (this.apiKeyInput) {
      this.apiKeyInput.addEventListener("paste", () => {
        setTimeout(() => handler(this.apiKeyInput.value.trim()), 100);
      });
    }
    if (this.btnPasteKey) {
      this.btnPasteKey.addEventListener("click", async () => {
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
      this.btnToggleKeyVisibility.addEventListener("click", () => {
        this.toggleKeyVisibility();
        if (handler)
          handler();
      });
    }
  }
  bindToggleModelMode(handler) {
    if (this.btnToggleModelMode) {
      this.btnToggleModelMode.addEventListener("click", () => {
        this.toggleModelMode();
        if (handler)
          handler();
      });
    }
  }
  bindFetchModels(handler) {
    if (this.btnFetchModels) {
      this.btnFetchModels.addEventListener("click", handler);
    }
  }
  bindModelSelectChange(handler) {
    if (this.modelSelect) {
      this.modelSelect.addEventListener("change", (e) => {
        if (this.modelInput)
          this.modelInput.value = e.target.value;
        handler(e.target.value);
      });
    }
  }
  bindModelInputChange(handler) {
    if (this.modelInput) {
      this.modelInput.addEventListener("input", (e) => handler(e.target.value.trim()));
    }
  }
}

// js/utils/domUtils.js
function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[m]);
}

// js/views/HistoryView.js
class HistoryView {
  constructor() {
    this.drawer = document.getElementById("history-drawer");
    this.backdrop = document.getElementById("drawer-backdrop");
    this.btnToggle = document.getElementById("btn-history-toggle");
    this.btnClose = document.getElementById("btn-close-history");
    this.btnClear = document.getElementById("btn-clear-history");
    this.emptyState = document.getElementById("history-empty");
    this.list = document.getElementById("history-list");
  }
  open() {
    if (this.drawer) {
      this.drawer.classList.add("open");
      this.drawer.setAttribute("aria-hidden", "false");
    }
    if (this.backdrop) {
      this.backdrop.classList.add("open");
    }
  }
  close() {
    if (this.drawer) {
      this.drawer.classList.remove("open");
      this.drawer.setAttribute("aria-hidden", "true");
    }
    if (this.backdrop) {
      this.backdrop.classList.remove("open");
    }
  }
  isOpen() {
    return this.drawer ? this.drawer.classList.contains("open") : false;
  }
  render(items = []) {
    if (!this.emptyState || !this.list)
      return;
    if (!items || items.length === 0) {
      this.emptyState.classList.remove("hidden");
      this.list.innerHTML = "";
      return;
    }
    this.emptyState.classList.add("hidden");
    this.list.innerHTML = items.map((item) => {
      const date = new Date(item.timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const savings = item.inTokens > 0 ? Math.round((item.inTokens - item.outTokens) / item.inTokens * 100) : 0;
      return `
        <div class="history-item" data-id="${item.id}" tabindex="0" role="button" aria-label="Restore prompt history">
          <div class="history-item-meta">
            <div class="history-item-meta-info">
              <span>${timeStr} · COMPRESSED</span>
              <span class="badge-saving">${savings > 0 ? `-${savings}%` : "0%"}</span>
            </div>
            <button class="btn-history-item-delete" data-id="${item.id}" type="button" title="Delete this prompt" aria-label="Delete entry">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              </svg>
            </button>
          </div>
          <p class="history-item-input">${escapeHtml(item.rawInput)}</p>
          <pre class="history-item-output"><code>${escapeHtml(item.outputText)}</code></pre>
        </div>
      `;
    }).join("");
  }
  bindToggle(handler) {
    if (this.btnToggle)
      this.btnToggle.addEventListener("click", handler);
  }
  bindClose(handler) {
    if (this.btnClose)
      this.btnClose.addEventListener("click", handler);
    if (this.backdrop)
      this.backdrop.addEventListener("click", handler);
  }
  bindClear(handler) {
    if (this.btnClear)
      this.btnClear.addEventListener("click", handler);
  }
  bindRestore(handler) {
    if (this.list) {
      this.list.addEventListener("click", (e) => {
        if (e.target.closest(".btn-history-item-delete"))
          return;
        const itemEl = e.target.closest(".history-item");
        if (itemEl) {
          const id = itemEl.getAttribute("data-id");
          handler(id);
        }
      });
    }
  }
  bindDeleteItem(handler) {
    if (this.list) {
      this.list.addEventListener("click", (e) => {
        const deleteBtn = e.target.closest(".btn-history-item-delete");
        if (deleteBtn) {
          e.stopPropagation();
          const id = deleteBtn.getAttribute("data-id");
          handler(id);
        }
      });
    }
  }
}

// js/views/ToastView.js
class ToastView {
  constructor(containerId = "toast-container") {
    this.container = document.getElementById(containerId);
  }
  show(message, type = "normal", duration = 3200) {
    if (!this.container)
      return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    let iconSvg = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;
    if (type === "success") {
      iconSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    } else if (type === "error") {
      iconSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    }
    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
}

// js/views/ConfirmDialogView.js
class ConfirmDialogView {
  constructor() {
    this.modal = document.getElementById("confirm-modal");
    this.title = document.getElementById("confirm-title");
    this.message = document.getElementById("confirm-message");
    this.btnAccept = document.getElementById("btn-accept-confirm");
    this.btnCancel = document.getElementById("btn-cancel-confirm");
    this.btnClose = document.getElementById("btn-close-confirm");
    this._onConfirm = null;
    this._bindInternalEvents();
  }
  show({
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = true,
    onConfirm
  }) {
    if (this.title)
      this.title.textContent = title;
    if (this.message)
      this.message.textContent = message;
    if (this.btnCancel)
      this.btnCancel.textContent = cancelText;
    if (this.btnAccept) {
      this.btnAccept.textContent = confirmText;
      this.btnAccept.className = danger ? "btn-danger-cta" : "btn-primary-cta";
    }
    this._onConfirm = onConfirm;
    if (this.modal) {
      this.modal.classList.add("open");
      this.modal.setAttribute("aria-hidden", "false");
      if (this.btnAccept)
        this.btnAccept.focus();
    }
  }
  close() {
    if (this.modal) {
      this.modal.classList.remove("open");
      this.modal.setAttribute("aria-hidden", "true");
    }
    this._onConfirm = null;
  }
  isOpen() {
    return this.modal ? this.modal.classList.contains("open") : false;
  }
  _bindInternalEvents() {
    if (this.btnCancel) {
      this.btnCancel.addEventListener("click", () => this.close());
    }
    if (this.btnClose) {
      this.btnClose.addEventListener("click", () => this.close());
    }
    if (this.modal) {
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal)
          this.close();
      });
    }
    if (this.btnAccept) {
      this.btnAccept.addEventListener("click", () => {
        const callback = this._onConfirm;
        this.close();
        if (callback)
          callback();
      });
    }
  }
}

// js/utils/sseParser.js
async function parseSSEStream(response, extractChunk, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder;
  let buffer = "";
  let accumulated = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done)
      break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(`
`);
    buffer = lines.pop() || "";
    for (const line of lines) {
      const clean = line.trim();
      if (!clean || clean === "data: [DONE]")
        continue;
      if (clean.startsWith("data: ")) {
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

// js/services/LLMService.js
class LLMService {
  static async fetchModels(provider, apiKey, customUrl = "") {
    if (provider === "gemini") {
      const url2 = PROVIDER_DEFAULTS.gemini.modelsEndpoint.replace("{key}", encodeURIComponent(apiKey));
      const res2 = await fetch(url2);
      if (!res2.ok) {
        throw new Error(`HTTP ${res2.status}: ${res2.statusText}`);
      }
      const data2 = await res2.json();
      if (data2.models && Array.isArray(data2.models)) {
        return data2.models.filter((m) => m.name && m.supportedGenerationMethods?.includes("generateContent")).map((m) => ({
          id: m.name.replace("models/", ""),
          name: m.displayName || m.name.replace("models/", "")
        }));
      }
      return [];
    }
    let url = PROVIDER_DEFAULTS[provider]?.modelsEndpoint;
    if (provider === "custom") {
      url = customUrl.replace(/\/+$/, "") + "/models";
    }
    const headers = {};
    if (apiKey)
      headers["Authorization"] = `Bearer ${apiKey}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    const rawList = Array.isArray(data.data) ? data.data : Array.isArray(data.models) ? data.models : [];
    let models = rawList.map((m) => ({
      id: m.id || m.name,
      name: m.id || m.name
    }));
    if (provider === "groq") {
      models = models.filter((m) => !m.id.includes("whisper") && !m.id.includes("distil") && !m.id.includes("guard"));
    } else if (provider === "openai") {
      models = models.filter((m) => m.id.startsWith("gpt-"));
    }
    return models;
  }
  static async streamCompression({ provider, model, apiKey, customBaseUrl, rawInput, onChunk, signal }) {
    if (provider === "gemini") {
      return LLMService._streamGemini({ model, apiKey, rawInput, onChunk, signal });
    }
    return LLMService._streamOpenAICompat({ provider, model, apiKey, customBaseUrl, rawInput, onChunk, signal });
  }
  static async _streamGemini({ model, apiKey, rawInput, onChunk, signal }) {
    const endpoint = PROVIDER_DEFAULTS.gemini.endpoint.replace("{model}", encodeURIComponent(model)).replace("{key}", encodeURIComponent(apiKey));
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: `System Instruction:
${BASE_SYSTEM_PROMPT}

User Input to Compress and Translate:
${rawInput}` }]
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return parseSSEStream(response, (parsed) => parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? null, onChunk);
  }
  static async _streamOpenAICompat({ provider, model, apiKey, customBaseUrl, rawInput, onChunk, signal }) {
    let endpoint = PROVIDER_DEFAULTS[provider]?.endpoint;
    if (provider === "custom") {
      endpoint = customBaseUrl.replace(/\/+$/, "") + "/chat/completions";
    }
    const headers = { "Content-Type": "application/json" };
    if (apiKey)
      headers["Authorization"] = `Bearer ${apiKey}`;
    if (provider === "openrouter") {
      headers["HTTP-Referer"] = window.location.origin || "http://localhost";
      headers["X-Title"] = "Yapper Token Compressor";
    }
    const payload = {
      model,
      messages: [
        { role: "system", content: BASE_SYSTEM_PROMPT },
        { role: "user", content: rawInput }
      ],
      temperature: 0.2,
      stream: true
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return parseSSEStream(response, (parsed) => parsed.choices?.[0]?.delta?.content ?? null, onChunk);
  }
}

// js/utils/tokenEstimator.js
function estimateTokens(text, lang = "id") {
  if (!text || !text.trim())
    return 0;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const charCount = text.length;
  if (lang === "id") {
    const tokenByWords = words.length * 1.35;
    const tokenByChars = charCount / 3.6;
    return Math.max(1, Math.round((tokenByWords + tokenByChars) / 2));
  } else {
    const tokenByWords = words.length * 1.22;
    const tokenByChars = charCount / 4;
    return Math.max(1, Math.round((tokenByWords + tokenByChars) / 2));
  }
}

// js/controllers/AppController.js
class AppController {
  constructor({ state, historyModel, studioView, settingsView, historyView, toastView, confirmDialogView }) {
    this.state = state;
    this.historyModel = historyModel;
    this.studioView = studioView;
    this.settingsView = settingsView;
    this.historyView = historyView;
    this.toastView = toastView;
    this.confirmDialogView = confirmDialogView;
    this.isFetchingModels = false;
    this.fetchDebounceTimer = null;
    this._abortController = null;
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
      this.historyModel.setStrategy(saved.storageStrategy);
    }
  }
  renderInitialUI() {
    this.settingsView.renderConfig(this.state.getAll(), false);
    this.historyView.render(this.historyModel.getAll());
    const apiKey = this.state.get("apiKey");
    const provider = this.state.get("provider");
    const customUrl = this.state.get("customBaseUrl");
    if (apiKey || provider === "custom") {
      this.fetchModels(provider, apiKey, customUrl, false);
    } else {
      this.populateFallbackModels(provider);
    }
    this.updateInputMetrics(this.studioView.getRawInput());
  }
  bindEvents() {
    this.studioView.bindInput((text) => this.updateInputMetrics(text));
    this.studioView.bindClear(() => this.studioView.clearAll());
    this.studioView.bindSubmit(() => this.executeTranslation());
    this.studioView.bindCopy(() => this.handleCopy());
    this.studioView.bindDownload(() => this.handleExport());
    this.settingsView.bindToggle(() => this.settingsView.open());
    this.settingsView.bindClose(() => this.settingsView.close());
    this.settingsView.bindSave((formData) => this.handleSaveSettings(formData));
    this.settingsView.bindPurge(() => this.handlePurgeSettings());
    this.settingsView.bindProviderChange((provider) => this.handleProviderChange(provider));
    this.settingsView.bindApiKeyInput((key) => this.handleApiKeyChange(key, false));
    this.settingsView.bindApiKeyPaste((key, isPaste) => this.handleApiKeyChange(key, isPaste));
    this.settingsView.bindFetchModels(() => {
      this.fetchModels(this.state.get("provider"), this.settingsView.getCurrentApiKey(), this.settingsView.getCurrentBaseUrl(), true);
    });
    this.settingsView.bindModelSelectChange((model) => this.state.set("model", model));
    this.settingsView.bindModelInputChange((model) => this.state.set("model", model));
    this.historyView.bindToggle(() => this.historyView.open());
    this.historyView.bindClose(() => this.historyView.close());
    this.historyView.bindClear(() => this.handleClearHistory());
    this.historyView.bindRestore((id) => this.handleRestoreHistory(id));
    this.historyView.bindDeleteItem((id) => this.handleDeleteHistoryItem(id));
    document.addEventListener("keydown", (e) => this.handleKeyboardShortcuts(e));
  }
  updateInputMetrics(text) {
    const tokens = estimateTokens(text, "id");
    const chars = text ? text.length : 0;
    this.studioView.renderInputMetrics(tokens, chars);
  }
  updateOutputMetrics(outputText, startTime = null) {
    const inTokens = estimateTokens(this.studioView.getRawInput(), "id");
    const outTokens = estimateTokens(outputText, "en");
    const elapsed = startTime ? Math.round(performance.now() - startTime) : null;
    this.studioView.renderOutputMetrics(inTokens, outTokens, elapsed);
  }
  async fetchModels(provider, apiKey, customUrl = "", force = false) {
    if (!apiKey && provider !== "custom") {
      this.populateFallbackModels(provider);
      return;
    }
    if (this.isFetchingModels)
      return;
    this.isFetchingModels = true;
    this.settingsView.setFetchingModels(true);
    const providerName = PROVIDER_DEFAULTS[provider]?.name || provider;
    try {
      const models = await LLMService.fetchModels(provider, apiKey, customUrl);
      if (models.length > 0) {
        this.settingsView.renderModels(models, this.state.get("model"), `${models.length} Models`, `✓ ${models.length} active models loaded from ${providerName}.`);
        if (force) {
          this.toastView.show(`${models.length} model aktif berhasil dimuat dari ${providerName}!`, "success");
        }
      } else {
        throw new Error("Tidak ada model yang ditemukan untuk akun ini.");
      }
    } catch (err) {
      console.warn("Failed to fetch dynamic models:", err);
      this.populateFallbackModels(provider);
      if (force) {
        this.toastView.show(`Gagal memuat model: ${err.message}`, "error");
      }
    } finally {
      this.isFetchingModels = false;
      this.settingsView.setFetchingModels(false);
    }
  }
  populateFallbackModels(provider) {
    const fallbacks = PROVIDER_DEFAULTS[provider]?.fallbackModels || [];
    this.settingsView.renderModels(fallbacks, this.state.get("model"), `${fallbacks.length} Model (Default)`, "Pilih model rekomendasi atau masukkan API Key untuk melihat seluruh model akun Anda.");
  }
  handleProviderChange(newProvider) {
    const def = PROVIDER_DEFAULTS[newProvider];
    if (def) {
      this.state.set("provider", newProvider);
      this.state.set("model", def.defaultModel);
    }
    this.settingsView.renderConfig(this.state.getAll());
    this.fetchModels(newProvider, this.settingsView.getCurrentApiKey(), this.settingsView.getCurrentBaseUrl(), false);
  }
  handleApiKeyChange(val, isPaste = false) {
    if (isPaste) {
      this.fetchModels(this.state.get("provider"), val, this.settingsView.getCurrentBaseUrl(), true);
    } else {
      clearTimeout(this.fetchDebounceTimer);
      if (val.length >= 8) {
        this.fetchDebounceTimer = setTimeout(() => {
          this.fetchModels(this.state.get("provider"), val, this.settingsView.getCurrentBaseUrl(), false);
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
    this.historyModel.setStrategy(formData.storageStrategy);
    StorageModel.saveConfig(formData, formData.storageStrategy);
    this.settingsView.renderConfig(this.state.getAll());
    this.settingsView.close();
    this.toastView.show("Konfigurasi API berhasil disimpan!", "success");
  }
  handlePurgeSettings() {
    this.confirmDialogView.show({
      title: "Purge Stored Credentials",
      message: "Are you sure you want to permanently delete your stored API keys and cached configurations from this browser?",
      confirmText: "Purge All",
      danger: true,
      onConfirm: () => {
        StorageModel.purgeConfig();
        this.state.update({ apiKey: "" });
        this.populateFallbackModels(this.state.get("provider"));
        this.settingsView.renderConfig(this.state.getAll());
        this.toastView.show("API Key dan kredensial berhasil dibersihkan!", "success");
      }
    });
  }
  handleClearHistory() {
    this.confirmDialogView.show({
      title: "Clear All History",
      message: "Are you sure you want to permanently delete all prompt history records?",
      confirmText: "Clear History",
      danger: true,
      onConfirm: () => {
        this.historyModel.clear();
        this.historyView.render([]);
        this.toastView.show("Riwayat berhasil dibersihkan", "success");
      }
    });
  }
  handleDeleteHistoryItem(id) {
    this.historyModel.deleteById(id);
    this.historyView.render(this.historyModel.getAll());
    this.toastView.show("Prompt dihapus dari riwayat", "normal");
  }
  handleRestoreHistory(id) {
    const item = this.historyModel.findById(id);
    if (item) {
      this.studioView.setRawInput(item.rawInput);
      this.studioView.showOutput(item.outputText);
      this.updateInputMetrics(item.rawInput);
      this.updateOutputMetrics(item.outputText);
      this.historyView.close();
      this.toastView.show("Prompt dipulihkan dari riwayat", "success");
    }
  }
  async handleCopy() {
    const text = this.studioView.getOutputText();
    if (!text) {
      this.toastView.show("Tidak ada hasil prompt untuk disalin.", "error");
      return;
    }
    await this.studioView.copyText(text);
    this.studioView.setCopied(true);
    this.toastView.show("Prompt berhasil disalin ke clipboard!", "success");
    setTimeout(() => this.studioView.setCopied(false), 2000);
  }
  handleExport() {
    const text = this.studioView.getOutputText();
    if (!text) {
      this.toastView.show("Tidak ada prompt untuk diexport.", "error");
      return;
    }
    this.studioView.downloadAsMarkdown(text);
    this.toastView.show("File Markdown berhasil didownload", "success");
  }
  async executeTranslation() {
    const rawInput = this.studioView.getRawInput().trim();
    if (!rawInput) {
      this.toastView.show("Ketikkan input bahasa Indonesia terlebih dahulu!", "error");
      this.studioView.focusInput();
      return;
    }
    const provider = this.state.get("provider");
    const apiKey = this.state.get("apiKey");
    const model = this.state.get("model");
    const customBaseUrl = this.state.get("customBaseUrl");
    if (!apiKey && provider !== "custom") {
      this.toastView.show("Masukkan API Key Anda di Pengaturan untuk memproses prompt!", "error");
      this.settingsView.open();
      return;
    }
    this.state.set("isTranslating", true);
    this.settingsView.renderConfig(this.state.getAll(), true);
    this.studioView.setStreaming(true);
    const startTime = performance.now();
    this._abortController = new AbortController;
    try {
      const finalResult = await LLMService.streamCompression({
        provider,
        model,
        apiKey,
        customBaseUrl,
        rawInput,
        onChunk: (_chunk, accumulated) => {
          this.studioView.showOutput(accumulated);
          this.updateOutputMetrics(accumulated, startTime);
        },
        signal: this._abortController.signal
      });
      const inTokens = estimateTokens(rawInput, "id");
      const outTokens = estimateTokens(finalResult, "en");
      this.historyModel.add({ rawInput, outputText: finalResult, inTokens, outTokens });
      this.historyView.render(this.historyModel.getAll());
      this.updateOutputMetrics(finalResult, startTime);
      this.toastView.show("Prompt berhasil dikompresi & diterjemahkan!", "success");
    } catch (err) {
      if (err.name === "AbortError") {
        this.toastView.show("Proses dibatalkan.", "normal");
      } else {
        console.error("LLM API Error:", err);
        this.toastView.show(`Gagal: ${err.message}`, "error");
        this.studioView.showOutput(`[Error: ${err.message}]

Pastikan API Key benar dan memiliki kuota aktif.`);
      }
    } finally {
      this._abortController = null;
      this.state.set("isTranslating", false);
      this.studioView.setStreaming(false);
      this.settingsView.renderConfig(this.state.getAll(), false);
    }
  }
  handleKeyboardShortcuts(e) {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;
    if (cmdKey && e.key === "Enter") {
      e.preventDefault();
      this.executeTranslation();
    }
    if (cmdKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (this.settingsView.isOpen())
        this.settingsView.close();
      else
        this.settingsView.open();
    }
    if (cmdKey && e.key.toLowerCase() === "h") {
      e.preventDefault();
      if (this.historyView.isOpen())
        this.historyView.close();
      else
        this.historyView.open();
    }
    if (cmdKey && e.shiftKey && e.key.toLowerCase() === "c") {
      if (this.studioView.getOutputText()) {
        e.preventDefault();
        this.handleCopy();
      }
    }
    if (e.key === "Escape") {
      if (this.confirmDialogView.isOpen())
        this.confirmDialogView.close();
      else if (this.settingsView.isOpen())
        this.settingsView.close();
      else if (this.historyView.isOpen())
        this.historyView.close();
    }
  }
}

// js/app.js
function bootstrap() {
  const state = new AppState;
  const savedConfig = StorageModel.loadConfig();
  const initialStrategy = savedConfig?.storageStrategy ?? "local";
  const historyModel = new HistoryModel(30, initialStrategy);
  const studioView = new StudioView;
  const settingsView = new SettingsView;
  const historyView = new HistoryView;
  const toastView = new ToastView;
  const confirmDialogView = new ConfirmDialogView;
  const app = new AppController({
    state,
    historyModel,
    studioView,
    settingsView,
    historyView,
    toastView,
    confirmDialogView
  });
  app.init();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
