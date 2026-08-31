/**
 * AppState Model
 * Central observable state store with subscriber notifications
 */

export class AppState {
  constructor(initialState = {}) {
    this._state = {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      apiKey: '',
      storageStrategy: 'local', // 'local' | 'session'
      customBaseUrl: 'http://localhost:11434/v1',
      isTranslating: false,
      abortController: null,
      ...initialState
    };
    this._listeners = new Set();
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
      this._notify('*', this.getAll());
    }
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify(key, value) {
    this._listeners.forEach(listener => {
      try {
        listener(key, value, this.getAll());
      } catch (err) {
        console.error('AppState listener error:', err);
      }
    });
  }
}
