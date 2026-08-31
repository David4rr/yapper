/**
 * HistoryModel
 * Manages local prompt history persistence, retrieval, and truncation
 */

import { STORAGE_KEYS } from '../config/constants.js';

export class HistoryModel {
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
