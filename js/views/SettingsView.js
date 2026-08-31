/**
 * SettingsView
 * Manages Configuration Modal, Provider Selector, Model Catalog, Key Visibility, and Header Status Indicators
 */

import { PROVIDER_DEFAULTS } from '../config/constants.js';

export class SettingsView {
  constructor() {
    this.modal = document.getElementById('settings-modal');
    this.btnToggle = document.getElementById('btn-settings-toggle');
    this.btnClose = document.getElementById('btn-close-settings');
    this.btnCancel = document.getElementById('btn-cancel-settings');
    this.btnSave = document.getElementById('btn-save-settings');
    this.btnPurge = document.getElementById('btn-purge-key');

    // Form inputs
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

    // Header Status Chips
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

    // Toggle Custom URL input visibility
    if (config.provider === 'custom') {
      if (this.baseUrlGroup) this.baseUrlGroup.classList.remove('hidden');
    } else {
      if (this.baseUrlGroup) this.baseUrlGroup.classList.add('hidden');
    }

    // Provider guide
    const guide = PROVIDER_DEFAULTS[config.provider]?.keyGuide || '';
    if (this.providerKeyGuide) this.providerKeyGuide.innerHTML = guide;

    // Header badges
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

  // Event bindings
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
