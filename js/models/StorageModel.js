/**
 * StorageModel
 * Manages persistence and removal of configuration credentials across localStorage / sessionStorage
 */

import { STORAGE_KEYS } from '../config/constants.js';

export class StorageModel {
  static loadConfig() {
    let stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
    let strategy = 'local';

    if (!stored) {
      stored = sessionStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored) strategy = 'session';
    }

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          provider: parsed.provider || 'groq',
          model: parsed.model || 'llama-3.3-70b-versatile',
          apiKey: parsed.apiKey || '',
          customBaseUrl: parsed.customBaseUrl || 'http://localhost:11434/v1',
          storageStrategy: strategy
        };
      } catch (err) {
        console.error('Failed to parse stored configuration:', err);
      }
    }

    return null;
  }

  static saveConfig(configData, strategy = 'local') {
    const serialized = JSON.stringify({
      provider: configData.provider,
      model: configData.model,
      apiKey: configData.apiKey,
      customBaseUrl: configData.customBaseUrl
    });

    if (strategy === 'local') {
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
