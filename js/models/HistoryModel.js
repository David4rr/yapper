/**
 * HistoryModel
 * Manages local prompt history persistence, retrieval, and truncation.
 * Respects storageStrategy: 'local' | 'session'
 */

import { STORAGE_KEYS } from '../config/constants.js';

export class HistoryModel {
  constructor(maxItems = 30, storageStrategy = 'local') {
    this.maxItems = maxItems;
    this._strategy = storageStrategy;
    this.history = [];
    this.load();
  }

  /** Update storage backend when user changes strategy in settings */
  setStrategy(strategy) {
    if (strategy !== this._strategy) {
      // Migrate existing history to new backend
      const current = JSON.stringify(this.history);
      this._getStorage(strategy).setItem(STORAGE_KEYS.HISTORY, current);
      this._getStorage(this._strategy).removeItem(STORAGE_KEYS.HISTORY);
      this._strategy = strategy;
    }
  }

  load() {
    // Try local first, fall back to session (handles strategy-agnostic init)
    let stored = localStorage.getItem(STORAGE_KEYS.HISTORY)
      || sessionStorage.getItem(STORAGE_KEYS.HISTORY);
    try {
      this.history = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to parse history from storage:', e);
      this.history = [];
    }
    return this.history;
  }

  save() {
    try {
      this._getStorage(this._strategy).setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
    } catch (e) {
      console.warn('Failed to persist history to storage:', e);
    }
  }

  add({ rawInput, outputText, inTokens, outTokens, mode = 'prompt' }) {
    const item = {
      id: 'hist_' + Date.now(),
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
    return this.history.find(h => h.id === id) || null;
  }

  deleteById(id) {
    this.history = this.history.filter(h => h.id !== id);
    this.save();
    return this.history;
  }

  clear() {
    this.history = [];
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    sessionStorage.removeItem(STORAGE_KEYS.HISTORY);
  }

  _getStorage(strategy) {
    return strategy === 'session' ? sessionStorage : localStorage;
  }
}
