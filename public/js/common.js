/**
 * Shared client-side helpers:
 *  - Mobile navigation toggle
 *  - HTML output escaping (XSS defense)
 *  - Fetch JSON wrapper
 */

const sgUtils = (() => {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    const payload = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, payload };
  }

  function initNavigation() {
    const toggleBtn = document.getElementById('navToggle');
    const navMenu = document.getElementById('mainNav');
    if (toggleBtn && navMenu) {
      toggleBtn.addEventListener('click', () => {
        const expanded = navMenu.classList.toggle('is-open');
        toggleBtn.setAttribute('aria-expanded', String(expanded));
      });
    }

    const yearEl = document.getElementById('footerYear');
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  document.addEventListener('DOMContentLoaded', initNavigation);

  return { escapeHtml, fetchJson };
})();
