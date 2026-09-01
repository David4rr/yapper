/**
 * StudioView
 * Manages the core workspace UI (Input, Output, Metrics Telemetry, Actions, Mode Switcher)
 */

import { MODE_CONFIGS, MODES } from '../config/constants.js';

export class StudioView {
  constructor() {
    // Mode Switcher Elements
    this.btnModeToggle = document.getElementById('btn-mode-toggle');
    this.modeToggleName = document.getElementById('mode-toggle-name');
    this.modeToggleBadge = document.getElementById('mode-toggle-badge');
    this.modeToggleIcon = document.getElementById('mode-toggle-icon');
    this.modePills = document.querySelectorAll('.mode-pill');
    this.introKicker = document.getElementById('intro-kicker');
    this.introHeadline = document.getElementById('intro-headline');
    this.outputHeading = document.getElementById('output-heading');
    this.windowTitleOutput = document.getElementById('window-title-output');
    this.windowModeChip = document.getElementById('window-mode-chip');
    this.submitBtnText = document.querySelector('#btn-submit .btn-text');
    this.hintSubmit = document.getElementById('hint-submit');
    this.emptyDesc = document.getElementById('empty-desc');

    // Inputs & Metrics & Language Auto-detect
    this.rawInput = document.getElementById('raw-input');
    this.inputLangBadge = document.getElementById('input-lang-badge');
    this.windowTitleInput = document.getElementById('window-title-input');
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

  renderLanguageBadge(langInfo = {}) {
    if (!this.inputLangBadge) return;
    const code = langInfo.code || 'AUTO';
    this.inputLangBadge.textContent = code;
    this.inputLangBadge.className = `badge-lang font-mono ${
      code === 'ID' ? 'pastel-yellow' : code === 'EN' ? 'pastel-blue' : 'pastel-gray'
    }`;
    this.inputLangBadge.title = `Detected Language: ${langInfo.name || 'Auto Detect'}`;

    // Micro-pop pulse animation
    this.inputLangBadge.classList.remove('badge-pop');
    void this.inputLangBadge.offsetWidth;
    this.inputLangBadge.classList.add('badge-pop');

    if (this.windowTitleInput) {
      this.windowTitleInput.textContent = code === 'EN' ? 'raw-input.en' : 'raw-input.id';
    }
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
  setMode(mode = MODES.PROMPT) {
    const config = MODE_CONFIGS[mode] || MODE_CONFIGS[MODES.PROMPT];
    const isTranslate = mode === MODES.TRANSLATE;

    // Update unique single toggle button
    if (this.btnModeToggle) {
      this.btnModeToggle.dataset.mode = mode;
      this.btnModeToggle.setAttribute('aria-label', `Current mode: ${config.name}. Click to switch mode`);
      this.btnModeToggle.classList.toggle('mode-translate', isTranslate);
      this.btnModeToggle.classList.toggle('mode-prompt', !isTranslate);

      if (this.modeToggleName) {
        this.modeToggleName.textContent = config.name;
      }
      if (this.modeToggleBadge) {
        this.modeToggleBadge.textContent = config.shortName;
      }

      // Trigger subtle pulse transition
      this.btnModeToggle.classList.remove('pulse-mode');
      void this.btnModeToggle.offsetWidth;
      this.btnModeToggle.classList.add('pulse-mode');
    }

    // Update pills if present
    if (this.modePills) {
      this.modePills.forEach(pill => {
        const isActive = pill.dataset.mode === mode;
        pill.classList.toggle('active', isActive);
        pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    // Update UI headers & context
    if (this.introKicker && config.kicker) {
      this.introKicker.textContent = config.kicker;
    }
    if (this.introHeadline && config.headline) {
      this.introHeadline.textContent = config.headline;
    }
    if (this.outputHeading && config.outputHeading) {
      this.outputHeading.textContent = config.outputHeading;
    }
    if (this.submitBtnText && config.submitText) {
      this.submitBtnText.textContent = config.submitText;
    }
    if (this.windowTitleOutput && config.windowTitle) {
      this.windowTitleOutput.textContent = config.windowTitle;
    }
    if (this.windowModeChip && config.badge) {
      this.windowModeChip.textContent = config.badge;
    }
    if (this.hintSubmit && config.hint) {
      this.hintSubmit.innerHTML = `<kbd>⌘</kbd>+<kbd>Enter</kbd> ${config.hint}`;
    }
    if (this.emptyDesc && config.emptyDesc) {
      this.emptyDesc.innerHTML = config.emptyDesc;
    }
  }

  // ---------------------------------------------------------------------------
  // Self-contained DOM actions — controller MUST call these instead of direct DOM
  // ---------------------------------------------------------------------------

  async copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  downloadAsMarkdown(text) {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Event bindings
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
  bindModeChange(handler) {
    if (this.btnModeToggle) {
      this.btnModeToggle.addEventListener('click', () => {
        const currentMode = this.btnModeToggle.dataset.mode || MODES.PROMPT;
        const nextMode = currentMode === MODES.PROMPT ? MODES.TRANSLATE : MODES.PROMPT;
        handler(nextMode);
      });
    }
    if (this.modePills && this.modePills.length > 0) {
      this.modePills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          const mode = e.currentTarget.dataset.mode;
          if (mode) handler(mode);
        });
      });
    }
  }
}
