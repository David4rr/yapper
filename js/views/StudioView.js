/**
 * StudioView
 * Manages the core workspace UI (Input, Output, Metrics Telemetry, Actions)
 */

export class StudioView {
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
}
