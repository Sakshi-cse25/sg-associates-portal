document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('galleryGrid');
  const statusEl = document.getElementById('galleryStatus');
  const modal = document.getElementById('galleryModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalImage = document.getElementById('modalImage');
  const modalProject = document.getElementById('modalProject');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const { escapeHtml, fetchJson } = sgUtils;

  function closeModal() {
    modal.classList.remove('is-open');
    modalImage.src = '';
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  statusEl.textContent = 'Loading site gallery...';
  try {
    const { ok, payload } = await fetchJson('/api/gallery');
    if (!ok) throw new Error(payload.error || 'Failed to load gallery');

    const items = payload.gallery || [];
    statusEl.textContent = '';

    if (items.length === 0) {
      grid.innerHTML = '<p>No gallery photographs available yet.</p>';
      return;
    }

    grid.innerHTML = items
      .map(
        (item, idx) => `
        <article class="card gallery-card">
          <img src="${escapeHtml(item.file_path)}" alt="${escapeHtml(item.caption)}" loading="lazy">
          <div class="gallery-card-body">
            <h3>${escapeHtml(item.caption)}</h3>
            <p>${escapeHtml(item.project_title || 'General Civil Work')}</p>
            <button class="btn btn-secondary btn-sm gallery-view-btn" type="button" data-idx="${idx}" style="margin-top: 0.65rem;">
              Enlarge View
            </button>
          </div>
        </article>
      `
      )
      .join('');

    grid.querySelectorAll('.gallery-view-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = items[Number(btn.dataset.idx)];
        if (!item) return;
        modalTitle.textContent = item.caption;
        modalImage.src = item.file_path;
        modalImage.alt = item.caption;
        modalProject.textContent = item.project_title
          ? `Project: ${item.project_title}`
          : 'General Civil Engineering Documentation';
        modal.classList.add('is-open');
        modalCloseBtn.focus();
      });
    });
  } catch (err) {
    statusEl.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
});
