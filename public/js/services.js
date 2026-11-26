document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('servicesGrid');
  const statusEl = document.getElementById('servicesStatus');
  const { escapeHtml, fetchJson } = sgUtils;

  statusEl.textContent = 'Loading civil services...';

  try {
    const { ok, payload } = await fetchJson('/api/services');
    if (!ok) throw new Error(payload.error || 'Failed to load services');

    const services = payload.services || [];
    statusEl.textContent = '';

    if (services.length === 0) {
      grid.innerHTML = '<p>No services have been listed yet.</p>';
      return;
    }

    grid.innerHTML = services
      .map(
        (service) => `
        <article class="card">
          <span class="card-tag">${escapeHtml(service.icon || 'service')}</span>
          <h3>${escapeHtml(service.title)}</h3>
          <p>${escapeHtml(service.description)}</p>
          <div style="margin-top: auto; padding-top: 0.5rem;">
            <a class="btn btn-secondary btn-sm" href="/contact.html?service=${encodeURIComponent(service.service_id)}">
              Enquire About This Service
            </a>
          </div>
        </article>
      `
      )
      .join('');
  } catch (err) {
    statusEl.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
});
