/**
 * HistoryView
 * Manages Prompt History Drawer, List Rendering, and Restore Interaction
 */

import { escapeHtml } from '../utils/domUtils.js';

export class HistoryView {
  constructor() {
    this.drawer = document.getElementById('history-drawer');
    this.backdrop = document.getElementById('drawer-backdrop');
    this.btnToggle = document.getElementById('btn-history-toggle');
    this.btnClose = document.getElementById('btn-close-history');
    this.btnClear = document.getElementById('btn-clear-history');
    this.emptyState = document.getElementById('history-empty');
    this.list = document.getElementById('history-list');
  }

  open() {
    if (this.drawer) {
      this.drawer.classList.add('open');
      this.drawer.setAttribute('aria-hidden', 'false');
    }
    if (this.backdrop) {
      this.backdrop.classList.add('open');
    }
  }

  close() {
    if (this.drawer) {
      this.drawer.classList.remove('open');
      this.drawer.setAttribute('aria-hidden', 'true');
    }
    if (this.backdrop) {
      this.backdrop.classList.remove('open');
    }
  }

  isOpen() {
    return this.drawer ? this.drawer.classList.contains('open') : false;
  }

  render(items = []) {
    if (!this.emptyState || !this.list) return;

    if (!items || items.length === 0) {
      this.emptyState.classList.remove('hidden');
      this.list.innerHTML = '';
      return;
    }

    this.emptyState.classList.add('hidden');
    this.list.innerHTML = items.map(item => {
      const date = new Date(item.timestamp);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const savings = item.inTokens > 0 ? Math.round(((item.inTokens - item.outTokens) / item.inTokens) * 100) : 0;

      return `
        <div class="history-item" data-id="${item.id}" tabindex="0" role="button" aria-label="Restore prompt history">
          <div class="history-item-meta">
            <div class="history-item-meta-info">
              <span>${timeStr} · COMPRESSED</span>
              <span class="badge-saving">${savings > 0 ? `-${savings}%` : '0%'}</span>
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
    }).join('');
  }

  // Event bindings
  bindToggle(handler) {
    if (this.btnToggle) this.btnToggle.addEventListener('click', handler);
  }

  bindClose(handler) {
    if (this.btnClose) this.btnClose.addEventListener('click', handler);
    if (this.backdrop) this.backdrop.addEventListener('click', handler);
  }

  bindClear(handler) {
    if (this.btnClear) this.btnClear.addEventListener('click', handler);
  }

  bindRestore(handler) {
    if (this.list) {
      this.list.addEventListener('click', (e) => {
        if (e.target.closest('.btn-history-item-delete')) return;
        const itemEl = e.target.closest('.history-item');
        if (itemEl) {
          const id = itemEl.getAttribute('data-id');
          handler(id);
        }
      });
    }
  }

  bindDeleteItem(handler) {
    if (this.list) {
      this.list.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-history-item-delete');
        if (deleteBtn) {
          e.stopPropagation();
          const id = deleteBtn.getAttribute('data-id');
          handler(id);
        }
      });
    }
  }
}
