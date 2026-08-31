/**
 * AppController
 * Orchestrates application workflows, bridges Models and Views, and manages user interaction logic
 */

import { PROVIDER_DEFAULTS } from '../config/constants.js';
import { StorageModel } from '../models/StorageModel.js';
import { LLMClient } from '../models/LLMClient.js';
import { estimateTokens } from '../utils/tokenEstimator.js';

export class AppController {
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
    // Render initial settings and header badges
    this.settingsView.renderConfig(this.state.getAll(), this.state.get('isTranslating'));

    // Render history
    this.historyView.render(this.historyModel.getAll());

    // Fetch models or populate fallbacks
    const apiKey = this.state.get('apiKey');
    const provider = this.state.get('provider');
    const customUrl = this.state.get('customBaseUrl');

    if (apiKey || provider === 'custom') {
      this.fetchModels(provider, apiKey, customUrl, false);
    } else {
      this.populateFallbackModels(provider);
    }

    // Update input metrics for initial textarea value
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
    const tokens = estimateTokens(text, 'id');
    const chars = text ? text.length : 0;
    this.studioView.renderInputMetrics(tokens, chars);
  }

  updateOutputMetrics(outputText, startTime = null) {
    const inTokens = estimateTokens(this.studioView.getRawInput(), 'id');
    const outTokens = estimateTokens(outputText, 'en');
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
      // Fallback
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

    // Set UI loading state
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

      // Save to history & metrics
      const inTokens = estimateTokens(rawInput, 'id');
      const outTokens = estimateTokens(finalResult, 'en');

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
