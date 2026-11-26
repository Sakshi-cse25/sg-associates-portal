document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('loginForm');
  const alertEl = document.getElementById('loginAlert');
  const loginBtn = document.getElementById('loginBtn');
  const { escapeHtml, fetchJson } = sgUtils;

  // Redirect directly if already authenticated
  try {
    const sessionCheck = await fetchJson('/api/admin/me');
    if (sessionCheck.ok) {
      window.location.href = '/admin.html';
      return;
    }
  } catch (_) {
    // Stay on login page
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    alertEl.innerHTML = '';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      alertEl.innerHTML = '<div class="alert alert-error">Please enter both username and password.</div>';
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';

    try {
      const { ok, payload } = await fetchJson('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (ok) {
        window.location.href = '/admin.html';
      } else {
        alertEl.innerHTML = `<div class="alert alert-error">${escapeHtml(payload.error || 'Login failed.')}</div>`;
      }
    } catch (_) {
      alertEl.innerHTML = '<div class="alert alert-error">Network error while logging in.</div>';
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Log In';
    }
  });
});
