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
      mode: "prompt",
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
var PROMPT_SYSTEM_PROMPT = `You are a high-precision Telegraphic Prompt Optimization Engine.
Convert raw, informal, or unstructured inputs (Indonesian or casual English) into ultra-dense, token-minimized, production-grade English prompt directives.

Core Directives:
1. Maximum Semantic Density: Eliminate all rhetorical fluff, academic prose, and verbose padding (BAN phrases like "Implement a feature allowing users to...", "Ensure that...", "In order to...").
2. Telegraphic Imperative Style: Use compact, direct action verbs ("Add...", "Replace X with Y...", "Enforce...", "Refactor...", "Support..."). Express complete technical specifications in the fewest possible tokens.
3. 100% Technical Fidelity: Retain every constraint, negative requirement, framework/library, and edge case. Resolve typos and slang into precise technical concepts.
4. Concise Structure: Single tasks -> 1–2 crisp imperative sentences. Multi-requirement tasks -> tight bulleted directives.
5. Strict Output Only: Output ONLY the compiled English prompt. Absolutely NO intro, NO explanations, and NO surrounding quotation marks.`;
var TRANSLATE_ID_EN_SYSTEM_PROMPT = `You are an expert Indonesian-to-English translator specializing in fluent, natural, and idiomatic modern English.
Translate raw, casual, slang-heavy, conversational, or formal Indonesian inputs into smooth, grammatically sound, natural-sounding English.

Translation Rules:
1. Natural & Idiomatic English: NEVER do literal, word-for-word, or mechanical translation. Translate the authentic meaning, intent, and conversational flow so it reads like it was originally written by a native English speaker.
2. Slang, Colloquialisms & Nuance: Accurately resolve Indonesian slang (bahasa gaul, Jaksel, prokem, internet abbreviations like "baper", "gabut", "mager", "kepo", "wkwk", "ngab", "cuy", "ribet", "kudu", "santai aja", "gimana") and emphatic discourse particles ("dong", "sih", "deh", "lah", "kok", "kan") into their natural English conversational equivalents or tone.
3. Grammatical Accuracy & Flow: Ensure flawless English grammar, appropriate verb tenses, natural collocations, correct prepositions, and smooth sentence rhythm. Do not sound stiff, robotic, or overly academic unless the source text is formal.
4. Tone & Context Preservation: Match the register of the original text (casual conversation -> natural casual English; technical remark -> clean technical English; business/formal request -> polished professional English).
5. Technical Terms & Loanwords: Keep established technical jargon, library/framework names, and code identifiers exact while translating the surrounding context fluidly.
6. Strict Output Only: Output ONLY the translated English text. Do NOT include explanations, phonetic transcriptions, alternative options, notes, or surrounding quotes.`;
var TRANSLATE_EN_ID_SYSTEM_PROMPT = `You are an expert English-to-Indonesian translator specializing in natural, fluent, and idiomatic modern Indonesian.
Translate raw, formal, technical, or conversational English inputs into smooth, authentic, natural-sounding Indonesian.

Translation Rules:
1. Natural & Anti-Translationese: NEVER produce stiff, robotic, or literal "bahasa terjemahan" (avoid awkward overused constructs like "dalam rangka untuk", "silakan perhatikan bahwa", "adalah merupakan", or awkward passive voice). Translate the authentic meaning and intent into how real Indonesians write and speak.
2. Idiomatic Adaptation: Seamlessly adapt English idioms, phrasal verbs, and metaphors into their natural Indonesian equivalents or contextual meanings (e.g., "hit the ground running", "under the hood", "cut corners", "rule of thumb").
3. Register & Tone Matching: Match the register of the source text:
   - Casual / Conversational -> Smooth, contemporary, natural Indonesian (avoiding archaic words or hyper-formal phrasing).
   - Technical / Developer -> Clean, modern developer Indonesian.
   - Professional / Business -> Polished, clear, contemporary Indonesian.
4. Technical Terms & Code Preservation: Keep standard technical terms, code snippets, library/framework names, API endpoints, variable names, and established tech loanwords in their original English (e.g., "endpoint", "payload", "pipeline", "hook", "deploy", "runtime", "thread", "middleware") instead of forcing awkward, unfamiliar translations.
5. Grammatical Flow: Ensure fluid sentence cadence, appropriate affixation (imbuhan), and natural discourse flow.
6. Strict Output Only: Output ONLY the translated Indonesian text. Absolutely NO introductory phrases, NO notes, NO vocabulary breakdowns, and NO surrounding quotation marks.`;
var BASE_SYSTEM_PROMPT = PROMPT_SYSTEM_PROMPT;
var MODES = {
  PROMPT: "prompt",
  TRANSLATE: "translate"
};
var TRANSLATE_DIRECTIONS = {
  ID_EN: "id-en",
  EN_ID: "en-id"
};
var DIRECTION_CONFIGS = {
  [TRANSLATE_DIRECTIONS.ID_EN]: {
    direction: TRANSLATE_DIRECTIONS.ID_EN,
    inputLang: "ID",
    outputLang: "EN",
    windowTitleInput: "raw-input.id",
    windowTitleOutput: "natural-translation.en",
    outputHeading: "Fluent English Translation",
    submitText: "Translate to English",
    badge: "Fluent & Idiomatic",
    hint: "Translate",
    emptyDesc: "Enter raw Indonesian text on the left panel, then press <kbd>⌘</kbd> + <kbd>Enter</kbd> to translate into fluent, natural English.",
    systemPrompt: TRANSLATE_ID_EN_SYSTEM_PROMPT
  },
  [TRANSLATE_DIRECTIONS.EN_ID]: {
    direction: TRANSLATE_DIRECTIONS.EN_ID,
    inputLang: "EN",
    outputLang: "ID",
    windowTitleInput: "raw-input.en",
    windowTitleOutput: "fluent-translation.id",
    outputHeading: "Fluent Indonesian Translation",
    submitText: "Translate to Indonesian",
    badge: "Alami & Kontekstual",
    hint: "Translate",
    emptyDesc: "Enter English text on the left panel, then press <kbd>⌘</kbd> + <kbd>Enter</kbd> to translate into fluent, natural Indonesian.",
    systemPrompt: TRANSLATE_EN_ID_SYSTEM_PROMPT
  }
};
var MODE_CONFIGS = {
  [MODES.PROMPT]: {
    id: "prompt",
    name: "System Prompt",
    shortName: "Prompt",
    kicker: "[ TOKEN OPTIMIZATION · SYSTEM PROMPT TRANSLATOR ]",
    headline: "Transform informal Indonesian into dense English system prompts.",
    outputHeading: "Compressed System Prompt",
    submitText: "Compress & Translate",
    windowTitle: "compressed-prompt.en",
    badge: "Zero-Fluff BPE",
    hint: "Compress",
    emptyDesc: "Enter raw Indonesian text on the left panel, then press <kbd>⌘</kbd> + <kbd>Enter</kbd> to compile into a dense English prompt.",
    systemPrompt: PROMPT_SYSTEM_PROMPT
  },
  [MODES.TRANSLATE]: {
    id: "translate",
    name: "Natural Translation",
    shortName: "Translate",
    kicker: "[ NATURAL TRANSLATION · BIDIRECTIONAL FLUENT ]",
    headline: "Translate seamlessly between Indonesian and natural English.",
    outputHeading: "Fluent English Translation",
    submitText: "Translate to English",
    windowTitle: "natural-translation.en",
    badge: "Fluent & Idiomatic",
    hint: "Translate",
    emptyDesc: "Enter Indonesian or English on the left panel, then press <kbd>⌘</kbd> + <kbd>Enter</kbd> to translate naturally.",
    systemPrompt: TRANSLATE_ID_EN_SYSTEM_PROMPT
  }
};
var PROVIDER_DEFAULTS = {
  groq: {
    name: "Groq Cloud",
    defaultModel: "llama-3.3-70b-versatile",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelsEndpoint: "https://api.groq.com/openai/v1/models",
    placeholder: "gsk_...",
    keyGuide: 'Get your free API key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a>.',
    fallbackModels: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile (Recommended)" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant (Ultra-Fast)" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B 32k" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B IT" }
    ]
  },
  openrouter: {
    name: "OpenRouter",
    defaultModel: "meta-llama/llama-3.3-70b-instruct",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    modelsEndpoint: "https://openrouter.ai/api/v1/models",
    placeholder: "sk-or-v1-...",
    keyGuide: 'Get your API key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a>.',
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
    placeholder: "AIzaSy...",
    keyGuide: 'Get your free API key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">aistudio.google.com</a>.',
    fallbackModels: [
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Recommended)" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" }
    ]
  },
  openai: {
    name: "OpenAI",
    defaultModel: "gpt-4o-mini",
    endpoint: "https://api.openai.com/v1/chat/completions",
    modelsEndpoint: "https://api.openai.com/v1/models",
    placeholder: "sk-proj-...",
    keyGuide: 'Get your API key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">platform.openai.com/api-keys</a>.',
    fallbackModels: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Fast & Cost-Effective)" },
      { id: "gpt-4o", name: "GPT-4o (High Accuracy)" }
    ]
  },
  custom: {
    name: "Custom / Local (Ollama, LM Studio)",
    defaultModel: "llama3.2",
    endpoint: "http://localhost:11434/v1/chat/completions",
    modelsEndpoint: "http://localhost:11434/v1/models",
    placeholder: "Optional for local Ollama / vLLM",
    keyGuide: "Leave API key blank for local Ollama/LM Studio. Ensure local endpoint allows browser CORS requests.",
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
          mode: parsed.mode || "prompt",
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
      customBaseUrl: configData.customBaseUrl,
      mode: configData.mode || "prompt"
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
  add({ rawInput, outputText, inTokens, outTokens, mode = "prompt" }) {
    const item = {
      id: "hist_" + Date.now(),
      timestamp: new Date().toISOString(),
      rawInput: rawInput.trim(),
      outputText: outputText.trim(),
      inTokens,
      outTokens,
      mode
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
function isMac() {
  if (typeof navigator === "undefined")
    return true;
  if (navigator.userAgentData?.platform) {
    return /mac/i.test(navigator.userAgentData.platform);
  }
  const platform = navigator.platform || "";
  const userAgent = navigator.userAgent || "";
  return /Mac|iPhone|iPod|iPad/i.test(platform) || /Macintosh|Mac OS X/i.test(userAgent);
}
function getModifierKey() {
  return isMac() ? "⌘" : "Ctrl";
}
function applyPlatformShortcuts(root = document) {
  if (isMac())
    return;
  const titledElements = root.querySelectorAll('[title*="⌘"], [aria-label*="⌘"]');
  titledElements.forEach((el) => {
    const title = el.getAttribute("title");
    if (title && title.includes("⌘")) {
      el.setAttribute("title", title.replace(/⌘⇧C/g, "Ctrl+Shift+C").replace(/⌘⇧X/g, "Ctrl+Shift+X").replace(/⌘⏎/g, "Ctrl+Enter").replace(/⌘/g, "Ctrl+"));
    }
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel && ariaLabel.includes("⌘")) {
      el.setAttribute("aria-label", ariaLabel.replace(/⌘⇧C/g, "Ctrl+Shift+C").replace(/⌘⇧X/g, "Ctrl+Shift+X").replace(/⌘⏎/g, "Ctrl+Enter").replace(/⌘/g, "Ctrl+"));
    }
  });
  const kbds = root.querySelectorAll("kbd");
  kbds.forEach((kbd) => {
    const text = kbd.textContent?.trim();
    if (text === "⌘") {
      kbd.textContent = "Ctrl";
    } else if (text === "⌘⏎") {
      kbd.textContent = "Ctrl+Enter";
    } else if (text === "⌘⇧C") {
      kbd.textContent = "Ctrl+Shift+C";
    } else if (text === "⌘⇧X") {
      kbd.textContent = "Ctrl+Shift+X";
    } else if (text && text.startsWith("⌘")) {
      kbd.textContent = text.replace("⌘", "Ctrl+");
    }
  });
  const tooltips = root.querySelectorAll(".btn-tooltip");
  tooltips.forEach((tt) => {
    if (tt.innerHTML.includes("⌘")) {
      tt.innerHTML = tt.innerHTML.replace(/⌘⏎/g, "Ctrl+Enter").replace(/⌘⇧C/g, "Ctrl+Shift+C").replace(/⌘/g, "Ctrl+");
    }
  });
}

// js/views/StudioView.js
class StudioView {
  constructor() {
    this.btnModeToggle = document.getElementById("btn-mode-toggle");
    this.modeToggleName = document.getElementById("mode-toggle-name");
    this.modeToggleBadge = document.getElementById("mode-toggle-badge");
    this.modeToggleIcon = document.getElementById("mode-toggle-icon");
    this.modePills = document.querySelectorAll(".mode-pill");
    this.introKicker = document.getElementById("intro-kicker");
    this.introHeadline = document.getElementById("intro-headline");
    this.outputHeading = document.getElementById("output-heading");
    this.windowTitleOutput = document.getElementById("window-title-output");
    this.windowModeChip = document.getElementById("window-mode-chip");
    this.submitBtnText = document.querySelector("#btn-submit .btn-text");
    this.hintSubmit = document.getElementById("hint-submit");
    this.emptyDesc = document.getElementById("empty-desc");
    this.btnSwapDirection = document.getElementById("btn-swap-direction");
    this.rawInput = document.getElementById("raw-input");
    this.inputLangBadge = document.getElementById("input-lang-badge");
    this.windowTitleInput = document.getElementById("window-title-input");
    this.btnSubmit = document.getElementById("btn-submit");
    this.btnClearInput = document.getElementById("btn-clear-input");
    this.inputTokens = document.getElementById("input-tokens");
    this.inputChars = document.getElementById("input-chars");
    this.outputLangBadge = document.getElementById("output-lang-badge");
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
  renderLanguageBadge(langInfo = {}) {
    if (!this.inputLangBadge)
      return;
    const code = langInfo.code || "AUTO";
    this.inputLangBadge.textContent = code;
    this.inputLangBadge.className = `badge-lang font-mono ${code === "ID" ? "pastel-yellow" : code === "EN" ? "pastel-blue" : "pastel-gray"}`;
    this.inputLangBadge.title = `Detected Language: ${langInfo.name || "Auto Detect"}`;
    this.inputLangBadge.classList.remove("badge-pop");
    this.inputLangBadge.offsetWidth;
    this.inputLangBadge.classList.add("badge-pop");
    if (this.windowTitleInput) {
      this.windowTitleInput.textContent = code === "EN" ? "raw-input.en" : "raw-input.id";
    }
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
  setMode(mode = MODES.PROMPT) {
    const config = MODE_CONFIGS[mode] || MODE_CONFIGS[MODES.PROMPT];
    const isTranslate = mode === MODES.TRANSLATE;
    if (this.btnModeToggle) {
      this.btnModeToggle.dataset.mode = mode;
      this.btnModeToggle.setAttribute("aria-label", `Current mode: ${config.name}. Click to switch mode`);
      this.btnModeToggle.classList.toggle("mode-translate", isTranslate);
      this.btnModeToggle.classList.toggle("mode-prompt", !isTranslate);
      if (this.modeToggleName) {
        this.modeToggleName.textContent = config.name;
      }
      if (this.modeToggleBadge) {
        this.modeToggleBadge.textContent = config.shortName;
      }
      this.btnModeToggle.classList.remove("pulse-mode");
      this.btnModeToggle.offsetWidth;
      this.btnModeToggle.classList.add("pulse-mode");
    }
    if (this.modePills) {
      this.modePills.forEach((pill) => {
        const isActive = pill.dataset.mode === mode;
        pill.classList.toggle("active", isActive);
        pill.setAttribute("aria-selected", isActive ? "true" : "false");
      });
    }
    if (this.introKicker && config.kicker) {
      this.introKicker.textContent = config.kicker;
    }
    if (this.introHeadline && config.headline) {
      this.introHeadline.textContent = config.headline;
    }
    this.updateDirectionUI({ mode, direction: TRANSLATE_DIRECTIONS.ID_EN });
  }
  updateDirectionUI({ mode = MODES.PROMPT, direction = TRANSLATE_DIRECTIONS.ID_EN, langInfo = {} }) {
    const mod = getModifierKey();
    if (mode === MODES.PROMPT) {
      if (this.outputLangBadge) {
        this.outputLangBadge.textContent = "EN";
        this.outputLangBadge.className = "badge-lang pastel-green font-mono";
        this.outputLangBadge.title = "Output: Optimized English Prompt";
      }
      if (this.outputHeading) {
        this.outputHeading.textContent = MODE_CONFIGS[MODES.PROMPT].outputHeading;
      }
      if (this.windowTitleOutput) {
        this.windowTitleOutput.textContent = MODE_CONFIGS[MODES.PROMPT].windowTitle;
      }
      if (this.submitBtnText) {
        this.submitBtnText.textContent = MODE_CONFIGS[MODES.PROMPT].submitText;
      }
      if (this.windowModeChip) {
        this.windowModeChip.textContent = MODE_CONFIGS[MODES.PROMPT].badge;
      }
      if (this.emptyDesc) {
        this.emptyDesc.innerHTML = MODE_CONFIGS[MODES.PROMPT].emptyDesc.replace(/<kbd>⌘<\/kbd>/g, `<kbd>${mod}</kbd>`);
      }
      if (this.hintSubmit) {
        this.hintSubmit.innerHTML = `<kbd>${mod}</kbd>+<kbd>Enter</kbd> ${MODE_CONFIGS[MODES.PROMPT].hint}`;
      }
      return;
    }
    const dirConfig = DIRECTION_CONFIGS[direction] || DIRECTION_CONFIGS[TRANSLATE_DIRECTIONS.ID_EN];
    const isEnToId = direction === TRANSLATE_DIRECTIONS.EN_ID;
    if (this.outputLangBadge) {
      this.outputLangBadge.textContent = dirConfig.outputLang;
      this.outputLangBadge.className = `badge-lang font-mono ${isEnToId ? "pastel-yellow" : "pastel-green"}`;
      this.outputLangBadge.title = `Target Language: ${isEnToId ? "Indonesian" : "English"}`;
      this.outputLangBadge.classList.remove("badge-pop");
      this.outputLangBadge.offsetWidth;
      this.outputLangBadge.classList.add("badge-pop");
    }
    if (this.outputHeading) {
      this.outputHeading.textContent = dirConfig.outputHeading;
    }
    if (this.windowTitleOutput) {
      this.windowTitleOutput.textContent = dirConfig.windowTitleOutput;
    }
    if (this.submitBtnText) {
      this.submitBtnText.textContent = dirConfig.submitText;
    }
    if (this.windowModeChip) {
      this.windowModeChip.textContent = dirConfig.badge;
    }
    if (this.emptyDesc) {
      this.emptyDesc.innerHTML = dirConfig.emptyDesc.replace(/<kbd>⌘<\/kbd>/g, `<kbd>${mod}</kbd>`);
    }
    if (this.hintSubmit && dirConfig.hint) {
      this.hintSubmit.innerHTML = `<kbd>${mod}</kbd>+<kbd>Enter</kbd> ${dirConfig.hint}`;
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
  bindModeChange(handler) {
    if (this.btnModeToggle) {
      this.btnModeToggle.addEventListener("click", () => {
        const currentMode = this.btnModeToggle.dataset.mode || MODES.PROMPT;
        const nextMode = currentMode === MODES.PROMPT ? MODES.TRANSLATE : MODES.PROMPT;
        handler(nextMode);
      });
    }
    if (this.modePills && this.modePills.length > 0) {
      this.modePills.forEach((pill) => {
        pill.addEventListener("click", (e) => {
          const mode = e.currentTarget.dataset.mode;
          if (mode)
            handler(mode);
        });
      });
    }
  }
  bindSwapDirection(handler) {
    if (this.btnSwapDirection) {
      this.btnSwapDirection.addEventListener("click", handler);
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
    this.connectionStatus = document.getElementById("connection-status");
    this.statusText = document.getElementById("status-text");
    this.apiKeyLabel = document.getElementById("api-key-label");
    this._bindInternalEvents();
  }
  _bindInternalEvents() {
    if (this.btnToggleKeyVisibility) {
      this.btnToggleKeyVisibility.addEventListener("click", () => {
        this.toggleKeyVisibility();
      });
    }
    if (this.btnToggleModelMode) {
      this.btnToggleModelMode.addEventListener("click", () => {
        this.toggleModelMode();
      });
    }
    if (this.modal) {
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal)
          this.close();
      });
    }
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
    if (this.apiKeyInput && this.apiKeyInput.type !== "password") {
      this.apiKeyInput.type = "password";
    }
    if (this.btnToggleKeyVisibility) {
      this.btnToggleKeyVisibility.textContent = "Show Key";
      this.btnToggleKeyVisibility.setAttribute("aria-label", "Show API Key");
    }
  }
  isOpen() {
    return this.modal ? this.modal.classList.contains("open") : false;
  }
  renderConfig(config, isTranslating = false) {
    if (this.providerSelect)
      this.providerSelect.value = config.provider;
    if (this.apiKeyInput) {
      this.apiKeyInput.value = config.apiKey;
      this.apiKeyInput.type = "password";
      const def = PROVIDER_DEFAULTS[config.provider];
      if (def?.placeholder) {
        this.apiKeyInput.placeholder = def.placeholder;
      }
    }
    if (this.btnToggleKeyVisibility) {
      this.btnToggleKeyVisibility.textContent = "Show Key";
      this.btnToggleKeyVisibility.setAttribute("aria-label", "Show API Key");
    }
    if (this.apiKeyLabel) {
      this.apiKeyLabel.textContent = config.provider === "custom" ? "API Key (Optional)" : "API Key";
    }
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
    const isPassword = this.apiKeyInput.type === "password";
    this.apiKeyInput.type = isPassword ? "text" : "password";
    this.btnToggleKeyVisibility.textContent = isPassword ? "Hide Key" : "Show Key";
    this.btnToggleKeyVisibility.setAttribute("aria-label", isPassword ? "Hide API Key" : "Show API Key");
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
    if (this.btnToggleKeyVisibility && handler) {
      this.btnToggleKeyVisibility.addEventListener("click", handler);
    }
  }
  bindToggleModelMode(handler) {
    if (this.btnToggleModelMode && handler) {
      this.btnToggleModelMode.addEventListener("click", handler);
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
      const isTranslate = item.mode === "translate";
      let modeLabel = "COMPRESSED";
      if (isTranslate) {
        modeLabel = item.direction === "en-id" ? "EN → ID" : "ID → EN";
      }
      const savings = item.inTokens > 0 ? Math.round((item.inTokens - item.outTokens) / item.inTokens * 100) : 0;
      return `
        <div class="history-item" data-id="${item.id}" tabindex="0" role="button" aria-label="Restore prompt history">
          <div class="history-item-meta">
            <div class="history-item-meta-info">
              <span>${timeStr} · ${modeLabel}</span>
              <span class="badge-saving">${savings > 0 ? `-${savings}%` : isTranslate ? "0%" : "0%"}</span>
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
  static async streamCompression({ provider, model, apiKey, customBaseUrl, rawInput, systemPrompt = BASE_SYSTEM_PROMPT, onChunk, signal }) {
    if (provider === "gemini") {
      return LLMService._streamGemini({ model, apiKey, rawInput, systemPrompt, onChunk, signal });
    }
    return LLMService._streamOpenAICompat({ provider, model, apiKey, customBaseUrl, rawInput, systemPrompt, onChunk, signal });
  }
  static async _streamGemini({ model, apiKey, rawInput, systemPrompt = BASE_SYSTEM_PROMPT, onChunk, signal }) {
    const endpoint = PROVIDER_DEFAULTS.gemini.endpoint.replace("{model}", encodeURIComponent(model)).replace("{key}", encodeURIComponent(apiKey));
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: `System Instruction:
${systemPrompt}

User Input:
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
  static async _streamOpenAICompat({ provider, model, apiKey, customBaseUrl, rawInput, systemPrompt = BASE_SYSTEM_PROMPT, onChunk, signal }) {
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
        { role: "system", content: systemPrompt },
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

// js/utils/langDetect.js
var ID_WORDS = new Set([
  "yang",
  "di",
  "dan",
  "ini",
  "itu",
  "dengan",
  "untuk",
  "tidak",
  "ada",
  "dari",
  "aku",
  "kamu",
  "dia",
  "mereka",
  "kita",
  "kami",
  "lu",
  "gue",
  "gw",
  "lo",
  "loe",
  "elu",
  "ane",
  "ente",
  "baper",
  "gabut",
  "mager",
  "kepo",
  "gokil",
  "mantul",
  "ribet",
  "ngab",
  "cuy",
  "wkwk",
  "kudu",
  "santai",
  "gimana",
  "kenapa",
  "napa",
  "knp",
  "bgt",
  "banget",
  "udah",
  "udh",
  "dah",
  "belum",
  "blm",
  "blom",
  "pengen",
  "mau",
  "mo",
  "bisa",
  "gabisa",
  "gamau",
  "gausah",
  "gaada",
  "gak",
  "tdk",
  "tak",
  "iya",
  "ya",
  "emang",
  "emg",
  "tapi",
  "tp",
  "terus",
  "trus",
  "abis",
  "habis",
  "kalo",
  "klo",
  "kl",
  "kalau",
  "jika",
  "supaya",
  "biar",
  "agar",
  "buat",
  "bagi",
  "sama",
  "sm",
  "ama",
  "dgn",
  "pake",
  "pke",
  "pakai",
  "pakek",
  "bikin",
  "jadi",
  "jd",
  "adalah",
  "yaitu",
  "yakni",
  "dmn",
  "dimana",
  "kesini",
  "kesana",
  "disini",
  "disana",
  "ke",
  "dlm",
  "dalam",
  "luar",
  "atas",
  "bawah",
  "depan",
  "belakang",
  "pas",
  "waktu",
  "saat",
  "lagi",
  "lg",
  "sedang",
  "masih",
  "msh",
  "baru",
  "bbrp",
  "beberapa",
  "semua",
  "smua",
  "banyak",
  "bnyk",
  "dikit",
  "sedikit",
  "kurang",
  "krg",
  "lebih",
  "lbh",
  "paling",
  "plg",
  "selalu",
  "sering",
  "jarang",
  "pernah",
  "prnh",
  "bakal",
  "bkl",
  "akan",
  "boleh",
  "harus",
  "hrs",
  "musti",
  "wajib",
  "tolong",
  "tlg",
  "bantu",
  "bantuin",
  "minta",
  "coba",
  "dong",
  "sih",
  "kok",
  "deh",
  "lah",
  "nih",
  "tuh",
  "kan",
  "yuk",
  "gan",
  "bro",
  "sis",
  "kak",
  "bang"
]);
var EN_WORDS = new Set([
  "the",
  "and",
  "that",
  "have",
  "for",
  "not",
  "with",
  "you",
  "this",
  "but",
  "his",
  "from",
  "they",
  "say",
  "her",
  "she",
  "will",
  "one",
  "all",
  "would",
  "there",
  "their",
  "what",
  "out",
  "about",
  "who",
  "get",
  "which",
  "go",
  "me",
  "when",
  "make",
  "can",
  "like",
  "time",
  "no",
  "just",
  "him",
  "know",
  "take",
  "person",
  "into",
  "year",
  "your",
  "good",
  "some",
  "could",
  "them",
  "see",
  "other",
  "than",
  "then",
  "now",
  "look",
  "only",
  "come",
  "its",
  "over",
  "think",
  "also",
  "back",
  "after",
  "use",
  "two",
  "how",
  "our",
  "work",
  "first",
  "well",
  "way",
  "even",
  "new",
  "want",
  "because",
  "any",
  "these",
  "give",
  "day",
  "most",
  "us",
  "is",
  "are",
  "was",
  "were",
  "been",
  "being",
  "should",
  "must",
  "might",
  "shall",
  "please",
  "create",
  "build",
  "add",
  "remove",
  "update",
  "fix",
  "refactor",
  "test"
]);
var ID_AFFIX_REGEX = /^(me|di|ke|se|pe|ber|ter|men|mem|meng|meny)[a-z]{3,}|[a-z]{3,}(kan|an|i|nya|lah|kah|pun)$/i;
function detectLanguage(text) {
  if (!text || typeof text !== "string") {
    return { code: "AUTO", label: "AUTO", name: "Auto Detect", isIndonesian: true };
  }
  const cleaned = text.trim();
  if (cleaned.length < 3) {
    return { code: "AUTO", label: "AUTO", name: "Auto Detect", isIndonesian: true };
  }
  const words = cleaned.toLowerCase().match(/[a-z]{2,}/g) || [];
  if (words.length === 0) {
    return { code: "AUTO", label: "AUTO", name: "Auto Detect", isIndonesian: true };
  }
  let idScore = 0;
  let enScore = 0;
  for (const word of words) {
    if (ID_WORDS.has(word)) {
      idScore += 2;
    } else if (ID_AFFIX_REGEX.test(word)) {
      idScore += 1;
    }
    if (EN_WORDS.has(word)) {
      enScore += 2;
    }
  }
  if (idScore === 0 && enScore === 0) {
    return { code: "AUTO", label: "AUTO", name: "Auto Detect", isIndonesian: true };
  }
  if (idScore >= enScore) {
    return { code: "ID", label: "ID", name: "Indonesian", isIndonesian: true };
  } else {
    return { code: "EN", label: "EN", name: "English", isIndonesian: false };
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
    this.manualDirection = null;
  }
  init() {
    applyPlatformShortcuts();
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
        mode: saved.mode || MODES.PROMPT,
        storageStrategy: saved.storageStrategy
      });
      this.historyModel.setStrategy(saved.storageStrategy);
    }
  }
  renderInitialUI() {
    this.settingsView.renderConfig(this.state.getAll(), false);
    this.historyView.render(this.historyModel.getAll());
    this.studioView.setMode(this.state.get("mode") || MODES.PROMPT);
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
    this.studioView.bindClear(() => {
      this.manualDirection = null;
      this.studioView.clearAll();
    });
    this.studioView.bindSubmit(() => this.executeTranslation());
    this.studioView.bindCopy(() => this.handleCopy());
    this.studioView.bindDownload(() => this.handleExport());
    this.studioView.bindModeChange((mode) => this.handleModeChange(mode));
    this.studioView.bindSwapDirection(() => this.handleSwapDirection());
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
    this.settingsView.bindToggleKeyVisibility();
    this.settingsView.bindToggleModelMode();
    this.historyView.bindToggle(() => this.historyView.open());
    this.historyView.bindClose(() => this.historyView.close());
    this.historyView.bindClear(() => this.handleClearHistory());
    this.historyView.bindRestore((id) => this.handleRestoreHistory(id));
    this.historyView.bindDeleteItem((id) => this.handleDeleteHistoryItem(id));
    document.addEventListener("keydown", (e) => this.handleKeyboardShortcuts(e));
  }
  resolveDirection(text = null) {
    if (this.state.get("mode") !== MODES.TRANSLATE) {
      return TRANSLATE_DIRECTIONS.ID_EN;
    }
    if (this.manualDirection) {
      return this.manualDirection;
    }
    const targetText = text !== null ? text : this.studioView.getRawInput();
    const langInfo = detectLanguage(targetText);
    return langInfo.code === "EN" || !langInfo.isIndonesian ? TRANSLATE_DIRECTIONS.EN_ID : TRANSLATE_DIRECTIONS.ID_EN;
  }
  updateInputMetrics(text) {
    const langInfo = detectLanguage(text);
    const mode = this.state.get("mode") || MODES.PROMPT;
    const direction = this.resolveDirection(text);
    const effectiveInLang = mode === MODES.TRANSLATE && direction === TRANSLATE_DIRECTIONS.EN_ID ? "en" : langInfo.isIndonesian ? "id" : "en";
    const tokens = estimateTokens(text, effectiveInLang);
    const chars = text ? text.length : 0;
    this.studioView.renderInputMetrics(tokens, chars);
    this.studioView.renderLanguageBadge(langInfo);
    this.studioView.updateDirectionUI({ mode, direction, langInfo });
  }
  updateOutputMetrics(outputText, startTime = null) {
    const rawInput = this.studioView.getRawInput();
    const mode = this.state.get("mode") || MODES.PROMPT;
    const direction = this.resolveDirection(rawInput);
    const inLang = mode === MODES.TRANSLATE && direction === TRANSLATE_DIRECTIONS.EN_ID ? "en" : "id";
    const outLang = mode === MODES.TRANSLATE && direction === TRANSLATE_DIRECTIONS.EN_ID ? "id" : "en";
    const inTokens = estimateTokens(rawInput, inLang);
    const outTokens = estimateTokens(outputText, outLang);
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
  handleModeChange(mode) {
    if (this.state.get("mode") === mode)
      return;
    this.manualDirection = null;
    this.state.set("mode", mode);
    this.studioView.setMode(mode);
    const config = this.state.getAll();
    StorageModel.saveConfig(config, config.storageStrategy);
    const modeName = mode === MODES.TRANSLATE ? "Natural Translation" : "System Prompt";
    this.toastView.show(`Mode aktif: ${modeName}`, "normal");
    this.updateInputMetrics(this.studioView.getRawInput());
  }
  handleSwapDirection() {
    const rawInput = this.studioView.getRawInput();
    const outputText = this.studioView.getOutputText();
    if (outputText) {
      this.manualDirection = null;
      this.studioView.setRawInput(outputText);
      this.studioView.showOutput(rawInput);
      this.updateInputMetrics(outputText);
      this.updateOutputMetrics(rawInput);
      this.toastView.show("Teks dan arah terjemahan ditukar!", "normal");
    } else {
      const currentDir = this.resolveDirection(rawInput);
      this.manualDirection = currentDir === TRANSLATE_DIRECTIONS.EN_ID ? TRANSLATE_DIRECTIONS.ID_EN : TRANSLATE_DIRECTIONS.EN_ID;
      this.updateInputMetrics(rawInput);
      const label = this.manualDirection === TRANSLATE_DIRECTIONS.EN_ID ? "English → Indonesia" : "Indonesia → English";
      this.toastView.show(`Arah terjemahan: ${label}`, "normal");
    }
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
      this.toastView.show("Ketikkan teks input terlebih dahulu!", "error");
      this.studioView.focusInput();
      return;
    }
    const provider = this.state.get("provider");
    const apiKey = this.state.get("apiKey");
    const model = this.state.get("model");
    const customBaseUrl = this.state.get("customBaseUrl");
    const mode = this.state.get("mode") || MODES.PROMPT;
    let systemPrompt;
    let direction = TRANSLATE_DIRECTIONS.ID_EN;
    if (mode === MODES.TRANSLATE) {
      direction = this.resolveDirection(rawInput);
      systemPrompt = direction === TRANSLATE_DIRECTIONS.EN_ID ? TRANSLATE_EN_ID_SYSTEM_PROMPT : TRANSLATE_ID_EN_SYSTEM_PROMPT;
    } else {
      systemPrompt = MODE_CONFIGS[mode]?.systemPrompt || BASE_SYSTEM_PROMPT;
    }
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
        systemPrompt,
        onChunk: (_chunk, accumulated) => {
          this.studioView.showOutput(accumulated);
          this.updateOutputMetrics(accumulated, startTime);
        },
        signal: this._abortController.signal
      });
      const inLang = mode === MODES.TRANSLATE && direction === TRANSLATE_DIRECTIONS.EN_ID ? "en" : "id";
      const outLang = mode === MODES.TRANSLATE && direction === TRANSLATE_DIRECTIONS.EN_ID ? "id" : "en";
      const inTokens = estimateTokens(rawInput, inLang);
      const outTokens = estimateTokens(finalResult, outLang);
      this.historyModel.add({
        rawInput,
        outputText: finalResult,
        inTokens,
        outTokens,
        mode,
        direction: mode === MODES.TRANSLATE ? direction : undefined
      });
      this.historyView.render(this.historyModel.getAll());
      this.updateOutputMetrics(finalResult, startTime);
      let successMsg;
      if (mode === MODES.TRANSLATE) {
        successMsg = direction === TRANSLATE_DIRECTIONS.EN_ID ? "Teks berhasil diterjemahkan ke bahasa Indonesia alami!" : "Teks berhasil diterjemahkan ke bahasa Inggris alami!";
      } else {
        successMsg = "Prompt berhasil dikompresi & diterjemahkan!";
      }
      this.toastView.show(successMsg, "success");
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
    const cmdKey = isMac() ? e.metaKey : e.ctrlKey;
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
    if (cmdKey && e.key.toLowerCase() === "m") {
      e.preventDefault();
      const currentMode = this.state.get("mode") || MODES.PROMPT;
      const nextMode = currentMode === MODES.PROMPT ? MODES.TRANSLATE : MODES.PROMPT;
      this.handleModeChange(nextMode);
    }
    const isX = e.key && e.key.toLowerCase() === "x" || e.code === "KeyX";
    if (cmdKey && e.shiftKey && isX) {
      e.preventDefault();
      this.handleSwapDirection();
    }
    const isCopyKey = e.key && e.key.toLowerCase() === "c" || e.code === "KeyC";
    if (cmdKey && isCopyKey) {
      const hasOutput = Boolean(this.studioView.getOutputText());
      if (e.shiftKey) {
        if (hasOutput) {
          e.preventDefault();
          this.handleCopy();
        }
      } else {
        const selection = window.getSelection()?.toString() || "";
        const isEditingInput = document.activeElement && (document.activeElement.tagName === "TEXTAREA" || document.activeElement.tagName === "INPUT");
        if (!selection && !isEditingInput && hasOutput) {
          e.preventDefault();
          this.handleCopy();
        }
      }
    }
    if (e.key === "Escape") {
      if (this.confirmDialogView.isOpen()) {
        this.confirmDialogView.close();
      } else if (this.settingsView.isOpen()) {
        this.settingsView.close();
      } else if (this.historyView.isOpen()) {
        this.historyView.close();
      } else {
        e.preventDefault();
        if (this._abortController) {
          this._abortController.abort();
        }
        this.manualDirection = null;
        this.studioView.clearAll();
      }
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
