/**
 * Safe DOM Utilities and String Sanitization
 */

export function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

export function isMac() {
  if (typeof navigator === 'undefined') return true;
  if (navigator.userAgentData?.platform) {
    return /mac/i.test(navigator.userAgentData.platform);
  }
  const platform = navigator.platform || '';
  const userAgent = navigator.userAgent || '';
  return /Mac|iPhone|iPod|iPad/i.test(platform) || /Macintosh|Mac OS X/i.test(userAgent);
}

export function getModifierKey() {
  return isMac() ? '⌘' : 'Ctrl';
}

/**
 * Adapts Mac shortcut symbols (⌘) across the DOM to Windows/Linux friendly shortcuts (Ctrl).
 */
export function applyPlatformShortcuts(root = document) {
  if (isMac()) return;

  // Replace ⌘ in title and aria-label attributes
  const titledElements = root.querySelectorAll('[title*="⌘"], [aria-label*="⌘"]');
  titledElements.forEach(el => {
    const title = el.getAttribute('title');
    if (title && title.includes('⌘')) {
      el.setAttribute('title', title.replace(/⌘⇧C/g, 'Ctrl+Shift+C')
                                   .replace(/⌘⏎/g, 'Ctrl+Enter')
                                   .replace(/⌘/g, 'Ctrl+'));
    }
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.includes('⌘')) {
      el.setAttribute('aria-label', ariaLabel.replace(/⌘⇧C/g, 'Ctrl+Shift+C')
                                             .replace(/⌘⏎/g, 'Ctrl+Enter')
                                             .replace(/⌘/g, 'Ctrl+'));
    }
  });

  // Replace text in <kbd> elements
  const kbds = root.querySelectorAll('kbd');
  kbds.forEach(kbd => {
    const text = kbd.textContent?.trim();
    if (text === '⌘') {
      kbd.textContent = 'Ctrl';
    } else if (text === '⌘⏎') {
      kbd.textContent = 'Ctrl+Enter';
    } else if (text === '⌘⇧C') {
      kbd.textContent = 'Ctrl+Shift+C';
    } else if (text && text.startsWith('⌘')) {
      kbd.textContent = text.replace('⌘', 'Ctrl+');
    }
  });

  // Replace text in tooltips
  const tooltips = root.querySelectorAll('.btn-tooltip');
  tooltips.forEach(tt => {
    if (tt.innerHTML.includes('⌘')) {
      tt.innerHTML = tt.innerHTML.replace(/⌘⏎/g, 'Ctrl+Enter')
                                 .replace(/⌘⇧C/g, 'Ctrl+Shift+C')
                                 .replace(/⌘/g, 'Ctrl+');
    }
  });
}
