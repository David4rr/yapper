/**
 * AppController
 * Lean event orchestrator: bridges Models and Views, owns no DOM, owns no UI strings.
 */

import { PROVIDER_DEFAULTS } from '../config/constants.js';
import { StorageModel } from '../models/StorageModel.js';
import { LLMService } from '../services/LLMService.js';
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
    this._abortController = null; // runtime handle — not part of serializable state
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
    // Studio
    this.studioView.bindInput(text => this.updateInputMetrics(text));
    this.studioView.bindClear(() => this.studioView.clearAll());
    this.studioView.bindSubmit(() => this.executeTranslation());
    this.studioView.bindCopy(() => this.handleCopy());
    this.studioView.bindDownload(() => this.handleExport());

    // Settings
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
        this.settingsView.getCurrentApiKey(),
        this.settingsView.getCurrentBaseUrl(),
        true
      );
    });
    this.settingsView.bindModelSelectChange(model => this.state.set('model', model));
    this.settingsView.bindModelInputChange(model => this.state.set('model', model));

    // History
    this.historyView.bindToggle(() => this.historyView.open());
    this.historyView.bindClose(() => this.historyView.close());
    this.historyView.bindClear(() => this.handleClearHistory());
    this.historyView.bindRestore(id => this.handleRestoreHistory(id));

    // Global shortcuts
    document.addEventListener('keydown', e => this.handleKeyboardShortcuts(e));
  }

  // ---------------------------------------------------------------------------
  // Metrics
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Model catalog
  // ---------------------------------------------------------------------------

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
      const models = await LLMService.fetchModels(provider, apiKey, customUrl);
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
      'Pilih model rekomendasi atau masukkan API Key untuk melihat seluruh model akun Anda.'
    );
  }

  // ---------------------------------------------------------------------------
  // Settings handlers
  // ---------------------------------------------------------------------------

  handleProviderChange(newProvider) {
    const def = PROVIDER_DEFAULTS[newProvider];
    if (def) {
      this.state.set('provider', newProvider);
      this.state.set('model', def.defaultModel);
    }

    this.settingsView.renderConfig(this.state.getAll());
    this.fetchModels(
      newProvider,
      this.settingsView.getCurrentApiKey(),
      this.settingsView.getCurrentBaseUrl(),
      false
    );
  }

  handleApiKeyChange(val, isPaste = false) {
    if (isPaste) {
      this.fetchModels(
        this.state.get('provider'),
        val,
        this.settingsView.getCurrentBaseUrl(),
        true
      );
    } else {
      clearTimeout(this.fetchDebounceTimer);
      if (val.length >= 8) {
        this.fetchDebounceTimer = setTimeout(() => {
          this.fetchModels(
            this.state.get('provider'),
            val,
            this.settingsView.getCurrentBaseUrl(),
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

    this.historyModel.setStrategy(formData.storageStrategy);
    StorageModel.saveConfig(formData, formData.storageStrategy);
    this.settingsView.renderConfig(this.state.getAll());
    this.settingsView.close();
    this.toastView.show('Konfigurasi API berhasil disimpan!', 'success');
  }

  handlePurgeSettings() {
    // confirm() delegated to View — UI concern
    this.settingsView.confirmPurge(() => {
      StorageModel.purgeConfig();
      this.state.update({ apiKey: '' });
      this.populateFallbackModels(this.state.get('provider'));
      this.settingsView.renderConfig(this.state.getAll());
      this.toastView.show('API Key dan kredensial berhasil dibersihkan!', 'success');
    });
  }

  // ---------------------------------------------------------------------------
  // History handlers
  // ---------------------------------------------------------------------------

  handleClearHistory() {
    // confirm() delegated to View — UI concern
    this.historyView.confirmClear(() => {
      this.historyModel.clear();
      this.historyView.render([]);
      this.toastView.show('Riwayat berhasil dibersihkan', 'success');
    });
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

  // ---------------------------------------------------------------------------
  // Output actions — DOM ops delegated to View
  // ---------------------------------------------------------------------------

  async handleCopy() {
    const text = this.studioView.getOutputText();
    if (!text) {
      this.toastView.show('Tidak ada hasil prompt untuk disalin.', 'error');
      return;
    }

    await this.studioView.copyText(text);
    this.studioView.setCopied(true);
    this.toastView.show('Prompt berhasil disalin ke clipboard!', 'success');
    setTimeout(() => this.studioView.setCopied(false), 2000);
  }

  handleExport() {
    const text = this.studioView.getOutputText();
    if (!text) {
      this.toastView.show('Tidak ada prompt untuk diexport.', 'error');
      return;
    }

    this.studioView.downloadAsMarkdown(text);
    this.toastView.show('File Markdown berhasil didownload', 'success');
  }

  // ---------------------------------------------------------------------------
  // Core translation
  // ---------------------------------------------------------------------------

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
    this._abortController = new AbortController();

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
      this._abortController = null;
      this.state.set('isTranslating', false);
      this.studioView.setStreaming(false);
      this.settingsView.renderConfig(this.state.getAll(), false);
    }
  }

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts
  // ---------------------------------------------------------------------------

  handleKeyboardShortcuts(e) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    if (cmdKey && e.key === 'Enter') {
      e.preventDefault();
      this.executeTranslation();
    }

    if (cmdKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (this.settingsView.isOpen()) this.settingsView.close();
      else this.settingsView.open();
    }

    if (cmdKey && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      if (this.historyView.isOpen()) this.historyView.close();
      else this.historyView.open();
    }

    if (cmdKey && e.shiftKey && e.key.toLowerCase() === 'c') {
      if (this.studioView.getOutputText()) {
        e.preventDefault();
        this.handleCopy();
      }
    }

    if (e.key === 'Escape') {
      if (this.settingsView.isOpen()) this.settingsView.close();
      else if (this.historyView.isOpen()) this.historyView.close();
    }
  }
}
